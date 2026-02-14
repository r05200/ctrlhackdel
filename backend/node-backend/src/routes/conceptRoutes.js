/**
 * Concept Routes
 */
const express = require('express');
const ConceptService = require('../services/conceptService');

const router = express.Router();

/**
 * GET /api/concepts
 * Get all concepts with pagination
 */
router.get('/', async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 100;
    
    const concepts = await ConceptService.getAllConcepts(offset, limit);
    
    res.json({
      status: 'success',
      data: concepts.map(c => ({
        concept_id: c.concept_id,
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty_level: c.difficulty_level,
        prerequisites: c.prerequisites.map(p => p.concept_id)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/concepts/:conceptId
 * Get specific concept
 */
router.get('/:conceptId', async (req, res) => {
  try {
    const concept = await ConceptService.getConceptById(req.params.conceptId);
    
    if (!concept) {
      return res.status(404).json({ error: 'Concept not found' });
    }

    res.json({
      status: 'success',
      data: {
        concept_id: concept.concept_id,
        title: concept.title,
        description: concept.description,
        category: concept.category,
        difficulty_level: concept.difficulty_level,
        prerequisites: concept.prerequisites.map(p => ({
          concept_id: p.concept_id,
          title: p.title
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/concepts/:conceptId/dependencies
 * Get concept dependencies (prerequisites and dependents)
 */
router.get('/:conceptId/dependencies', async (req, res) => {
  try {
    const concept = await ConceptService.getConceptById(req.params.conceptId);
    
    if (!concept) {
      return res.status(404).json({ error: 'Concept not found' });
    }

    // Get concepts that depend on this one
    const Concept = require('../models/Concept');
    const dependents = await Concept.find({
      prerequisites: concept._id
    });

    res.json({
      status: 'success',
      data: {
        concept: {
          concept_id: concept.concept_id,
          title: concept.title
        },
        prerequisites: concept.prerequisites.map(p => ({
          concept_id: p.concept_id,
          title: p.title,
          difficulty_level: p.difficulty_level
        })),
        dependents: dependents.map(d => ({
          concept_id: d.concept_id,
          title: d.title,
          difficulty_level: d.difficulty_level
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/concepts/:conceptId/learning-path
 * Get learning path to reach a concept
 */
router.get('/:conceptId/learning-path', async (req, res) => {
  try {
    const path = await ConceptService.getLearningPath(req.params.conceptId);
    
    res.json({
      status: 'success',
      data: {
        concept_id: req.params.conceptId,
        learning_path: path
      }
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * GET /api/concepts/category/:category/tree
 * Get complete concept tree for category
 */
router.get('/category/:category/tree', async (req, res) => {
  try {
    const tree = await ConceptService.getCategoryTree(req.params.category);
    
    res.json({
      status: 'success',
      data: tree
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/concepts/category/:category
 * Get all concepts in category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const concepts = await ConceptService.getConceptsByCategory(req.params.category);
    
    res.json({
      status: 'success',
      data: concepts.map(c => ({
        concept_id: c.concept_id,
        title: c.title,
        description: c.description,
        difficulty_level: c.difficulty_level,
        prerequisites: c.prerequisites.map(p => p.concept_id)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/concepts
 * Create new concept
 */
router.post('/', async (req, res) => {
  try {
    const { concept_id, title, description, category, difficulty_level, prerequisites } = req.body;

    if (!concept_id || !title || !category) {
      return res.status(400).json({ error: 'Missing required fields: concept_id, title, category' });
    }

    const concept = await ConceptService.createConcept({
      concept_id,
      title,
      description,
      category,
      difficulty_level,
      prerequisites
    });

    res.status(201).json({
      status: 'success',
      data: {
        concept_id: concept.concept_id,
        title: concept.title,
        category: concept.category
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/concepts/:conceptId
 * Update concept
 */
router.put('/:conceptId', async (req, res) => {
  try {
    const concept = await ConceptService.updateConcept(req.params.conceptId, req.body);

    res.json({
      status: 'success',
      data: {
        concept_id: concept.concept_id,
        title: concept.title,
        description: concept.description,
        difficulty_level: concept.difficulty_level
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/concepts/:conceptId/prerequisites/:prerequisiteId
 * Add prerequisite
 */
router.post('/:conceptId/prerequisites/:prerequisiteId', async (req, res) => {
  try {
    const concept = await ConceptService.addPrerequisite(
      req.params.conceptId,
      req.params.prerequisiteId
    );

    res.json({
      status: 'success',
      data: {
        concept_id: concept.concept_id,
        prerequisites: concept.prerequisites.map(p => p.concept_id)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/concepts/:conceptId
 * Delete concept
 */
router.delete('/:conceptId', async (req, res) => {
  try {
    const result = await ConceptService.deleteConcept(req.params.conceptId);
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/concepts/search/:query
 * Search concepts
 */
router.get('/search/:query', async (req, res) => {
  try {
    const category = req.query.category;
    const concepts = await ConceptService.searchConcepts(req.params.query, category);
    
    res.json({
      status: 'success',
      data: concepts.map(c => ({
        concept_id: c.concept_id,
        title: c.title,
        category: c.category
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
