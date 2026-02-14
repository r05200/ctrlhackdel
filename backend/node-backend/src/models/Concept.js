/**
 * Concept model - represents a single concept in a skill tree
 */
const mongoose = require('mongoose');

const ConceptSchema = new mongoose.Schema({
  concept_id: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
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
    required: true
  },
  difficulty_level: {
    type: Number,
    min: 1,
    max: 10,
    default: 1
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concept'
  }],
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

// Index for faster queries
ConceptSchema.index({ category: 1, difficulty_level: 1 });
ConceptSchema.index({ concept_id: 1 });
ConceptSchema.index({ category: 1 });

/**
 * Get concept by ID
 */
ConceptSchema.statics.getConceptById = async function(conceptId) {
  return await this.findOne({ concept_id: conceptId }).populate('prerequisites');
};

/**
 * Get all concepts in a category
 */
ConceptSchema.statics.getConceptsByCategory = async function(category) {
  return await this.find({ category }).sort({ difficulty_level: 1 }).populate('prerequisites');
};

/**
 * Get dependency chain for circular dependency detection
 */
ConceptSchema.methods.getDependencyChain = async function(visited = new Set()) {
  if (visited.has(this._id.toString())) {
    return [this.concept_id]; // Circular dependency detected
  }
  
  visited.add(this._id.toString());
  let chain = [this.concept_id];
  
  for (let prereq of this.prerequisites) {
    const prereqDoc = typeof prereq === 'string' 
      ? await mongoose.model('Concept').findById(prereq)
      : prereq;
    
    if (prereqDoc) {
      const subChain = await prereqDoc.getDependencyChain(new Set(visited));
      chain = chain.concat(subChain);
    }
  }
  
  return chain;
};

/**
 * Convert to clean object
 */
ConceptSchema.methods.toJSON = function() {
  return {
    concept_id: this.concept_id,
    title: this.title,
    description: this.description,
    category: this.category,
    difficulty_level: this.difficulty_level,
    prerequisites: this.prerequisites.map(p => 
      typeof p === 'string' ? p : p.concept_id
    ),
    created_at: this.created_at,
    updated_at: this.updated_at
  };
};

module.exports = mongoose.model('Concept', ConceptSchema);
