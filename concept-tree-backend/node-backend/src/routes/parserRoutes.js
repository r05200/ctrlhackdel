/**
 * Parser Routes - AI-powered concept parsing
 */
const express = require('express');
const { ParserService, ConceptRefineService } = require('../services/parserService');

const router = express.Router();

/**
 * Middleware to check Gemini API configuration
 */
router.use((req, res, next) => {
  if (req.method !== 'GET' || req.path !== '/status') {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(503).json({
        error: 'Gemini API not configured',
        message: 'Set GEMINI_API_KEY environment variable to use AI parsing'
      });
    }
  }
  next();
});

/**
 * GET /api/parser/status
 * Check if parser is configured
 */
router.get('/status', (req, res) => {
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  
  res.json({
    available_endpoints: [
      'POST /api/parser/parse',
      'POST /api/parser/generate-from-topic',
      'GET /api/parser/validate/<category>',
      'GET /api/parser/examples',
      'POST /api/parser/infer-category'
    ],
    gemini_api_configured: geminiConfigured,
    status: geminiConfigured ? 'ready' : 'not_configured'
  });
});

/**
 * POST /api/parser/parse
 * Main parsing endpoint
 */
router.post('/parse', async (req, res) => {
  try {
    const { text, category } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text field required' });
    }

    const result = await ParserService.parseAndCreateConcepts(text, category || '');

    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Parsing error:', error);
    res.status(500).json({ error: `Parsing failed: ${error.message}` });
  }
});

/**
 * GET /api/parser/validate/:category
 * Validate a concept tree
 */
router.get('/validate/:category', async (req, res) => {
  try {
    const result = await ConceptRefineService.validateAndFixTree(req.params.category);
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/parser/infer-category
 * Infer category from text
 */
router.post('/infer-category', (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text field required' });
    }

    const category = ParserService.inferCategoryFromText(text);

    res.json({
      status: 'success',
      data: {
        inferred_category: category
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/parser/generate-from-topic
 * Generate skill tree from a simple topic description
 */
router.post('/generate-from-topic', async (req, res) => {
  try {
    const { topic, depth, difficulty_range } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'topic field required' });
    }

    // Build an enhanced prompt for topic-based generation
    const depthLevel = depth || 'comprehensive';
    const diffRange = difficulty_range || [1, 10];
    
    const enhancedText = `Generate a ${depthLevel} curriculum for learning: ${topic}

Please include:
- Core foundational concepts (difficulty ${diffRange[0]}-${Math.floor((diffRange[0] + diffRange[1]) / 2)})
- Intermediate building blocks
- Advanced applications (difficulty ${Math.floor((diffRange[0] + diffRange[1]) / 2)}-${diffRange[1]})
- Clear prerequisite relationships
- Logical learning progression

Structure this as a complete learning path with proper dependencies.`;

    const result = await ParserService.parseAndCreateConcepts(enhancedText, topic);

    res.status(201).json({
      status: 'success',
      data: {
        ...result,
        generation_method: 'topic',
        topic,
        depth: depthLevel
      }
    });
  } catch (error) {
    console.error('Topic generation error:', error);
    res.status(500).json({ error: `Generation failed: ${error.message}` });
  }
});

/**
 * GET /api/parser/examples
 * Get example inputs
 */
router.get('/examples', (req, res) => {
  const examples = {
    calculus_toc: `1. Limits and Continuity
2. Derivatives and Differentiation Rules
3. Applications of Derivatives
4. Integration and the Fundamental Theorem`,
    
    linear_algebra_toc: `1. Vectors and Vector Spaces
2. Matrices and Linear Systems
3. Eigenvalues and Eigenvectors
4. Diagonalization and SVD`,
    
    computer_science_toc: `1. Basic Programming and Algorithms
2. Data Structures
3. Complexity Analysis
4. Advanced Algorithms and Graphs`,
    
    topic_examples: [
      'Machine Learning Fundamentals',
      'Web Development',
      'Quantum Computing',
      'Data Science with Python'
    ]
  };

  res.json({
    status: 'success',
    data: {
      examples,
      usage: {
        parse: 'Send structured text as "text" field to POST /api/parser/parse',
        topic: 'Send simple topic as "topic" field to POST /api/parser/generate-from-topic'
      }
    }
  });
});

module.exports = router;
