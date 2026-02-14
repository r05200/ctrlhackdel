/**
 * SkillTree model - represents a saved skill tree
 */
const mongoose = require('mongoose');

const SkillTreeSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'General',
    index: true
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'archived'],
    default: 'draft',
    index: true
  },
  tree_data: {
    concepts: [{
      concept_id: String,
      title: String,
      description: String,
      difficulty_level: Number,
      user_status: String
    }],
    links: [{
      source: String,
      target: String
    }]
  },
  last_opened: {
    type: Date,
    default: Date.now,
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  versionKey: false
});

// Composite index for efficient user queries
SkillTreeSchema.index({ user_id: 1, created_at: -1 });

/**
 * Get all trees for a user
 */
SkillTreeSchema.statics.getTreesByUser = async function(userId, filters = {}) {
  let query = { user_id: userId };
  
  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.tags) {
    query.tags = { $in: Array.isArray(filters.tags) ? filters.tags : [filters.tags] };
  }
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return await this.find(query).sort({ last_opened: -1 }).exec();
};

/**
 * Get tree by ID
 */
SkillTreeSchema.statics.getTreeById = async function(treeId) {
  return await this.findById(treeId);
};

/**
 * Get tree by ID and user (security check)
 */
SkillTreeSchema.statics.getTreeByIdAndUser = async function(treeId, userId) {
  return await this.findOne({ _id: treeId, user_id: userId });
};

/**
 * Update tree last opened timestamp
 */
SkillTreeSchema.methods.updateLastOpened = async function() {
  this.last_opened = new Date();
  await this.save();
};

/**
 * Create new tree
 */
SkillTreeSchema.statics.createTree = async function(userId, treeData) {
  const tree = new this({
    user_id: userId,
    title: treeData.title,
    description: treeData.description,
    category: treeData.category || 'General',
    tags: treeData.tags || [],
    status: treeData.status || 'draft',
    tree_data: treeData.tree_data || { concepts: [], links: [] }
  });
  await tree.save();
  return tree;
};

/**
 * Get all unique categories for a user
 */
SkillTreeSchema.statics.getCategoriesByUser = async function(userId) {
  return await this.distinct('category', { user_id: userId });
};

/**
 * Get all unique tags for a user
 */
SkillTreeSchema.statics.getTagsByUser = async function(userId) {
  return await this.distinct('tags', { user_id: userId });
};

/**
 * Archive tree
 */
SkillTreeSchema.methods.archive = async function() {
  this.status = 'archived';
  this.updated_at = new Date();
  await this.save();
};

/**
 * Unarchive tree
 */
SkillTreeSchema.methods.unarchive = async function() {
  this.status = 'draft';
  this.updated_at = new Date();
  await this.save();
};

/**
 * Delete tree
 */
SkillTreeSchema.statics.deleteTree = async function(treeId, userId) {
  return await this.findOneAndDelete({ _id: treeId, user_id: userId });
};

module.exports = mongoose.model('SkillTree', SkillTreeSchema);
