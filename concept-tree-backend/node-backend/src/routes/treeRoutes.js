/**
 * Skill Tree Routes
 * Handles CRUD operations and management of saved skill trees
 */
const express = require('express');
const router = express.Router();
const SkillTree = require('../models/SkillTree');

/**
 * GET /api/trees/:userId
 * Get all trees for a user with optional filters
 * Query params: category, status, tags, search
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const filters = {
      category: req.query.category,
      status: req.query.status,
      tags: req.query.tags,
      search: req.query.search
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const trees = await SkillTree.getTreesByUser(userId, filters);
    res.json({
      success: true,
      count: trees.length,
      trees
    });
  } catch (error) {
    console.error('Error fetching trees:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/trees/:userId/categories
 * Get all categories for a user
 */
router.get('/:userId/categories', async (req, res) => {
  try {
    const { userId } = req.params;
    const categories = await SkillTree.getCategoriesByUser(userId);
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/trees/:userId/tags
 * Get all tags for a user
 */
router.get('/:userId/tags', async (req, res) => {
  try {
    const { userId } = req.params;
    const tags = await SkillTree.getTagsByUser(userId);
    res.json({
      success: true,
      tags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/trees/get/:treeId
 * Get a specific tree by ID
 */
router.get('/get/:treeId', async (req, res) => {
  try {
    const { treeId } = req.params;
    const tree = await SkillTree.getTreeById(treeId);
    
    if (!tree) {
      return res.status(404).json({
        success: false,
        error: 'Tree not found'
      });
    }

    // Update last opened
    await tree.updateLastOpened();

    res.json({
      success: true,
      tree
    });
  } catch (error) {
    console.error('Error fetching tree:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/trees
 * Create a new tree
 * Body: { userId, title, description, category, tags, status, tree_data }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, title, description, category, tags, status, tree_data } = req.body;

    if (!userId || !title) {
      return res.status(400).json({
        success: false,
        error: 'userId and title are required'
      });
    }

    const tree = await SkillTree.createTree(userId, {
      title,
      description,
      category,
      tags,
      status,
      tree_data
    });

    res.status(201).json({
      success: true,
      tree
    });
  } catch (error) {
    console.error('Error creating tree:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/trees/:treeId
 * Update a specific tree
 * Body: { userId, title, description, category, tags, status, tree_data }
 */
router.put('/:treeId', async (req, res) => {
  try {
    const { treeId } = req.params;
    const { userId, title, description, category, tags, status, tree_data } = req.body;

    // Security check: ensure user owns this tree
    const tree = await SkillTree.getTreeByIdAndUser(treeId, userId);

    if (!tree) {
      return res.status(404).json({
        success: false,
        error: 'Tree not found or unauthorized'
      });
    }

    // Update fields
    if (title) tree.title = title;
    if (description !== undefined) tree.description = description;
    if (category) tree.category = category;
    if (tags) tree.tags = tags;
    if (status) tree.status = status;
    if (tree_data) tree.tree_data = tree_data;
    
    tree.updated_at = new Date();
    await tree.save();

    res.json({
      success: true,
      tree
    });
  } catch (error) {
    console.error('Error updating tree:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/trees/:treeId
 * Delete a specific tree
 * Body: { userId }
 */
router.delete('/:treeId', async (req, res) => {
  try {
    const { treeId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const result = await SkillTree.deleteTree(treeId, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Tree not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Tree deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tree:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/trees/:treeId/archive
 * Archive a tree
 * Body: { userId }
 */
router.patch('/:treeId/archive', async (req, res) => {
  try {
    const { treeId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const tree = await SkillTree.getTreeByIdAndUser(treeId, userId);

    if (!tree) {
      return res.status(404).json({
        success: false,
        error: 'Tree not found or unauthorized'
      });
    }

    await tree.archive();

    res.json({
      success: true,
      tree
    });
  } catch (error) {
    console.error('Error archiving tree:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/trees/:treeId/unarchive
 * Unarchive a tree
 * Body: { userId }
 */
router.patch('/:treeId/unarchive', async (req, res) => {
  try {
    const { treeId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const tree = await SkillTree.getTreeByIdAndUser(treeId, userId);

    if (!tree) {
      return res.status(404).json({
        success: false,
        error: 'Tree not found or unauthorized'
      });
    }

    await tree.unarchive();

    res.json({
      success: true,
      tree
    });
  } catch (error) {
    console.error('Error unarchiving tree:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
