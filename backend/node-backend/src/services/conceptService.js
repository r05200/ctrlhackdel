/**
 * Concept Service - database operations for concepts
 */
const Concept = require('../models/Concept');

class ConceptService {
  /**
   * Create a new concept
   */
  static async createConcept(conceptData) {
    const {
      concept_id,
      title,
      description = '',
      category,
      difficulty_level = 1,
      prerequisites = []
    } = conceptData;

    // Check if concept already exists
    const existing = await Concept.findOne({ concept_id });
    if (existing) {
      return existing;
    }

    // Create new concept
    const concept = new Concept({
      concept_id,
      title,
      description,
      category,
      difficulty_level,
      prerequisites
    });

    await concept.save();
    return concept;
  }

  /**
   * Get concept by ID
   */
  static async getConceptById(conceptId) {
    return await Concept.findOne({ concept_id: conceptId }).populate('prerequisites');
  }

  /**
   * Get concept by MongoDB ID
   */
  static async getConceptByMongoId(mongoId) {
    return await Concept.findById(mongoId).populate('prerequisites');
  }

  /**
   * Get all concepts in category
   */
  static async getConceptsByCategory(category) {
    return await Concept.find({ category })
      .sort({ difficulty_level: 1 })
      .populate('prerequisites');
  }

  /**
   * Get concepts by difficulty level
   */
  static async getConceptsByDifficulty(category, minLevel, maxLevel) {
    return await Concept.find({
      category,
      difficulty_level: { $gte: minLevel, $lte: maxLevel }
    }).populate('prerequisites');
  }

  /**
   * Get concept dependency tree for category
   */
  static async getCategoryTree(category) {
    const concepts = await Concept.find({ category })
      .sort({ difficulty_level: 1 })
      .populate('prerequisites');
    
    return {
      category,
      concept_count: concepts.length,
      concepts: concepts.map(c => ({
        concept_id: c.concept_id,
        title: c.title,
        description: c.description,
        difficulty_level: c.difficulty_level,
        prerequisites: c.prerequisites.map(p => ({
          concept_id: p.concept_id,
          title: p.title
        }))
      }))
    };
  }

  /**
   * Get all concepts
   */
  static async getAllConcepts(offset = 0, limit = 100) {
    return await Concept.find()
      .sort({ category: 1, difficulty_level: 1 })
      .skip(offset)
      .limit(limit)
      .populate('prerequisites');
  }

  /**
   * Update concept
   */
  static async updateConcept(conceptId, updates) {
    const concept = await Concept.findOne({ concept_id: conceptId });
    
    if (!concept) {
      throw new Error(`Concept not found: ${conceptId}`);
    }

    Object.assign(concept, updates);
    concept.updated_at = new Date();
    await concept.save();
    return concept;
  }

  /**
   * Add prerequisite to concept
   */
  static async addPrerequisite(conceptId, prerequisiteId) {
    const concept = await Concept.findOne({ concept_id: conceptId });
    const prerequisite = await Concept.findOne({ concept_id: prerequisiteId });

    if (!concept || !prerequisite) {
      throw new Error('Concept or prerequisite not found');
    }

    if (!concept.prerequisites.includes(prerequisite._id)) {
      concept.prerequisites.push(prerequisite._id);
      await concept.save();
    }

    return concept;
  }

  /**
   * Remove prerequisite from concept
   */
  static async removePrerequisite(conceptId, prerequisiteId) {
    const concept = await Concept.findOne({ concept_id: conceptId });
    const prerequisite = await Concept.findOne({ concept_id: prerequisiteId });

    if (!concept || !prerequisite) {
      throw new Error('Concept or prerequisite not found');
    }

    concept.prerequisites = concept.prerequisites.filter(
      p => !p.equals(prerequisite._id)
    );
    await concept.save();

    return concept;
  }

  /**
   * Delete concept
   */
  static async deleteConcept(conceptId) {
    const concept = await Concept.findOne({ concept_id: conceptId });
    
    if (!concept) {
      throw new Error(`Concept not found: ${conceptId}`);
    }

    // Remove as prerequisite from other concepts
    await Concept.updateMany(
      { prerequisites: concept._id },
      { $pull: { prerequisites: concept._id } }
    );

    await Concept.deleteOne({ _id: concept._id });
    return { deleted: true, concept_id: conceptId };
  }

  /**
   * Get learning path for concept
   */
  static async getLearningPath(conceptId) {
    const concept = await Concept.findOne({ concept_id: conceptId })
      .populate('prerequisites');

    if (!concept) {
      throw new Error(`Concept not found: ${conceptId}`);
    }

    const path = [concept];
    const visited = new Set();

    const buildPath = async (prereqs) => {
      for (let prereq of prereqs) {
        const id = prereq._id.toString();
        if (!visited.has(id)) {
          visited.add(id);
          path.unshift(prereq);
          if (prereq.prerequisites && prereq.prerequisites.length > 0) {
            await buildPath(prereq.prerequisites);
          }
        }
      }
    };

    if (concept.prerequisites && concept.prerequisites.length > 0) {
      await buildPath(concept.prerequisites);
    }

    return path.map(c => ({
      concept_id: c.concept_id,
      title: c.title,
      difficulty_level: c.difficulty_level
    }));
  }

  /**
   * Search concepts
   */
  static async searchConcepts(query, category = null) {
    const filter = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };

    if (category) {
      filter.category = category;
    }

    return await Concept.find(filter).populate('prerequisites');
  }

  /**
   * Get concepts by status for user
   */
  static async getConceptsByStatus(userId, status) {
    const UserSkill = require('../models/UserSkill');
    const skills = await UserSkill.find({ user_id: userId, status })
      .populate('concept_id');
    
    return skills.map(s => s.concept_id);
  }
}

module.exports = ConceptService;
