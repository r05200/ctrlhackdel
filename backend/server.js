const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory database (for hackathon speed)
let knowledgeGraph = {
  nodes: [
    { id: 'programming-basics', label: 'Programming\nBasics', status: 95, level: 1, description: 'Variables, loops, conditionals' },
    { id: 'data-structures', label: 'Data\nStructures', status: 0, level: 2, description: 'Arrays, Lists, Hash Tables' },
    { id: 'algorithms', label: 'Algorithms', status: -1, level: 2, description: 'Sorting, Searching, Complexity' },
    { id: 'linear-algebra', label: 'Linear\nAlgebra', status: -1, level: 3, description: 'Vectors, Matrices, Eigenvalues' },
    { id: 'statistics', label: 'Statistics &\nProbability', status: -1, level: 3, description: 'Distributions, Hypothesis Testing' },
    { id: 'calculus', label: 'Calculus', status: -1, level: 3, description: 'Derivatives, Integrals, Optimization' },
    { id: 'python', label: 'Python for\nML', status: -1, level: 4, description: 'NumPy, Pandas, Matplotlib' },
    { id: 'ml-basics', label: 'Machine\nLearning Basics', status: -1, level: 4, description: 'Supervised vs Unsupervised Learning' },
    { id: 'neural-networks', label: 'Neural\nNetworks', status: -1, level: 5, description: 'Perceptrons, Backpropagation' },
    { id: 'deep-learning', label: 'Deep\nLearning', status: -1, level: 5, description: 'CNNs, RNNs, Transformers' },
    { id: 'computer-vision', label: 'Computer\nVision', status: -1, level: 6, description: 'Image Recognition, Object Detection' },
    { id: 'nlp', label: 'Natural Language\nProcessing', status: -1, level: 6, description: 'Text Analysis, LLMs' },
    { id: 'reinforcement-learning', label: 'Reinforcement\nLearning', status: -1, level: 6, description: 'Q-Learning, Policy Gradients' },
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
    mastered: knowledgeGraph.nodes.filter(n => n.status > 0).length,
    active: knowledgeGraph.nodes.filter(n => n.status === 0).length,
    locked: knowledgeGraph.nodes.filter(n => n.status === -1).length,
    percentage: Math.round((knowledgeGraph.nodes.filter(n => n.status > 0).length / knowledgeGraph.nodes.length) * 100)
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
  
  if (node.status !== 0) {
    return res.status(400).json({
      success: false,
      message: 'Node is not active. Complete prerequisites first.',
      currentStatus: node.status
    });
  }
  
  // Find and unlock child nodes
  const childLinks = knowledgeGraph.links.filter(link => link.source === nodeId);
  const unlockedNodes = [];
  
  childLinks.forEach(link => {
    const childNodeIndex = knowledgeGraph.nodes.findIndex(n => n.id === link.target);
    if (childNodeIndex !== -1) {
      const childNode = knowledgeGraph.nodes[childNodeIndex];
      
      if (childNode.status === -1) {
        // Check if all parent nodes are mastered
        const parentLinks = knowledgeGraph.links.filter(l => l.target === childNode.id);
        const allParentsMastered = parentLinks.every(parentLink => {
          const parentNode = knowledgeGraph.nodes.find(n => n.id === parentLink.source);
          return parentNode && parentNode.status > 0;
        });
        
        if (allParentsMastered) {
          knowledgeGraph.nodes[childNodeIndex].status = 0;
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

  // Mark node as mastered
  knowledgeGraph.nodes[nodeIndex].status = score;
  userProgress.masteredNodes.push(nodeId);
  userProgress.completedChallenges += 1;
  
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
      knowledgeGraph.nodes[index].status = 95;
    } else if (node.id === 'data-structures' || node.id === 'algorithms') {
      knowledgeGraph.nodes[index].status = 0;
    } else {
      knowledgeGraph.nodes[index].status = -1;
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
  const { topic } = req.body;
  
  if (!topic || !topic.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Topic is required'
    });
  }

  // Generate a learning tree based on the topic
  const generatedTree = generateLearningTree(topic.toLowerCase().trim());
  
  res.json({
    success: true,
    topic: topic,
    graph: generatedTree
  });
});

// Helper function to generate learning tree
function generateLearningTree(topic) {
  // Topic templates - in production this would use LLM
  const templates = {
    'react': generateReactTree,
    'python': generatePythonTree,
    'machine learning': generateMLTree,
    'web development': generateWebDevTree,
    'data science': generateDataScienceTree,
  };

  // Find matching template or use generic
  const generator = templates[topic] || (() => generateGenericTree(topic));
  return generator();
}

function generateReactTree() {
  return {
    nodes: [
      { id: 'html-css', label: 'HTML & CSS\nBasics', status: 95, level: 1, description: 'Web page structure and styling' },
      { id: 'javascript', label: 'JavaScript\nFundamentals', status: 0, level: 2, description: 'JS syntax, functions, DOM manipulation' },
      { id: 'es6', label: 'ES6+\nFeatures', status: -1, level: 2, description: 'Arrow functions, destructuring, modules' },
      { id: 'react-basics', label: 'React\nBasics', status: -1, level: 3, description: 'Components, JSX, Props' },
      { id: 'state-props', label: 'State &\nProps', status: -1, level: 3, description: 'Managing component state' },
      { id: 'hooks', label: 'React\nHooks', status: -1, level: 4, description: 'useState, useEffect, custom hooks' },
      { id: 'routing', label: 'React\nRouter', status: -1, level: 4, description: 'Navigation and routing' },
      { id: 'state-management', label: 'State\nManagement', status: -1, level: 5, description: 'Redux, Context API, Zustand' },
      { id: 'api-integration', label: 'API\nIntegration', status: -1, level: 5, description: 'Fetch, Axios, async operations' },
      { id: 'performance', label: 'React\nPerformance', status: -1, level: 6, description: 'Optimization, memoization' },
      { id: 'testing', label: 'Testing\nReact Apps', status: -1, level: 6, description: 'Jest, React Testing Library' },
    ],
    links: [
      { source: 'html-css', target: 'javascript' },
      { source: 'html-css', target: 'es6' },
      { source: 'javascript', target: 'react-basics' },
      { source: 'es6', target: 'react-basics' },
      { source: 'react-basics', target: 'state-props' },
      { source: 'state-props', target: 'hooks' },
      { source: 'state-props', target: 'routing' },
      { source: 'hooks', target: 'state-management' },
      { source: 'hooks', target: 'api-integration' },
      { source: 'state-management', target: 'performance' },
      { source: 'api-integration', target: 'testing' },
    ]
  };
}

function generatePythonTree() {
  return {
    nodes: [
      { id: 'python-basics', label: 'Python\nBasics', status: 95, level: 1, description: 'Variables, data types, operators' },
      { id: 'control-flow', label: 'Control\nFlow', status: 0, level: 2, description: 'If/else, loops, functions' },
      { id: 'data-structures', label: 'Data\nStructures', status: -1, level: 2, description: 'Lists, dicts, sets, tuples' },
      { id: 'oop', label: 'Object-Oriented\nProgramming', status: -1, level: 3, description: 'Classes, inheritance, polymorphism' },
      { id: 'file-handling', label: 'File\nHandling', status: -1, level: 3, description: 'Reading/writing files, CSV, JSON' },
      { id: 'libraries', label: 'Popular\nLibraries', status: -1, level: 4, description: 'NumPy, Pandas, Matplotlib' },
      { id: 'web-frameworks', label: 'Web\nFrameworks', status: -1, level: 4, description: 'Flask, Django,FastAPI' },
      { id: 'apis', label: 'APIs &\nRequests', status: -1, level: 5, description: 'REST APIs, requests library' },
      { id: 'testing', label: 'Testing &\nDebugging', status: -1, level: 5, description: 'Pytest, unittest, debugging' },
      { id: 'deployment', label: 'Deployment', status: -1, level: 6, description: 'Docker, cloud deployment' },
    ],
    links: [
      { source: 'python-basics', target: 'control-flow' },
      { source: 'python-basics', target: 'data-structures' },
      { source: 'control-flow', target: 'oop' },
      { source: 'data-structures', target: 'file-handling' },
      { source: 'oop', target: 'libraries' },
      { source: 'file-handling', target: 'web-frameworks' },
      { source: 'libraries', target: 'apis' },
      { source: 'web-frameworks', target: 'apis' },
      { source: 'apis', target: 'testing' },
      { source: 'testing', target: 'deployment' },
    ]
  };
}

function generateMLTree() {
  return knowledgeGraph; // Use the existing ML tree
}

function generateWebDevTree() {
  return {
    nodes: [
      { id: 'html', label: 'HTML\nFundamentals', status: 95, level: 1, description: 'Structure and semantics' },
      { id: 'css', label: 'CSS\nStyling', status: 0, level: 2, description: 'Selectors, box model, flexbox' },
      { id: 'javascript', label: 'JavaScript\nBasics', status: -1, level: 2, description: 'DOM manipulation, events' },
      { id: 'responsive', label: 'Responsive\nDesign', status: -1, level: 3, description: 'Media queries, mobile-first' },
      { id: 'frameworks', label: 'CSS\nFrameworks', status: -1, level: 3, description: 'Bootstrap, Tailwind' },
      { id: 'frontend-framework', label: 'Frontend\nFramework', status: -1, level: 4, description: 'React, Vue, or Angular' },
      { id: 'backend-basics', label: 'Backend\nBasics', status: -1, level: 4, description: 'Node.js, APIs, databases' },
      { id: 'databases', label: 'Databases', status: -1, level: 5, description: 'SQL, MongoDB, Postgres' },
      { id: 'authentication', label: 'Authentication', status: -1, level: 5, description: 'JWT, OAuth, sessions' },
      { id: 'deployment', label: 'Deployment', status: -1, level: 6, description: 'Hosting, CI/CD, domains' },
    ],
    links: [
      { source: 'html', target: 'css' },
      { source: 'html', target: 'javascript' },
      { source: 'css', target: 'responsive' },
      { source: 'css', target: 'frameworks' },
      { source: 'javascript', target: 'frontend-framework' },
      { source: 'javascript', target: 'backend-basics' },
      { source: 'frontend-framework', target: 'databases' },
      { source: 'backend-basics', target: 'databases' },
      { source: 'databases', target: 'authentication' },
      { source: 'authentication', target: 'deployment' },
    ]
  };
}

function generateDataScienceTree() {
  return {
    nodes: [
      { id: 'python-basics', label: 'Python\nBasics', status: 95, level: 1, description: 'Variables, functions, data types' },
      { id: 'numpy', label: 'NumPy', status: 0, level: 2, description: 'Arrays, mathematical operations' },
      { id: 'pandas', label: 'Pandas', status: -1, level: 2, description: 'DataFrames, data manipulation' },
      { id: 'visualization', label: 'Data\nVisualization', status: -1, level: 3, description: 'Matplotlib, Seaborn, Plotly' },
      { id: 'statistics', label: 'Statistics', status: -1, level: 3, description: 'Descriptive, inferential stats' },
      { id: 'ml-basics', label: 'Machine\nLearning', status: -1, level: 4, description: 'Scikit-learn, models, training' },
      { id: 'deep-learning', label: 'Deep\nLearning', status: -1, level: 5, description: 'TensorFlow, PyTorch, neural nets' },
      { id: 'nlp', label: 'Natural Language\nProcessing', status: -1, level: 6, description: 'Text analysis, transformers' },
      { id: 'computer-vision', label: 'Computer\nVision', status: -1, level: 6, description: 'Image processing, CNNs' },
    ],
    links: [
      { source: 'python-basics', target: 'numpy' },
      { source: 'python-basics', target: 'pandas' },
      { source: 'numpy', target: 'visualization' },
      { source: 'pandas', target: 'visualization' },
      { source: 'pandas', target: 'statistics' },
      { source: 'visualization', target: 'ml-basics' },
      { source: 'statistics', target: 'ml-basics' },
      { source: 'ml-basics', target: 'deep-learning' },
      { source: 'deep-learning', target: 'nlp' },
      { source: 'deep-learning', target: 'computer-vision' },
    ]
  };
}

function generateGenericTree(topic) {
  // Generic template for any topic
  const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
  
  return {
    nodes: [
      { id: 'basics', label: `${capitalizedTopic}\nBasics`, status: 95, level: 1, description: 'Fundamental concepts and introduction' },
      { id: 'fundamentals', label: 'Core\nFundamentals', status: 0, level: 2, description: 'Essential principles and practices' },
      { id: 'intermediate', label: 'Intermediate\nConcepts', status: -1, level: 3, description: 'Building on the foundations' },
      { id: 'advanced-1', label: 'Advanced\nTopics I', status: -1, level: 4, description: 'Deep dive into complex areas' },
      { id: 'advanced-2', label: 'Advanced\nTopics II', status: -1, level: 4, description: 'Specialized knowledge' },
      { id: 'practical', label: 'Practical\nApplications', status: -1, level: 5, description: 'Real-world projects and use cases' },
      { id: 'mastery', label: 'Mastery &\nBest Practices', status: -1, level: 6, description: 'Expert-level skills' },
    ],
    links: [
      { source: 'basics', target: 'fundamentals' },
      { source: 'fundamentals', target: 'intermediate' },
      { source: 'intermediate', target: 'advanced-1' },
      { source: 'intermediate', target: 'advanced-2' },
      { source: 'advanced-1', target: 'practical' },
      { source: 'advanced-2', target: 'practical' },
      { source: 'practical', target: 'mastery' },
    ]
  };
}

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
