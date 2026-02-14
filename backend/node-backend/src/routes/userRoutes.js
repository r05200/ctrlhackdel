/**
 * User Routes - skill tracking and progress
 */
const express = require('express');
const UserService = require('../services/userService');

const router = express.Router();

/**
 * GET /api/users/:userId/skills
 * Get user skill tree
 */
router.get('/:userId/skills', async (req, res) => {
  try {
    const skillTree = await UserService.getUserSkillTree(req.params.userId);
    
    res.json({
      status: 'success',
      data: skillTree
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:userId/completed
 * Get completed concepts
 */
router.get('/:userId/completed', async (req, res) => {
  try {
    const completed = await UserService.getCompletedConcepts(req.params.userId);
    
    res.json({
      status: 'success',
      data: completed.map(skill => ({
        concept_id: skill.concept_id.concept_id,
        title: skill.concept_id.title,
        completed_at: skill.completed_at
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:userId/available
 * Get available concepts (prerequisites completed)
 */
router.get('/:userId/available', async (req, res) => {
  try {
    const available = await UserService.getAvailableConcepts(req.params.userId);
    
    res.json({
      status: 'success',
      data: available.map(concept => ({
        concept_id: concept.concept_id,
        title: concept.title,
        difficulty_level: concept.difficulty_level,
        category: concept.category
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/:userId/skills/:conceptId/complete
 * Mark concept as completed
 */
router.post('/:userId/skills/:conceptId/complete', async (req, res) => {
  try {
    const result = await UserService.markConceptCompleted(req.params.userId, req.params.conceptId);
    
    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/users/:userId/skills/:conceptId/progress
 * Update concept progress
 */
router.put('/:userId/skills/:conceptId/progress', async (req, res) => {
  try {
    const { progress } = req.body;
    
    if (progress === undefined) {
      return res.status(400).json({ error: 'progress field required' });
    }

    const result = await UserService.updateSkillProgress(
      req.params.userId,
      req.params.conceptId,
      progress
    );

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:userId/statistics
 * Get user learning statistics
 */
router.get('/:userId/statistics', async (req, res) => {
  try {
    const stats = await UserService.getUserStatistics(req.params.userId);
    
    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:userId/export
 * Export user skill tree
 */
router.get('/:userId/export', async (req, res) => {
  try {
    const exported = await UserService.exportUserSkillTree(req.params.userId);
    
    res.json({
      status: 'success',
      data: exported
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/:userId/import
 * Import user skill tree
 */
router.post('/:userId/import', async (req, res) => {
  try {
    const result = await UserService.importUserSkillTree(req.params.userId, req.body);
    
    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/users/:userId/skills/:conceptId
 * Reset concept progress
 */
router.delete('/:userId/skills/:conceptId', async (req, res) => {
  try {
    const result = await UserService.resetConceptProgress(req.params.userId, req.params.conceptId);
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
