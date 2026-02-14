/**
 * Gemini API integration for concept extraction and dependency interpolation
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

class GeminiConceptExtractor {
  constructor() {
    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }
    
    this.client = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  /**
   * Extract concepts from text using Gemini API
   */
  async extractConceptsFromText(text, category = '') {
    const prompt = this._buildExtractionPrompt(text, category);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      const parsed = this._parseGeminiResponse(responseText);
      return parsed;
    } catch (error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Build the prompt for concept extraction
   */
  _buildExtractionPrompt(text, category = '') {
    const categoryHint = category ? `The concepts are primarily in category: ${category}` : '';
    
    return `You are an expert educational curriculum designer. Parse the following text about topics, 
table of contents, or concepts someone wants to learn. Extract structured information about 
each concept and their relationships.

${categoryHint}

Input Text:
${text}

Analyze this and respond with ONLY a valid JSON object (no markdown, no code blocks, 
starting with { and ending with }):

{
  "category": "inferred or provided category name",
  "concepts": [
    {
      "title": "concept name",
      "description": "1-2 sentence description",
      "concept_id": "snake_case_id",
      "difficulty_level": 1-10,
      "is_fundamental": true/false
    }
  ],
  "relationships": [
    {
      "concept": "concept_title",
      "prerequisite": "prerequisite_title",
      "reason": "brief reason why prerequisite is needed"
    }
  ],
  "summary": "brief summary of the skill tree",
  "learning_path": "suggested order to learn these concepts"
}

Rules:
1. Infer difficulty levels (1=foundational, 10=advanced specialist)
2. Mark foundational concepts with is_fundamental: true
3. Extract ALL prerequisite relationships from the text
4. Generate sanitized concept_ids in snake_case
5. Ensure the JSON is valid and complete`;
  }

  /**
   * Parse and validate Gemini API JSON response
   */
  _parseGeminiResponse(responseText) {
    // Remove markdown code blocks if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    
    try {
      const result = JSON.parse(cleaned);
      return result;
    } catch (error) {
      // Try to extract JSON from response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Continue to throw original error
        }
      }
      throw new Error(`Could not parse Gemini response as JSON: ${error.message}`);
    }
  }

  /**
   * Generate sanitized concept_id from title
   */
  _generateConceptId(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
  }
}

/**
 * Concept interpolation service - adds missing prerequisites
 */
class ConceptInterpolationService {
  /**
   * Interpolate concepts using domain-specific rules
   */
  static interpolateWithRules(concepts) {
    const mathPrereqs = config.MATH_PREREQUISITES;
    const interpolated = [...concepts];
    
    for (const concept of concepts) {
      const title = concept.title.toLowerCase();
      
      for (const [key, values] of Object.entries(mathPrereqs)) {
        if (title.includes(key.toLowerCase())) {
          // Add missing prerequisites
          for (const prereq of values) {
            const exists = interpolated.some(c => 
              c.title.toLowerCase() === prereq.toLowerCase()
            );
            
            if (!exists) {
              // Create interpolated concept
              interpolated.unshift({
                title: prereq.charAt(0).toUpperCase() + prereq.slice(1),
                description: `Foundational concept for ${concept.title}`,
                concept_id: this._generateConceptId(prereq),
                difficulty_level: 1,
                is_fundamental: true
              });
            }
          }
          break;
        }
      }
    }
    
    return interpolated;
  }

  /**
   * Generate concept_id from title
   */
  static _generateConceptId(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
  }
}

module.exports = {
  GeminiConceptExtractor,
  ConceptInterpolationService
};
