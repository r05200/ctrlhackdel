/**
 * User Service - track user skills and progress
 */
const UserSkill = require('../models/UserSkill');
const ConceptService = require('./conceptService');

class UserService {
  /**
   * Get all completed concepts for user
   */
  static async getCompletedConcepts(userId) {
    return await UserSkill.getCompletedByUser(userId);
  }

  /**
   * Get available concepts for user (prerequisites completed)
   */
  static async getAvailableConcepts(userId) {
    return await UserSkill.getAvailableConcepts(userId);
  }

  /**
   * Mark concept as completed by user
   */
  static async markConceptCompleted(userId, conceptId) {
    // Get concept to validate
    const concept = await ConceptService.getConceptById(conceptId);
    if (!concept) {
      throw new Error(`Concept not found: ${conceptId}`);
    }

    const skill = await UserSkill.markCompleted(userId, concept._id);
    return {
      user_id: skill.user_id,
      concept: {
        concept_id: concept.concept_id,
        title: concept.title
      },
      status: skill.status,
      completed_at: skill.completed_at
    };
  }

  /**
   * Update user skill progress
   */
  static async updateSkillProgress(userId, conceptId, progress) {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    const concept = await ConceptService.getConceptById(conceptId);
    if (!concept) {
      throw new Error(`Concept not found: ${conceptId}`);
    }

    const skill = await UserSkill.findOneAndUpdate(
      { user_id: userId, concept_id: concept._id },
      {
        progress,
        status: progress === 100 ? 'completed' : (progress > 0 ? 'learning' : 'notstarted'),
        completed_at: progress === 100 ? new Date() : null,
        updated_at: new Date()
      },
      { new: true, upsert: true }
    ).populate('concept_id');

    return {
      user_id: userId,
      concept_id: concept.concept_id,
      progress,
      status: skill.status
    };
  }

  /**
   * Get user skill tree
   */
  static async getUserSkillTree(userId) {
    return await UserSkill.getSkillTree(userId);
  }

  /**
   * Export user skill tree to JSON
   */
  static async exportUserSkillTree(userId) {
    const skillTree = await this.getUserSkillTree(userId);
    
    return {
      user_id: userId,
      export_date: new Date(),
      summary: {
        total_concepts: skillTree.total_concepts,
        completed: skillTree.completed,
        in_progress: skillTree.in_progress,
        not_started: skillTree.total_concepts - skillTree.completed - skillTree.in_progress,
        percent_complete: Math.round((skillTree.completed / skillTree.total_concepts) * 100)
      },
      skills: skillTree.concepts.map(c => ({
        concept_id: c.concept_id,
        title: c.title,
        category: c.category,
        difficulty_level: c.difficulty_level,
        user_status: c.user_status,
        user_progress: c.user_progress,
        prerequisites: c.prerequisites
      }))
    };
  }

  /**
   * Import user skill tree from JSON
   */
  static async importUserSkillTree(userId, data) {
    const imported = [];
    const failed = [];

    for (const skill of data.skills || []) {
      try {
        const concept = await ConceptService.getConceptById(skill.concept_id);
        if (!concept) {
          failed.push({
            concept_id: skill.concept_id,
            reason: 'Concept not found'
          });
          continue;
        }

        const userSkill = await UserSkill.findOneAndUpdate(
          { user_id: userId, concept_id: concept._id },
          {
            status: skill.user_status || 'notstarted',
            progress: skill.user_progress || 0,
            updated_at: new Date()
          },
          { new: true, upsert: true }
        );

        imported.push({
          concept_id: skill.concept_id,
          status: userSkill.status
        });
      } catch (error) {
        failed.push({
          concept_id: skill.concept_id,
          reason: error.message
        });
      }
    }

    return {
      user_id: userId,
      imported_count: imported.length,
      imported,
      failed_count: failed.length,
      failed
    };
  }

  /**
   * Get user learning statistics
   */
  static async getUserStatistics(userId) {
    const skillTree = await this.getUserSkillTree(userId);
    
    // Calculate statistics by category
    const categoryStats = {};
    for (const concept of skillTree.concepts) {
      if (!categoryStats[concept.category]) {
        categoryStats[concept.category] = {
          total: 0,
          completed: 0,
          in_progress: 0
        };
      }

      categoryStats[concept.category].total++;
      if (concept.user_status === 'completed') {
        categoryStats[concept.category].completed++;
      } else if (concept.user_status === 'learning') {
        categoryStats[concept.category].in_progress++;
      }
    }

    return {
      user_id: userId,
      total_concepts: skillTree.total_concepts,
      completed: skillTree.completed,
      in_progress: skillTree.in_progress,
      not_started: skillTree.total_concepts - skillTree.completed - skillTree.in_progress,
      percent_complete: Math.round((skillTree.completed / skillTree.total_concepts) * 100),
      categories: categoryStats
    };
  }

  /**
   * Reset user progress for concept
   */
  static async resetConceptProgress(userId, conceptId) {
    const concept = await ConceptService.getConceptById(conceptId);
    if (!concept) {
      throw new Error(`Concept not found: ${conceptId}`);
    }

    await UserSkill.deleteOne({
      user_id: userId,
      concept_id: concept._id
    });

    return {
      user_id: userId,
      concept_id: conceptId,
      reset: true
    };
  }

  /**
   * Get users learning a specific concept
   */
  static async getUsersLearningConcept(conceptId) {
    const concept = await ConceptService.getConceptById(conceptId);
    if (!concept) {
      throw new Error(`Concept not found: ${conceptId}`);
    }

    return await UserSkill.find({
      concept_id: concept._id,
      status: { $in: ['learning', 'completed'] }
    }).distinct('user_id');
  }
}

module.exports = UserService;
