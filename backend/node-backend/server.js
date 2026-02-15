require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs/promises');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import route modules from src/
const voiceRoutes = require('./src/routes/voiceRoutes');
const treeRoutes = require('./src/routes/treeRoutes');

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

const STATUS = {
  LOCKED: -1,
  ACTIVE: 0
};

function statusToNumber(status) {
  if (typeof status === 'number' && Number.isFinite(status)) {
    return status;
  }
  if (typeof status === 'string') {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'locked') return STATUS.LOCKED;
    if (normalized === 'active') return STATUS.ACTIVE;
    if (normalized === 'mastered') return 95;
  }
  return STATUS.LOCKED;
}

const CONSTELLATION_STORE_DIR = path.join(__dirname, 'data');
const CONSTELLATION_STORE_FILE = path.join(CONSTELLATION_STORE_DIR, 'constellations.json');

const createConstellationId = () => `const_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

async function ensureConstellationStore() {
  await fs.mkdir(CONSTELLATION_STORE_DIR, { recursive: true });
  try {
    await fs.access(CONSTELLATION_STORE_FILE);
  } catch {
    const seed = { items: [] };
    await fs.writeFile(CONSTELLATION_STORE_FILE, JSON.stringify(seed, null, 2), 'utf-8');
  }
}

async function readConstellationStore() {
  await ensureConstellationStore();
  const raw = await fs.readFile(CONSTELLATION_STORE_FILE, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!parsed.items || !Array.isArray(parsed.items)) {
    return { items: [] };
  }
  return parsed;
}

async function writeConstellationStore(store) {
  await ensureConstellationStore();
  await fs.writeFile(CONSTELLATION_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

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

// Past constellations (local JSON-backed)
app.get('/api/constellations', async (req, res) => {
  try {
    const { q = '', tag = '' } = req.query;
    const query = String(q || '').trim().toLowerCase();
    const normalizedTag = String(tag || '').trim().toLowerCase();
    const store = await readConstellationStore();

    let items = [...store.items];
    if (query) {
      items = items.filter((item) => {
        const title = String(item.title || '').toLowerCase();
        const sourceQuery = String(item.query || '').toLowerCase();
        return title.includes(query) || sourceQuery.includes(query);
      });
    }

    if (normalizedTag) {
      items = items.filter((item) =>
        Array.isArray(item.tags) &&
        item.tags.some((t) => String(t).toLowerCase() === normalizedTag)
      );
    }

    items.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error loading constellations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load constellations'
    });
  }
});

app.post('/api/constellations', async (req, res) => {
  try {
    const { title, query, tags = [], graph } = req.body || {};
    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.links)) {
      return res.status(400).json({
        success: false,
        message: 'graph with nodes and links is required'
      });
    }

    const cleanTags = Array.isArray(tags)
      ? [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))]
      : [];

    const store = await readConstellationStore();
    const now = new Date().toISOString();
    const item = {
      id: createConstellationId(),
      title: String(title || query || 'Untitled Constellation').trim(),
      query: String(query || '').trim(),
      tags: cleanTags,
      gauntletBestScore: null,
      graph,
      createdAt: now,
      updatedAt: now
    };

    store.items.push(item);
    await writeConstellationStore(store);

    res.status(201).json({
      success: true,
      item
    });
  } catch (error) {
    console.error('Error saving constellation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save constellation'
    });
  }
});

app.patch('/api/constellations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags, title, gauntletBestScore } = req.body || {};
    const hasTags = Object.prototype.hasOwnProperty.call(req.body || {}, 'tags');
    const hasTitle = Object.prototype.hasOwnProperty.call(req.body || {}, 'title');
    const hasGauntletBest = Object.prototype.hasOwnProperty.call(req.body || {}, 'gauntletBestScore');

    if (!hasTags && !hasTitle && !hasGauntletBest) {
      return res.status(400).json({
        success: false,
        message: 'at least one of tags, title, or gauntletBestScore is required'
      });
    }

    if (hasTags && !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'tags must be an array when provided'
      });
    }

    const cleanTags = hasTags
      ? [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))]
      : null;
    const cleanTitle = hasTitle
      ? String(title || '').trim().slice(0, 120)
      : null;

    if (hasTitle && !cleanTitle) {
      return res.status(400).json({
        success: false,
        message: 'title cannot be empty'
      });
    }

    let cleanGauntletBest = null;
    if (hasGauntletBest) {
      const n = Number(gauntletBestScore);
      if (!Number.isFinite(n)) {
        return res.status(400).json({
          success: false,
          message: 'gauntletBestScore must be a number when provided'
        });
      }
      cleanGauntletBest = Math.max(0, Math.min(100, Math.round(n)));
    }

    const store = await readConstellationStore();
    const idx = store.items.findIndex((item) => item.id === id);

    if (idx === -1) {
      return res.status(404).json({
        success: false,
        message: 'Constellation not found'
      });
    }

    if (hasTags) {
      store.items[idx].tags = cleanTags;
    }
    if (hasTitle) {
      store.items[idx].title = cleanTitle;
    }
    if (hasGauntletBest) {
      const existingBest = Number.isFinite(Number(store.items[idx].gauntletBestScore))
        ? Number(store.items[idx].gauntletBestScore)
        : null;
      store.items[idx].gauntletBestScore = existingBest === null
        ? cleanGauntletBest
        : Math.max(existingBest, cleanGauntletBest);
    }
    store.items[idx].updatedAt = new Date().toISOString();
    await writeConstellationStore(store);

    res.json({
      success: true,
      item: store.items[idx]
    });
  } catch (error) {
    console.error('Error updating constellation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update constellation'
    });
  }
});

app.delete('/api/constellations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const store = await readConstellationStore();
    const nextItems = store.items.filter((item) => item.id !== id);

    if (nextItems.length === store.items.length) {
      return res.status(404).json({
        success: false,
        message: 'Constellation not found'
      });
    }

    store.items = nextItems;
    await writeConstellationStore(store);

    res.json({
      success: true,
      message: 'Constellation deleted'
    });
  } catch (error) {
    console.error('Error deleting constellation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete constellation'
    });
  }
});

// Get user progress
app.get('/api/progress', (req, res) => {
  const nodeStatuses = knowledgeGraph.nodes.map((n) => statusToNumber(n.status));
  const masteredCount = nodeStatuses.filter((status) => status > STATUS.ACTIVE).length;
  const activeCount = nodeStatuses.filter((status) => status === STATUS.ACTIVE).length;
  const lockedCount = nodeStatuses.filter((status) => status === STATUS.LOCKED).length;

  const stats = {
    total: knowledgeGraph.nodes.length,
    mastered: masteredCount,
    active: activeCount,
    locked: lockedCount,
    percentage: Math.round((masteredCount / knowledgeGraph.nodes.length) * 100)
  };
  
  res.json({
    success: true,
    stats,
    userProgress
  });
});

// Complete a node (after Star Trial)
app.post('/api/node/:nodeId/complete', (req, res) => {
  const { nodeId } = req.params;
  const { score } = req.body || {};
  
  // Find the node in backend's knowledgeGraph
  const nodeIndex = knowledgeGraph.nodes.findIndex(n => n.id === nodeId);
  
  // If node not in backend graph, it's from an AI-generated tree
  // Frontend handles those updates, so just return success
  if (nodeIndex === -1) {
    return res.json({
      success: true,
      message: `Node completed successfully!`,
      unlockedNodes: [],
      updatedGraph: {} // Frontend manages AI-generated graphs
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

// Generate critical-thinking questions for Star Trial
app.post('/api/star-trial/questions', async (req, res) => {
  const { nodeId, node: providedNode } = req.body || {};
  let node = providedNode;

  if (!node && nodeId) {
    const nodeIndex = knowledgeGraph.nodes.findIndex((n) => n.id === nodeId);
    node = knowledgeGraph.nodes[nodeIndex];
  }

  if (!node) {
    return res.status(404).json({
      success: false,
      message: 'Node not found'
    });
  }

  try {
    const questionsResult = await generateStarTrialQuestionsWithAI(node);
    return res.json({
      success: true,
      questions: questionsResult.questions,
      usingFallback: questionsResult.usingFallback || false,
      fallbackReason: questionsResult.reason || null
    });
  } catch (error) {
    console.error('Failed to generate star trial questions:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate star trial questions',
      error: error.message
    });
  }
});

// Verify explanation with Gemini AI
app.post('/api/verify', async (req, res) => {
  const {
    nodeId,
    explanation,
    audioData,
    node: providedNode,
    trialAnswers = [],
    trialQuestions = []
  } = req.body;
  
  console.log('\n========================================');
  console.log('🌟 STAR TRIAL VERIFICATION REQUEST');
  console.log('========================================');
  console.log('Node ID:', nodeId);
  console.log('Explanation length:', explanation ? explanation.length : 0);
  console.log('Provided node:', providedNode ? 'YES' : 'NO');
  console.log('Audio data:', audioData ? 'YES' : 'NO');
  console.log('Critical thinking answers:', Array.isArray(trialAnswers) ? trialAnswers.length : 0);
  
  // Use provided node data from frontend (for AI-generated trees) or look up in backend graph
  let node = providedNode;
  let nodeIndex = -1;
  
  if (!node) {
    console.log('📍 No node provided, looking up in backend graph...');
    // Fall back to looking up in backend's knowledgeGraph (for default tree)
    nodeIndex = knowledgeGraph.nodes.findIndex(n => n.id === nodeId);
    node = knowledgeGraph.nodes[nodeIndex];
  } else {
    console.log('✓ Using provided node from frontend');
  }
  
  if (!node) {
    console.log('❌ Node not found:', nodeId);
    return res.status(404).json({
      success: false,
      message: 'Node not found'
    });
  }
  
  console.log('✓ Node found:', node.label);
  console.log('  Node status:', node.status, '(type:', typeof node.status, ')');
  
  // Check if node is locked (only for backend graph nodes)
  const normalizedStatus = typeof node.status === 'number' 
    ? (node.status > 0 ? 'mastered' : node.status === 0 ? 'active' : 'locked')
    : node.status;
  
  console.log('  Normalized status:', normalizedStatus);
    
  if (normalizedStatus === 'locked') {
    console.log('❌ Node is locked');
    return res.status(400).json({
      success: false,
      message: 'Node is locked. Complete prerequisites first.',
      currentStatus: node.status
    });
  }

  if (!explanation || explanation.trim().length < 10) {
    console.log('❌ Explanation too short or missing');
    return res.status(400).json({
      success: false,
      message: 'Please provide a detailed explanation (at least 10 characters)'
    });
  }

  if (!Array.isArray(trialAnswers) || trialAnswers.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Please answer both critical-thinking prompts.'
    });
  }

  const hasMissingTrialAnswer = trialAnswers.some((entry) => !entry || !String(entry.answer || '').trim());
  if (hasMissingTrialAnswer) {
    return res.status(400).json({
      success: false,
      message: 'Critical-thinking answers cannot be empty.'
    });
  }
  
  console.log('✓ All checks passed, calling AI verification...');

  try {
    console.log('🤖 Calling Gemini AI for verification...');
    const result = await verifyExplanationWithAI(node, explanation, trialAnswers, trialQuestions);
    
    console.log('✅ AI Verification complete!');
    console.log('Score:', result.score);
    console.log('Passed:', result.passed);
    if (result.usingFallback) {
      console.log('⚠️  Used fallback scoring due to:', result.reason);
    }

    // Only update backend graph if node exists in it (not for AI-generated nodes)
    let previousBestScore = null;
    if (nodeIndex !== -1 && knowledgeGraph.nodes[nodeIndex]) {
      previousBestScore = knowledgeGraph.nodes[nodeIndex].status > STATUS.ACTIVE ? knowledgeGraph.nodes[nodeIndex].status : null;
    }
    
    const bestScore = previousBestScore === null ? null : Math.max(previousBestScore, result.score);
    const scoreDelta = previousBestScore === null ? null : result.score - previousBestScore;
    const scoreDeltaPercent = previousBestScore
      ? Number((((result.score - previousBestScore) / previousBestScore) * 100).toFixed(2))
      : null;
    const improvedBest = previousBestScore === null ? true : result.score > previousBestScore;
    
    // Persist best score only for nodes in backend graph
    if (nodeIndex !== -1 && previousBestScore !== null) {
      knowledgeGraph.nodes[nodeIndex].status = bestScore;
    }
    userProgress.completedChallenges += 1;
    
    console.log('========================================\n');
    
    res.json({
      success: true,
      passed: result.passed,
      score: result.score,
      attemptScore: result.score,
      previousBestScore,
      bestScore: bestScore === null ? result.score : bestScore,
      scoreDelta,
      scoreDeltaPercent,
      improvedBest,
      feedback: result.feedback,
      message: result.message,
      suggestions: result.suggestions,
      trialReview: result.trialReview || [],
      explanationScore: result.explanationScore ?? null,
      criticalThinkingScore: result.criticalThinkingScore ?? null,
      usingFallback: result.usingFallback || false,
      fallbackReason: result.reason || null
    });
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.log('========================================\n');
    res.status(500).json({
      success: false,
      message: 'Failed to verify explanation',
      error: error.message
    });
  }
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
- Generate 12-20 nodes
- First node only: status "active" (current node to work on)
- All other nodes: status "locked" (not yet accessible)
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
    
    // Ensure only the first node is active, all others locked
    console.log('\n🔧 Adjusting node statuses...');
    tree.nodes.forEach((node, index) => {
      if (index === 0) {
        console.log(`  - Setting first node "${node.label}" to "active"`);
        tree.nodes[index].status = 'active';
      } else {
        console.log(`  - Setting node "${node.label}" to "locked"`);
        tree.nodes[index].status = 'locked';
      }
    });
    
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
      { id: 'basics', label: `${capitalizedTopic}\nBasics`, status: 'active', level: 1, description: 'Fundamental concepts and introduction' },
      { id: 'terminology', label: 'Key\nTerminology', status: 'locked', level: 1, description: 'Essential vocabulary and definitions' },
      { id: 'fundamentals', label: 'Core\nFundamentals', status: 'locked', level: 2, description: 'Essential principles and practices' },
      { id: 'concepts-1', label: 'Core\nConcepts I', status: 'locked', level: 2, description: 'First set of core ideas' },
      { id: 'concepts-2', label: 'Core\nConcepts II', status: 'locked', level: 2, description: 'Second set of core ideas' },
      { id: 'intermediate-1', label: 'Intermediate\nTopics I', status: 'locked', level: 3, description: 'Building on the foundations' },
      { id: 'intermediate-2', label: 'Intermediate\nTopics II', status: 'locked', level: 3, description: 'Expanding knowledge' },
      { id: 'intermediate-3', label: 'Intermediate\nTopics III', status: 'locked', level: 3, description: 'Advanced fundamentals' },
      { id: 'advanced-1', label: 'Advanced\nTopics I', status: 'locked', level: 4, description: 'Deep dive into complex areas' },
      { id: 'advanced-2', label: 'Advanced\nTopics II', status: 'locked', level: 4, description: 'Specialized knowledge' },
      { id: 'advanced-3', label: 'Advanced\nTopics III', status: 'locked', level: 4, description: 'Expert techniques' },
      { id: 'practical-1', label: 'Practical\nApplications I', status: 'locked', level: 5, description: 'Real-world projects' },
      { id: 'practical-2', label: 'Practical\nApplications II', status: 'locked', level: 5, description: 'Use cases and examples' },
      { id: 'integration', label: 'System\nIntegration', status: 'locked', level: 5, description: 'Combining concepts together' },
      { id: 'optimization', label: 'Performance &\nOptimization', status: 'locked', level: 6, description: 'Efficiency and best practices' },
      { id: 'mastery', label: 'Mastery &\nExpertise', status: 'locked', level: 6, description: 'Expert-level skills' },
    ],
    links: [
      { source: 'basics', target: 'terminology' },
      { source: 'basics', target: 'fundamentals' },
      { source: 'terminology', target: 'concepts-1' },
      { source: 'fundamentals', target: 'concepts-1' },
      { source: 'fundamentals', target: 'concepts-2' },
      { source: 'concepts-1', target: 'intermediate-1' },
      { source: 'concepts-2', target: 'intermediate-2' },
      { source: 'concepts-1', target: 'intermediate-2' },
      { source: 'concepts-2', target: 'intermediate-3' },
      { source: 'intermediate-1', target: 'advanced-1' },
      { source: 'intermediate-2', target: 'advanced-1' },
      { source: 'intermediate-2', target: 'advanced-2' },
      { source: 'intermediate-3', target: 'advanced-2' },
      { source: 'intermediate-3', target: 'advanced-3' },
      { source: 'advanced-1', target: 'practical-1' },
      { source: 'advanced-2', target: 'practical-1' },
      { source: 'advanced-2', target: 'practical-2' },
      { source: 'advanced-3', target: 'practical-2' },
      { source: 'practical-1', target: 'integration' },
      { source: 'practical-2', target: 'integration' },
      { source: 'integration', target: 'optimization' },
      { source: 'optimization', target: 'mastery' },
      { source: 'practical-2', target: 'mastery' },
    ]
  };
  
  console.log('✓ Generic tree created with', tree.nodes.length, 'nodes');
  return tree;
}

// AI-powered Star Trial helpers
function safeString(value) {
  return String(value || '').trim();
}

function buildFallbackStarTrialQuestions(node) {
  const topic = safeString(node?.label).replace(/\n/g, ' ') || 'this concept';
  return [
    {
      id: 'q1',
      prompt: `How would you apply ${topic} in a realistic scenario, and why is your approach effective?`,
      whatToLookFor: ['applies the concept to a concrete scenario', 'explains reasoning'],
      difficulty: 'medium'
    },
    {
      id: 'q2',
      prompt: `What is a common misconception about ${topic}, and how would you correct it?`,
      whatToLookFor: ['identifies a misconception', 'provides a corrective explanation'],
      difficulty: 'medium'
    }
  ];
}

async function generateStarTrialQuestionsWithAI(node) {
  if (!model) {
    return {
      questions: buildFallbackStarTrialQuestions(node),
      usingFallback: true,
      reason: 'API not configured'
    };
  }

  const prompt = `You are generating exactly two critical-thinking prompts for a learning checkpoint.

Concept: "${safeString(node.label).replace(/\n/g, ' ')}"
Description: "${safeString(node.description)}"

Output JSON only, with this schema:
{
  "questions": [
    {
      "id": "q1",
      "prompt": "question text",
      "whatToLookFor": ["criterion 1", "criterion 2"],
      "difficulty": "medium"
    },
    {
      "id": "q2",
      "prompt": "question text",
      "whatToLookFor": ["criterion 1", "criterion 2"],
      "difficulty": "medium"
    }
  ]
}

Rules:
- Exactly 2 questions.
- Questions must require reasoning/application (not pure recall).
- Keep each question under 180 characters.
- Keep "whatToLookFor" concise (2-4 items each).`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { questions: buildFallbackStarTrialQuestions(node), usingFallback: true, reason: 'AI parse failure' };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    if (questions.length !== 2) {
      return { questions: buildFallbackStarTrialQuestions(node), usingFallback: true, reason: 'AI schema mismatch' };
    }

    const normalized = questions.map((q, idx) => ({
      id: safeString(q.id) || `q${idx + 1}`,
      prompt: safeString(q.prompt),
      whatToLookFor: Array.isArray(q.whatToLookFor) ? q.whatToLookFor.map((item) => safeString(item)).filter(Boolean).slice(0, 4) : [],
      difficulty: safeString(q.difficulty) || 'medium'
    })).filter((q) => q.prompt);

    if (normalized.length !== 2) {
      return { questions: buildFallbackStarTrialQuestions(node), usingFallback: true, reason: 'AI normalization failure' };
    }

    return { questions: normalized };
  } catch (error) {
    return {
      questions: buildFallbackStarTrialQuestions(node),
      usingFallback: true,
      reason: error.message || 'AI error'
    };
  }
}

async function verifyExplanationWithAI(node, explanation, trialAnswers = [], trialQuestions = [], retryCount = 0, maxRetries = 2) {
  console.log('\n?? AI Verification Function Called');
  console.log('Node:', node.label);
  console.log('Explanation:', explanation.substring(0, 100) + (explanation.length > 100 ? '...' : ''));
  if (retryCount > 0) console.log(`? Retry attempt ${retryCount}/${maxRetries}`);

  const normalizedAnswers = Array.isArray(trialAnswers)
    ? trialAnswers.map((item, idx) => ({
      id: safeString(item?.id) || `q${idx + 1}`,
      answer: safeString(item?.answer)
    }))
    : [];
  const normalizedQuestions = Array.isArray(trialQuestions)
    ? trialQuestions.map((q, idx) => ({
      id: safeString(q?.id) || `q${idx + 1}`,
      prompt: safeString(q?.prompt),
      whatToLookFor: Array.isArray(q?.whatToLookFor) ? q.whatToLookFor.map((x) => safeString(x)).filter(Boolean) : []
    }))
    : [];

  if (!model) {
    return {
      ...fallbackVerification(node, explanation, normalizedAnswers, normalizedQuestions),
      usingFallback: true,
      reason: 'API not configured'
    };
  }

  const prompt = `You are an expert educator evaluating a student's "Star Trial" for "${safeString(node.label).replace(/\n/g, ' ')}".

Topic Description: ${safeString(node.description)}

Student Explanation:
"${explanation}"

Critical-thinking questions and student answers:
${JSON.stringify(normalizedQuestions.map((q) => {
  const answer = normalizedAnswers.find((a) => a.id === q.id)?.answer || '';
  return {
    id: q.id,
    prompt: q.prompt,
    whatToLookFor: q.whatToLookFor,
    answer
  };
}), null, 2)}

Important: grade semantically. Do NOT require exact wording.
Judge whether answers demonstrate understanding, reasoning, and application.

Return ONLY JSON with this schema:
{
  "score": 0-100,
  "passed": true/false,
  "explanationScore": 0-100,
  "criticalThinkingScore": 0-100,
  "feedback": "short summary",
  "strengths": ["..."],
  "improvements": ["..."],
  "trialReview": [
    { "id": "q1", "score": 0-100, "passed": true/false, "feedback": "..." },
    { "id": "q2", "score": 0-100, "passed": true/false, "feedback": "..." }
  ]
}

Scoring weights:
- explanationScore: 60%
- criticalThinkingScore: 40% (average across answers)
Pass threshold: score >= 70.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackVerification(node, explanation, normalizedAnswers, normalizedQuestions);
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    if (typeof evaluation.score !== 'number' || typeof evaluation.passed !== 'boolean') {
      return fallbackVerification(node, explanation, normalizedAnswers, normalizedQuestions);
    }

    const explanationScore = typeof evaluation.explanationScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(evaluation.explanationScore)))
      : Math.max(0, Math.min(100, Math.round(evaluation.score)));
    const criticalThinkingScore = typeof evaluation.criticalThinkingScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(evaluation.criticalThinkingScore)))
      : explanationScore;
    const score = Math.max(0, Math.min(100, Math.round(evaluation.score)));
    const trialReview = Array.isArray(evaluation.trialReview) ? evaluation.trialReview : [];

    return {
      score,
      passed: Boolean(evaluation.passed),
      explanationScore,
      criticalThinkingScore,
      trialReview: trialReview.map((r, idx) => ({
        id: safeString(r?.id) || `q${idx + 1}`,
        score: typeof r?.score === 'number' ? Math.max(0, Math.min(100, Math.round(r.score))) : null,
        passed: typeof r?.passed === 'boolean' ? r.passed : null,
        feedback: safeString(r?.feedback)
      })),
      feedback: safeString(evaluation.feedback) || 'Evaluation completed.',
      message: Boolean(evaluation.passed)
        ? `Excellent work. You passed this Star Trial for ${safeString(node.label).replace(/\n/g, ' ')}.`
        : 'Not quite there yet. Keep refining your explanation and reasoning.',
      suggestions: Array.isArray(evaluation.improvements) ? evaluation.improvements.map((x) => safeString(x)).filter(Boolean) : []
    };
  } catch (error) {
    const isQuotaError = error.message && (
      error.message.includes('429') ||
      error.message.includes('quota') ||
      error.message.includes('rate limit') ||
      error.message.includes('Too Many Requests')
    );

    let retryDelay = 2000;
    const retryMatch = error.message.match(/retry in ([0-9.]+)s/);
    if (retryMatch) {
      retryDelay = Math.ceil(parseFloat(retryMatch[1]) * 1000) + 500;
    }

    if (isQuotaError && retryCount < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return verifyExplanationWithAI(
        node,
        explanation,
        normalizedAnswers,
        normalizedQuestions,
        retryCount + 1,
        maxRetries
      );
    }

    return {
      ...fallbackVerification(node, explanation, normalizedAnswers, normalizedQuestions),
      usingFallback: true,
      reason: isQuotaError ? 'Gemini quota exceeded' : 'API error',
      originalError: error.message
    };
  }
}

function fallbackVerification(node, explanation, trialAnswers = [], trialQuestions = []) {
  const words = safeString(explanation).split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const nodeTokens = safeString(node.label).toLowerCase().split(/\s+/).filter((t) => t.length > 3);
  const lowerExplanation = safeString(explanation).toLowerCase();
  const hasNodeKeywords = nodeTokens.some((word) => lowerExplanation.includes(word));

  let explanationScore = 0;
  const feedback = [];

  if (wordCount >= 30) {
    explanationScore += 72;
    feedback.push('Good explanation depth');
  } else if (wordCount >= 18) {
    explanationScore += 58;
    feedback.push('Decent explanation, add more depth');
  } else {
    explanationScore += 40;
    feedback.push('Explanation is brief');
  }

  if (hasNodeKeywords) explanationScore += 16;
  if (safeString(explanation).includes('.') || safeString(explanation).includes(',')) explanationScore += 8;
  explanationScore = Math.max(0, Math.min(100, explanationScore));

  const trialReview = [];
  const questionIds = (trialQuestions.length ? trialQuestions : buildFallbackStarTrialQuestions(node)).map((q, idx) => safeString(q.id) || `q${idx + 1}`);
  let trialScoreTotal = 0;

  questionIds.forEach((id) => {
    const answer = safeString(trialAnswers.find((a) => a.id === id)?.answer);
    const answerWords = answer.split(/\s+/).filter(Boolean).length;
    let answerScore = 30;
    if (answerWords >= 18) answerScore = 85;
    else if (answerWords >= 10) answerScore = 68;
    else if (answerWords >= 6) answerScore = 55;

    const passed = answerScore >= 65;
    trialScoreTotal += answerScore;
    trialReview.push({
      id,
      score: answerScore,
      passed,
      feedback: passed ? 'Reasoning is present; add one concrete example for even stronger depth.' : 'Answer is too short; include reasoning and an applied example.'
    });
  });

  const criticalThinkingScore = trialReview.length
    ? Math.round(trialScoreTotal / trialReview.length)
    : 60;

  const score = Math.round((explanationScore * 0.6) + (criticalThinkingScore * 0.4));
  const passed = score >= 70;

  return {
    score,
    passed,
    explanationScore,
    criticalThinkingScore,
    trialReview,
    feedback: feedback.join('. ') || 'Evaluation complete.',
    message: passed
      ? `Good job! You demonstrated understanding of ${safeString(node.label).replace(/\n/g, ' ')}.`
      : 'Not quite there. Add more depth and clearer reasoning in both explanation and critical-thinking responses.',
    suggestions: !passed ? [
      'Use one concrete real-world example in each response',
      'Explain why your approach works, not just what it is',
      'Address one common misconception explicitly'
    ] : []
  };
}
// Mount modular routes
app.use('/api/voice', voiceRoutes);
app.use('/api/trees', treeRoutes);

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
      'POST /api/generate-tree',
      'POST /api/voice/transcribe',
      'CRUD /api/trees/:userId'
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
  ✓ POST /api/voice/transcribe   - Transcribe voice input
  ✓ CRUD /api/trees/:userId      - Manage custom trees
  
  💡 Tip: Visit http://localhost:${PORT} for full API info
  `);
});

module.exports = app;

