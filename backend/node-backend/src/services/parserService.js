/**
 * Parser Service - orchestrates concept parsing and creation
 */
const { GeminiConceptExtractor, ConceptInterpolationService } = require('./geminiService');
const ConceptService = require('./conceptService');
const config = require('../config');

class ParserService {
  /**
   * Main entry point: Parse text and create all concepts in database
   */
  static async parseAndCreateConcepts(text, category = '') {
    try {
      // Step 1: Extract concepts from text using Gemini
      const extractor = new GeminiConceptExtractor();
      const extractionResult = await extractor.extractConceptsFromText(text, category);

      let concepts = extractionResult.concepts || [];
      const relationships = extractionResult.relationships || [];
      const finalCategory = extractionResult.category || category || 'Uncategorized';

      // Step 2: Interpolate missing prerequisites using domain rules
      concepts = ConceptInterpolationService.interpolateWithRules(concepts);

      // Step 3: Create all concepts in database
      const createdConcepts = [];
      const conceptMap = {}; // Map title -> MongoDB ID for relationship lookup

      // Create fundamental concepts first
      for (const conceptData of concepts) {
        if (conceptData.is_fundamental) {
          try {
            const concept = await ParserService._createConcept(conceptData, finalCategory);
            createdConcepts.push(concept);
            conceptMap[conceptData.title] = concept._id;
          } catch (error) {
            console.warn(`Warning: Could not create concept ${conceptData.title}: ${error.message}`);
          }
        }
      }

      // Then create dependent concepts
      for (const conceptData of concepts) {
        if (!conceptData.is_fundamental) {
          try {
            const concept = await ParserService._createConcept(
              conceptData,
              finalCategory,
              conceptMap,
              relationships
            );
            createdConcepts.push(concept);
            conceptMap[conceptData.title] = concept._id;
          } catch (error) {
            console.warn(`Warning: Could not create concept ${conceptData.title}: ${error.message}`);
          }
        }
      }

      // Step 4: Establish relationships
      const interpolated = concepts.filter(c => 
        !extractionResult.concepts.some(oc => oc.concept_id === c.concept_id)
      );

      const establishedRelationships = await ParserService._establishRelationships(
        relationships,
        conceptMap
      );

      return {
        created_count: createdConcepts.length,
        created_concepts: createdConcepts.map(c => ({
          concept_id: c.concept_id,
          title: c.title,
          description: c.description,
          difficulty_level: c.difficulty_level,
          prerequisites: c.prerequisites.map(p => p.concept_id || p)
        })),
        relationships_count: establishedRelationships.length,
        established_relationships: establishedRelationships,
        interpolated_count: interpolated.length,
        interpolated_concepts: interpolated.map(c => c.title),
        category: finalCategory,
        summary: extractionResult.summary || '',
        learning_path: extractionResult.learning_path || ''
      };
    } catch (error) {
      throw new Error(`Parsing failed: ${error.message}`);
    }
  }

  /**
   * Create a single concept in the database
   */
  static async _createConcept(conceptData, category, conceptMap = {}, relationships = []) {
    if (!conceptData.concept_id) {
      throw new Error(`Concept missing concept_id: ${conceptData.title}`);
    }

    // Check if concept already exists
    const existing = await ConceptService.getConceptById(conceptData.concept_id);
    if (existing) {
      return existing;
    }

    // Get prerequisites from relationships (already extracted by Gemini)
    const prerequisites = [];
    if (Object.keys(conceptMap).length > 0 && relationships.length > 0) {
      const conceptTitle = conceptData.title;

      // Find prerequisite titles from relationships
      for (const rel of relationships) {
        if (rel.concept && rel.concept.toLowerCase() === conceptTitle.toLowerCase()) {
          const prereqTitle = rel.prerequisite;
          // Find matching concept in map
          for (const [title, mongoId] of Object.entries(conceptMap)) {
            if (title.toLowerCase() === prereqTitle.toLowerCase()) {
              if (mongoId) {
                prerequisites.push(mongoId);
              }
              break;
            }
          }
        }
      }
    }

    // Create concept with prerequisites
    const concept = await ConceptService.createConcept({
      concept_id: conceptData.concept_id,
      title: conceptData.title,
      description: conceptData.description || '',
      category,
      difficulty_level: conceptData.difficulty_level || 1,
      prerequisites
    });

    return concept;
  }

  /**
   * Establish prerequisite relationships between concepts
   */
  static async _establishRelationships(relationships, conceptMap) {
    const established = [];

    for (const rel of relationships) {
      const conceptTitle = rel.concept;
      const prereqTitle = rel.prerequisite;

      // Find concept IDs from map
      let conceptId = null;
      let prereqId = null;

      for (const [title, mongoId] of Object.entries(conceptMap)) {
        if (title.toLowerCase() === conceptTitle.toLowerCase()) {
          conceptId = mongoId;
        }
        if (title.toLowerCase() === prereqTitle.toLowerCase()) {
          prereqId = mongoId;
        }
      }

      // If both found, establish relationship
      if (conceptId && prereqId) {
        try {
          const concept = await ConceptService.getConceptByMongoId(conceptId);
          
          if (concept && !concept.prerequisites.includes(prereqId)) {
            concept.prerequisites.push(prereqId);
            await concept.save();

            established.push({
              concept: concept.concept_id,
              prerequisite: prereqTitle,
              reason: rel.reason || ''
            });
          }
        } catch (error) {
          console.warn(`Warning: Could not establish relationship: ${error.message}`);
        }
      }
    }

    return established;
  }

  /**
   * Infer category from text content
   */
  static inferCategoryFromText(text) {
    const textLower = text.toLowerCase();
    const categoryKeywords = config.CATEGORY_KEYWORDS;

    // Count keyword matches
    const scores = {};
    for (const [category, keywordsList] of Object.entries(categoryKeywords)) {
      let score = 0;
      for (const keyword of keywordsList) {
        if (textLower.includes(keyword)) {
          score++;
        }
      }
      if (score > 0) {
        scores[category] = score;
      }
    }

    if (Object.keys(scores).length > 0) {
      return Object.keys(scores).reduce((a, b) => 
        scores[a] > scores[b] ? a : b
      );
    }

    return 'General Knowledge';
  }
}

/**
 * Concept Refine Service - validation and fixes for concept trees
 */
class ConceptRefineService {
  /**
   * Validate a concept tree and apply fixes
   */
  static async validateAndFixTree(category) {
    const concepts = await ConceptService.getConceptsByCategory(category);
    const issues = [];
    const fixes = [];

    // Check for circular dependencies
    for (const concept of concepts) {
      try {
        const chain = await concept.getDependencyChain();
        if (chain.includes(concept.concept_id)) {
          issues.push({
            type: 'circular_dependency',
            concept: concept.title,
            message: `Circular dependency detected`
          });
        }
      } catch (error) {
        // Continue checking other concepts
      }
    }

    // Check for reasonable difficulty progression
    for (const concept of concepts) {
      if (concept.prerequisites && concept.prerequisites.length > 0) {
        let maxPrereqDifficulty = 1;
        for (const prereq of concept.prerequisites) {
          const prereqDoc = typeof prereq === 'object' ? prereq : 
            await ConceptService.getConceptByMongoId(prereq);
          
          if (prereqDoc && prereqDoc.difficulty_level > maxPrereqDifficulty) {
            maxPrereqDifficulty = prereqDoc.difficulty_level;
          }
        }

        if (concept.difficulty_level <= maxPrereqDifficulty) {
          concept.difficulty_level = maxPrereqDifficulty + 1;
          await concept.save();
          
          fixes.push({
            type: 'difficulty_adjustment',
            concept: concept.title,
            new_difficulty: concept.difficulty_level
          });
        }
      }
    }

    return {
      category,
      total_concepts: concepts.length,
      issues_found: issues.length,
      issues,
      fixes_applied: fixes.length,
      fixes,
      validation_status: issues.length === 0 ? 'passed' : 'has_issues'
    };
  }
}

module.exports = {
  ParserService,
  ConceptRefineService
};
