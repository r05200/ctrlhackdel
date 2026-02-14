const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory database (for hackathon speed)
let knowledgeGraph = {
  nodes: [
    { id: 'programming-basics', label: 'Programming\nBasics', status: 'mastered', level: 1, description: 'Variables, loops, conditionals' },
    { id: 'data-structures', label: 'Data\nStructures', status: 'active', level: 2, description: 'Arrays, Lists, Hash Tables' },
    { id: 'algorithms', label: 'Algorithms', status: 'locked', level: 2, description: 'Sorting, Searching, Complexity' },
    { id: 'linear-algebra', label: 'Linear\nAlgebra', status: 'locked', level: 3, description: 'Vectors, Matrices, Eigenvalues' },
    { id: 'statistics', label: 'Statistics &\nProbability', status: 'locked', level: 3, description: 'Distributions, Hypothesis Testing' },
    { id: 'calculus', label: 'Calculus', status: 'locked', level: 3, description: 'Derivatives, Integrals, Optimization' },
    { id: 'python', label: 'Python for\nML', status: 'locked', level: 4, description: 'NumPy, Pandas, Matplotlib' },
    { id: 'ml-basics', label: 'Machine\nLearning Basics', status: 'locked', level: 4, description: 'Supervised vs Unsupervised Learning' },
    { id: 'neural-networks', label: 'Neural\nNetworks', status: 'locked', level: 5, description: 'Perceptrons, Backpropagation' },
    { id: 'deep-learning', label: 'Deep\nLearning', status: 'locked', level: 5, description: 'CNNs, RNNs, Transformers' },
    { id: 'computer-vision', label: 'Computer\nVision', status: 'locked', level: 6, description: 'Image Recognition, Object Detection' },
    { id: 'nlp', label: 'Natural Language\nProcessing', status: 'locked', level: 6, description: 'Text Analysis, LLMs' },
    { id: 'reinforcement-learning', label: 'Reinforcement\nLearning', status: 'locked', level: 6, description: 'Q-Learning, Policy Gradients' },
  ],
  links: [
    { source: 'programming-basics', target: 'data-structures' },
    { source: 'programming-basics', target: 'algorithms' },
    { source: 'data-structures', target: 'linear-algebra' },
    { source: 'algorithms', target: 'statistics' },
    { source: 'algorithms', target: 'calculus' },
    { source: 'linear-algebra', target: 'python' },
    { source: 'statistics', target: 'ml-basics' },
    { source: 'calculus', target: 'ml-basics' },
    { source: 'python', target: 'ml-basics' },
    { source: 'ml-basics', target: 'neural-networks' },
    { source: 'linear-algebra', target: 'neural-networks' },
    { source: 'neural-networks', target: 'deep-learning' },
    { source: 'deep-learning', target: 'computer-vision' },
    { source: 'deep-learning', target: 'nlp' },
    { source: 'deep-learning', target: 'reinforcement-learning' },
  ]
};

// Store user progress (could be per-user in production)
let userProgress = {
  masteredNodes: ['programming-basics'],
  activeNodes: ['data-structures'],
  totalTimeSpent: 0,
  completedChallenges: 1
};

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'NEXUS Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /',
      graph: 'GET /api/graph',
      updateNode: 'POST /api/node/:nodeId/complete',
      verifyExplanation: 'POST /api/verify',
      progress: 'GET /api/progress',
      reset: 'POST /api/reset'
    }
  });
});

// Get knowledge graph
app.get('/api/graph', (req, res) => {
  res.json({
    success: true,
    data: knowledgeGraph
  });
});

// Get user progress
app.get('/api/progress', (req, res) => {
  const stats = {
    total: knowledgeGraph.nodes.length,
    mastered: knowledgeGraph.nodes.filter(n => n.status === 'mastered').length,
    active: knowledgeGraph.nodes.filter(n => n.status === 'active').length,
    locked: knowledgeGraph.nodes.filter(n => n.status === 'locked').length,
    percentage: Math.round((knowledgeGraph.nodes.filter(n => n.status === 'mastered').length / knowledgeGraph.nodes.length) * 100)
  };
  
  res.json({
    success: true,
    stats,
    userProgress
  });
});

// Complete a node (after boss fight)
app.post('/api/node/:nodeId/complete', (req, res) => {
  const { nodeId } = req.params;
  
  // Find the node
  const nodeIndex = knowledgeGraph.nodes.findIndex(n => n.id === nodeId);
  
  if (nodeIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Node not found'
    });
  }
  
  const node = knowledgeGraph.nodes[nodeIndex];
  
  if (node.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Node is not active. Complete prerequisites first.',
      currentStatus: node.status
    });
  }
  
  // Mark node as mastered
  knowledgeGraph.nodes[nodeIndex].status = 'mastered';
  userProgress.masteredNodes.push(nodeId);
  userProgress.completedChallenges += 1;
  
  // Find and unlock child nodes
  const childLinks = knowledgeGraph.links.filter(link => link.source === nodeId);
  const unlockedNodes = [];
  
  childLinks.forEach(link => {
    const childNodeIndex = knowledgeGraph.nodes.findIndex(n => n.id === link.target);
    if (childNodeIndex !== -1) {
      const childNode = knowledgeGraph.nodes[childNodeIndex];
      
      if (childNode.status === 'locked') {
        // Check if all parent nodes are mastered
        const parentLinks = knowledgeGraph.links.filter(l => l.target === childNode.id);
        const allParentsMastered = parentLinks.every(parentLink => {
          const parentNode = knowledgeGraph.nodes.find(n => n.id === parentLink.source);
          return parentNode && parentNode.status === 'mastered';
        });
        
        if (allParentsMastered) {
          knowledgeGraph.nodes[childNodeIndex].status = 'active';
          userProgress.activeNodes.push(childNode.id);
          unlockedNodes.push(childNode.id);
        }
      }
    }
  });
  
  res.json({
    success: true,
    message: `Node "${node.label}" marked as mastered!`,
    unlockedNodes,
    updatedGraph: knowledgeGraph
  });
});

// Verify explanation (simulated AI check)
app.post('/api/verify', (req, res) => {
  const { nodeId, explanation, audioData } = req.body;
  
  // Find the node
  const node = knowledgeGraph.nodes.find(n => n.id === nodeId);
  
  if (!node) {
    return res.status(404).json({
      success: false,
      message: 'Node not found'
    });
  }
  
  // Simulated AI verification (in production, this would call an LLM)
  const wordCount = explanation ? explanation.split(' ').length : 0;
  const hasKeywords = explanation && explanation.toLowerCase().includes('data');
  
  // Simple scoring logic
  let score = 0;
  let feedback = [];
  
  if (wordCount > 20) {
    score += 40;
    feedback.push('Good explanation length');
  } else {
    feedback.push('Try to explain in more detail');
  }
  
  if (hasKeywords) {
    score += 30;
    feedback.push('Used relevant terminology');
  }
  
  // Random bonus (simulating AI confidence)
  score += Math.floor(Math.random() * 30);
  
  const passed = score >= 70;
  
  res.json({
    success: true,
    passed,
    score,
    feedback: feedback.join('. '),
    message: passed 
      ? `Excellent! You clearly understand ${node.label}.` 
      : `Not quite there yet. Try explaining ${node.label} with more depth.`,
    suggestions: !passed ? [
      'Focus on the core concepts',
      'Use analogies to explain complex ideas',
      'Give specific examples'
    ] : []
  });
});

// Reset progress (for testing)
app.post('/api/reset', (req, res) => {
  // Reset all nodes
  knowledgeGraph.nodes.forEach((node, index) => {
    if (node.id === 'programming-basics') {
      knowledgeGraph.nodes[index].status = 'mastered';
    } else if (node.id === 'data-structures' || node.id === 'algorithms') {
      knowledgeGraph.nodes[index].status = 'active';
    } else {
      knowledgeGraph.nodes[index].status = 'locked';
    }
  });
  
  userProgress = {
    masteredNodes: ['programming-basics'],
    activeNodes: ['data-structures', 'algorithms'],
    totalTimeSpent: 0,
    completedChallenges: 1
  };
  
  res.json({
    success: true,
    message: 'Progress reset successfully',
    graph: knowledgeGraph
  });
});

// Generate custom tree (bonus feature)
app.post('/api/generate-tree', (req, res) => {
  const { topic, difficulty } = req.body;
  
  // This would call an LLM in production
  // For now, return sample response
  res.json({
    success: true,
    message: `Custom tree for "${topic}" would be generated here using AI`,
    note: 'This feature requires LLM integration (Gemini/GPT-4)'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /api/graph',
      'GET /api/progress',
      'POST /api/node/:nodeId/complete',
      'POST /api/verify',
      'POST /api/reset',
      'POST /api/generate-tree'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   🧠 NEXUS Backend API Running!          ║
  ╚═══════════════════════════════════════════╝
  
  🚀 Server: http://localhost:${PORT}
  📚 API Docs: http://localhost:${PORT}
  
  Available Endpoints:
  ✓ GET  /api/graph              - Get knowledge graph
  ✓ GET  /api/progress           - Get user progress
  ✓ POST /api/node/:id/complete  - Complete a node
  ✓ POST /api/verify             - Verify explanation
  ✓ POST /api/reset              - Reset progress
  ✓ POST /api/generate-tree      - Generate custom tree
  
  💡 Tip: Visit http://localhost:${PORT} for full API info
  `);
});

module.exports = app;
