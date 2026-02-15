// API Service for Backend Integration
// Always call backend directly (no Vite proxy dependency).
const DEFAULT_API_BASE_URL = 'http://localhost:5000';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
const apiUrl = (path) => `${API_BASE_URL}${String(path).startsWith('/') ? path : `/${path}`}`;
const DEBUG_LOGS = import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === '1';

const buildFallbackGeneratedTree = (topic = 'New Topic') => {
  const base = String(topic || 'New Topic').trim() || 'New Topic';
  const topicClean = base.replace(/\s+/g, ' ').slice(0, 40);
  const topicId = topicClean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'topic';
  return {
    success: true,
    topic: topicClean,
    generation: {
      source: 'fallback',
      reason: 'frontend-fallback'
    },
    graph: {
      nodes: [
        { id: `${topicId}-basics`, label: `${topicClean}\nBasics`, status: 'active', level: 1, description: `Foundations of ${topicClean}` },
        { id: `${topicId}-concepts`, label: 'Core\nConcepts', status: 'locked', level: 2, description: `Key concepts in ${topicClean}` },
        { id: `${topicId}-practice`, label: 'Guided\nPractice', status: 'locked', level: 3, description: `Practice patterns for ${topicClean}` },
        { id: `${topicId}-advanced`, label: 'Advanced\nTopics', status: 'locked', level: 4, description: `Advanced ideas in ${topicClean}` },
        { id: `${topicId}-mastery`, label: 'Mastery', status: 'locked', level: 5, description: `Integrate and apply ${topicClean}` }
      ],
      links: [
        { source: `${topicId}-basics`, target: `${topicId}-concepts` },
        { source: `${topicId}-concepts`, target: `${topicId}-practice` },
        { source: `${topicId}-practice`, target: `${topicId}-advanced` },
        { source: `${topicId}-advanced`, target: `${topicId}-mastery` }
      ]
    }
  };
};

// Helper function to handle API errors
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'API request failed');
  }
  return response.json();
};

// Get the knowledge graph
export const fetchKnowledgeGraph = async () => {
  try {
    const response = await fetch(apiUrl('/api/graph'));
    const data = await handleResponse(response);
    return data.data; // Returns the graph object
  } catch (error) {
    console.error('Error fetching knowledge graph:', error);
    throw error;
  }
};

// Get user progress
export const fetchUserProgress = async () => {
  try {
    const response = await fetch(apiUrl('/api/progress'));
    const data = await handleResponse(response);
    return data; // Returns { success, stats, userProgress }
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
};

// Complete a node (after passing Star Trial)
export const completeNode = async (nodeId, score = null) => {
  // Debug mode: auto-return successful completion
  if (DEBUG_AUTO_PASS) {
    return {
      success: true,
      message: 'Node completed successfully!',
      unlockedNodes: [nodeId], // Return the completed node for animation
      updatedGraph: {}
    };
  }

  try {
    const response = await fetch(apiUrl(`/api/node/${nodeId}/complete`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score }),
    });
    const data = await handleResponse(response);
    return data; // Returns { success, message, unlockedNodes, updatedGraph }
  } catch (error) {
    console.error('Error completing node:', error);
    throw error;
  }
};

// Debug flag to auto-pass verification
const DEBUG_AUTO_PASS = false;

// Verify user explanation + star-trial critical thinking answers
export const verifyExplanation = async (
  nodeId,
  explanation,
  audioData = null,
  nodeData = null,
  trialAnswers = [],
  trialQuestions = []
) => {
  // Debug mode: auto-pass all verifications
  if (DEBUG_AUTO_PASS) {
    return {
      success: true,
      passed: true,
      score: 95,
      feedback: '✨ Excellent explanation! (Debug mode - auto-passed)',
      message: 'Explanation verified successfully!',
      suggestions: []
    };
  }

  try {
    const response = await fetch(apiUrl('/api/verify'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodeId,
        explanation,
        audioData,
        node: nodeData, // Pass the full node object
        trialAnswers,
        trialQuestions
      }),
    });
    const data = await handleResponse(response);
    return data; // Returns { success, passed, score, feedback, message, suggestions }
  } catch (error) {
    console.error('Error verifying explanation:', error);
    throw error;
  }
};

// Generate two critical-thinking questions for a star trial
export const generateStarTrialQuestions = async (nodeId, nodeData = null) => {
  const topic = String(nodeData?.label || 'this concept').replace(/\n/g, ' ');
  const fallback = {
    success: true,
    usingFallback: true,
    fallbackReason: 'Endpoint unavailable',
    questions: [
      {
        id: 'q1',
        prompt: `How would you apply ${topic} in a real scenario, and why does that approach work?`,
        whatToLookFor: ['applies concept', 'reasoning'],
        difficulty: 'medium'
      },
      {
        id: 'q2',
        prompt: `What is a common misconception about ${topic}, and how would you correct it?`,
        whatToLookFor: ['identifies misconception', 'corrective explanation'],
        difficulty: 'medium'
      }
    ]
  };

  try {
    const response = await fetch(apiUrl('/api/star-trial/questions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodeId,
        node: nodeData
      }),
    });
    const data = await handleResponse(response);
    return data;
  } catch (error) {
    console.warn('Star trial questions endpoint unavailable, using fallback prompts:', error?.message || error);
    return fallback;
  }
};

// Reset progress (for testing)
export const resetProgress = async () => {
  try {
    const response = await fetch(apiUrl('/api/reset'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await handleResponse(response);
    return data; // Returns { success, message, graph }
  } catch (error) {
    console.error('Error resetting progress:', error);
    throw error;
  }
};

// Generate custom tree (bonus feature - requires LLM)
export const generateCustomTree = async (topic, difficulty = 'medium') => {
  try {
    const response = await fetch(apiUrl('/api/generate-tree'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        difficulty,
      }),
    });
    const data = await handleResponse(response);
    const meta = data?.generation;
    if (meta && DEBUG_LOGS) {
      console.log(
        `[TreeGen] source=${meta.source} reason=${meta.reason || 'none'} apiKeyStatus=${meta.apiKeyStatus} modelAvailable=${meta.modelAvailable}`
      );
    } else if (!meta && DEBUG_LOGS) {
      console.warn('[TreeGen] No generation metadata returned by backend');
    }
    return data;
  } catch (error) {
    if (DEBUG_LOGS) {
      console.error('Error generating custom tree:', error);
      console.warn('Falling back to local generated tree due to API failure.');
    }
    return buildFallbackGeneratedTree(topic);
  }
};

// Transcribe audio via ElevenLabs (voice route)
export const transcribeAudio = async (audioBlob, filename = 'recording.webm') => {
  const formData = new FormData();
  formData.append('audio', audioBlob, filename);

  const response = await fetch(apiUrl('/api/voice/transcribe'), {
    method: 'POST',
    body: formData, // no Content-Type header – browser sets multipart boundary
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Transcription failed' }));
    throw new Error(err.error || 'Transcription failed');
  }

  const json = await response.json();
  // ElevenLabs returns { text: "..." } inside data wrapper
  const text = json?.data?.text ?? '';
  if (!text.trim()) throw new Error('Transcription returned empty text. Please try again.');
  return text;
};

// Check if backend is running
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(apiUrl('/api/graph'));
    const data = await handleResponse(response);
    return data;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return { status: 'error', message: 'Backend not reachable' };
  }
};

// Past constellations CRUD (local JSON-backed on backend)
const constellationApiBases = [API_BASE_URL];

const requestConstellationApi = async (path, options = {}) => {
  let lastError = null;

  for (const base of constellationApiBases) {
    try {
      const response = await fetch(`${base}${path}`, options);
      if (response.status === 404) {
        lastError = new Error('Endpoint not found');
        continue;
      }
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || 'API request failed');
      }
      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Constellation API unavailable');
};

export const fetchPastConstellations = async ({ q = '', tag = '' } = {}) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (tag) params.set('tag', tag);

  const query = params.toString();
  const data = await requestConstellationApi(`/api/constellations${query ? `?${query}` : ''}`);
  return data.items || [];
};

export const createPastConstellation = async ({ title, query, tags = [], graph }) => {
  return requestConstellationApi('/api/constellations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, query, tags, graph })
  });
};

export const updatePastConstellationTags = async (id, tags = []) => {
  return requestConstellationApi(`/api/constellations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tags })
  });
};

export const updatePastConstellationTitle = async (id, title) => {
  return requestConstellationApi(`/api/constellations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title })
  });
};

export const deletePastConstellation = async (id) => {
  return requestConstellationApi(`/api/constellations/${id}`, {
    method: 'DELETE'
  });
};
