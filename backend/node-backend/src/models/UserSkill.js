/**
 * UserSkill model - tracks which concepts a user has completed
 */
const mongoose = require('mongoose');

const UserSkillSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    lowercase: true
  },
  concept_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concept',
    required: true
  },
  status: {
    type: String,
    enum: ['notstarted', 'learning', 'completed'],
    default: 'notstarted'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  completed_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  versionKey: false
});

// Composite unique index on user_id and concept_id
UserSkillSchema.index({ user_id: 1, concept_id: 1 }, { unique: true });
UserSkillSchema.index({ user_id: 1 });
UserSkillSchema.index({ status: 1 });

/**
 * Get all completed concepts for a user
 */
UserSkillSchema.statics.getCompletedByUser = async function(userId) {
  return await this.find({ user_id: userId, status: 'completed' }).populate('concept_id');
};

/**
 * Get available concepts (prerequisites completed) for a user
 */
UserSkillSchema.statics.getAvailableConcepts = async function(userId) {
  const Concept = mongoose.model('Concept');
  
  // Get completed concept IDs
  const completedSkills = await this.find(
    { user_id: userId, status: 'completed' },
    'concept_id'
  );
  const completedIds = new Set(completedSkills.map(s => s.concept_id.toString()));
  
  // Get all concepts
  const allConcepts = await Concept.find().populate('prerequisites');
  
  // Filter to concepts where all prerequisites are completed
  return allConcepts.filter(concept => {
    const prereqIds = concept.prerequisites.map(p => p._id.toString());
    return prereqIds.every(id => completedIds.has(id));
  });
};

/**
 * Mark concept as completed
 */
UserSkillSchema.statics.markCompleted = async function(userId, conceptId) {
  const skill = await this.findOneAndUpdate(
    { user_id: userId, concept_id: conceptId },
    {
      status: 'completed',
      progress: 100,
      completed_at: new Date(),
      updated_at: new Date()
    },
    { new: true, upsert: true }
  );
  return skill;
};

/**
 * Get skill tree export for user
 */
UserSkillSchema.statics.getSkillTree = async function(userId) {
  const Concept = mongoose.model('Concept');
  
  // Get all skills for user
  const skills = await this.find({ user_id: userId }).populate('concept_id');
  
  // Get all concepts with their hierarchies
  const concepts = await Concept.find().populate('prerequisites');
  
  return {
    user_id: userId,
    total_concepts: concepts.length,
    completed: skills.filter(s => s.status === 'completed').length,
    in_progress: skills.filter(s => s.status === 'learning').length,
    concepts: concepts.map(c => ({
      ...c.toJSON(),
      user_status: skills.find(s => s.concept_id._id.equals(c._id))?.status || 'notstarted',
      user_progress: skills.find(s => s.concept_id._id.equals(c._id))?.progress || 0
    }))
  };
};

module.exports = mongoose.model('UserSkill', UserSkillSchema);
