require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log('🔑 Loading GEMINI_API_KEY:', GEMINI_API_KEY ? `"${GEMINI_API_KEY.substring(0, 4)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)}"` : 'Not Found');
const genAI = GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here' 
  ? new GoogleGenerativeAI(GEMINI_API_KEY) 
  : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) : null;

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

const STATUS = {
  LOCKED: -1,
  ACTIVE: 0
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
    mastered: knowledgeGraph.nodes.filter(n => n.status > STATUS.ACTIVE).length,
    active: knowledgeGraph.nodes.filter(n => n.status === STATUS.ACTIVE).length,
    locked: knowledgeGraph.nodes.filter(n => n.status === STATUS.LOCKED).length,
    percentage: Math.round((knowledgeGraph.nodes.filter(n => n.status > STATUS.ACTIVE).length / knowledgeGraph.nodes.length) * 100)
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
  const { score } = req.body || {};
  
  // Find the node
  const nodeIndex = knowledgeGraph.nodes.findIndex(n => n.id === nodeId);
  
  if (nodeIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Node not found'
    });
  }
  
  const node = knowledgeGraph.nodes[nodeIndex];
  
  if (node.status === STATUS.LOCKED) {
    return res.status(400).json({
      success: false,
      message: 'Node is not active. Complete prerequisites first.',
      currentStatus: node.status
    });
  }

  // Redo-practice completion for already mastered nodes should be idempotent.
  if (node.status > STATUS.ACTIVE) {
    return res.json({
      success: true,
      message: `Node "${node.label}" practice attempt recorded. Best score remains ${node.status}.`,
      unlockedNodes: [],
      updatedGraph: knowledgeGraph
    });
  }

  const parsedScore = Number(score);
  const completionScore = Number.isFinite(parsedScore) && parsedScore > 0
    ? Math.min(100, Math.round(parsedScore))
    : 95;
  knowledgeGraph.nodes[nodeIndex].status = completionScore;
  if (!userProgress.masteredNodes.includes(nodeId)) {
    userProgress.masteredNodes.push(nodeId);
  }
  userProgress.activeNodes = userProgress.activeNodes.filter(id => id !== nodeId);
  
  // Find and unlock child nodes
  const childLinks = knowledgeGraph.links.filter(link => link.source === nodeId);
  const unlockedNodes = [];
  
  childLinks.forEach(link => {
    const childNodeIndex = knowledgeGraph.nodes.findIndex(n => n.id === link.target);
    if (childNodeIndex !== -1) {
      const childNode = knowledgeGraph.nodes[childNodeIndex];
      
      if (childNode.status === STATUS.LOCKED) {
        // Check if all parent nodes are mastered
        const parentLinks = knowledgeGraph.links.filter(l => l.target === childNode.id);
        const allParentsMastered = parentLinks.every(parentLink => {
          const parentNode = knowledgeGraph.nodes.find(n => n.id === parentLink.source);
          return parentNode && parentNode.status > STATUS.ACTIVE;
        });
        
        if (allParentsMastered) {
          knowledgeGraph.nodes[childNodeIndex].status = STATUS.ACTIVE;
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
  const nodeIndex = knowledgeGraph.nodes.findIndex(n => n.id === nodeId);
  const node = knowledgeGraph.nodes[nodeIndex];
  
  if (!node) {
    return res.status(404).json({
      success: false,
      message: 'Node not found'
    });
  }
  
  if (node.status === STATUS.LOCKED) {
    return res.status(400).json({
      success: false,
      message: 'Node is locked. Complete prerequisites first.',
      currentStatus: node.status
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

  const previousBestScore = node.status > STATUS.ACTIVE ? node.status : null;
  const bestScore = previousBestScore === null ? null : Math.max(previousBestScore, score);
  const scoreDelta = previousBestScore === null ? null : score - previousBestScore;
  const scoreDeltaPercent = previousBestScore
    ? Number((((score - previousBestScore) / previousBestScore) * 100).toFixed(2))
    : null;
  const improvedBest = previousBestScore === null ? true : score > previousBestScore;
  
  const passed = score >= 70;

  // Persist best score only for already-mastered nodes; active-node completion happens in /complete.
  if (previousBestScore !== null) {
    knowledgeGraph.nodes[nodeIndex].status = bestScore;
  }
  userProgress.completedChallenges += 1;
  
  res.json({
    success: true,
    passed,
    score,
    attemptScore: score,
    previousBestScore,
    bestScore: bestScore === null ? score : bestScore,
    scoreDelta,
    scoreDeltaPercent,
    improvedBest,
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
      knowledgeGraph.nodes[index].status = STATUS.ACTIVE;
    } else {
      knowledgeGraph.nodes[index].status = STATUS.LOCKED;
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

// Generate custom tree with Gemini AI
app.post('/api/generate-tree', async (req, res) => {
  const { topic } = req.body;
  
  console.log('\n========================================');
  console.log('📝 NEW TOPIC REQUEST RECEIVED');
  console.log('========================================');
  console.log('Topic:', topic);
  console.log('Timestamp:', new Date().toISOString());
  
  if (!topic || !topic.trim()) {
    console.log('❌ Error: Topic is empty or missing');
    return res.status(400).json({
      success: false,
      message: 'Topic is required'
    });
  }

  try {
    console.log('🚀 Starting tree generation...');
    // Generate a learning tree based on the topic using Gemini AI
    const generatedTree = await generateLearningTreeWithAI(topic.trim());
    
    console.log('✅ Tree generation successful!');
    console.log('Generated nodes:', generatedTree.nodes.length);
    console.log('Generated links:', generatedTree.links.length);
    console.log('Node IDs:', generatedTree.nodes.map(n => n.id).join(', '));
    console.log('========================================\n');
    
    res.json({
      success: true,
      topic: topic,
      graph: generatedTree
    });
  } catch (error) {
    console.error('❌ Error generating tree:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    console.log('========================================\n');
    res.status(500).json({
      success: false,
      message: 'Failed to generate learning tree',
      error: error.message
    });
  }
});

// AI-powered function to generate learning tree with Gemini
async function generateLearningTreeWithAI(topic) {
  console.log('\n🤖 AI Generation Function Called');
  console.log('Topic received:', topic);
  
  // If Gemini API not configured, use fallback
  if (!model) {
    console.log('⚠️  Gemini API not configured (model is null)');
    console.log('📄 Using FALLBACK generic template');
    console.log('💡 To enable AI: Set GEMINI_API_KEY in .env file');
    return generateGenericTree(topic);
  }

  console.log('✓ Gemini API configured - using AI generation');

  const prompt = `Generate a learning tree for the topic: "${topic}".

Create a JSON object with this structure:
{
  "nodes": [
    {
      "id": "unique-id",
      "label": "Topic Name",
      "status": "mastered" | "active" | "locked",
      "level": 1-6,
      "description": "Brief description"
    }
  ],
  "links": [
    {
      "source": "prerequisite-id",
      "target": "next-topic-id"
    }
  ]
}

Requirements:
- Generate 8-12 nodes
- First node: status "mastered", level 1
- Second node: status "active"
- All other nodes: status "locked"
- Use levels 1-6 to show progression (beginner to advanced)
- Create logical links showing prerequisites
- Keep labels clear and concise (no special characters)
- Keep descriptions short (1 sentence)

Return ONLY valid JSON, no markdown code blocks.`;

  try {
    console.log('\n📤 Sending prompt to Gemini AI...');
    console.log('Prompt length:', prompt.length, 'characters');
    
    const result = await model.generateContent(prompt);
    console.log('📥 Received response from Gemini AI');
    
    const response = await result.response;
    let text = response.text();
    
    console.log('\n📄 Raw AI Response:');
    console.log('─────────────────────────────────────');
    console.log(text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    console.log('─────────────────────────────────────');
    console.log('Response length:', text.length, 'characters');
    
    // Clean and extract JSON
    console.log('\n🧹 Extracting JSON from response...');
    
    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Could not find valid JSON in the AI response.');
      throw new Error('Invalid response format from AI: No JSON found.');
    }
    
    console.log('📝 Extracted JSON preview:', jsonMatch[0].substring(0, 200) + '...');
    
    console.log('\n🔍 Parsing JSON...');
    const tree = JSON.parse(jsonMatch[0]);
    console.log('✓ JSON parsed successfully');
    
    // Validate structure
    console.log('\n🔍 Validating tree structure...');
    if (!tree.nodes || !Array.isArray(tree.nodes) || !tree.links || !Array.isArray(tree.links)) {
      throw new Error('Invalid tree structure from AI - missing nodes or links arrays');
    }
    console.log('✓ Tree structure valid');
    console.log('  - Nodes:', tree.nodes.length);
    console.log('  - Links:', tree.links.length);
    
    // Ensure at least one mastered and one active node
    console.log('\n🔧 Adjusting node statuses...');
    if (!tree.nodes.some(n => n.status === 'mastered')) {
      console.log('  - Setting first node to "mastered"');
      tree.nodes[0].status = 'mastered';
    }
    if (!tree.nodes.some(n => n.status === 'active')) {
      const firstLocked = tree.nodes.findIndex(n => n.status === 'locked');
      if (firstLocked > -1) {
        console.log(`  - Setting node ${firstLocked} to "active"`);
        tree.nodes[firstLocked].status = 'active';
      }
    }
    
    console.log('\n✅ AI generation complete!');
    console.log('Final tree preview:');
    tree.nodes.forEach((node, i) => {
      console.log(`  ${i+1}. [${node.status.padEnd(8)}] ${node.label.replace(/\n/g, ' ')} (level ${node.level})`);
    });
    
    return tree;
  } catch (error) {
    console.error('\n❌ AI generation failed!');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    if (error.stack) console.error('Stack trace:', error.stack);
    console.log('\n📄 Falling back to generic template...');
    // Fallback to a generic tree if AI fails
    return generateGenericTree(topic);
  }
}

function generateGenericTree(topic) {
  console.log('\n📋 Generating generic fallback tree');
  console.log('Topic:', topic);
  
  // Generic template for any topic (fallback)
  const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
  
  const tree = {
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
  
  console.log('✓ Generic tree created with', tree.nodes.length, 'nodes');
  return tree;
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
