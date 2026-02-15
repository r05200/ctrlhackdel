// API Service for Backend Integration
const API_BASE_URL = 'http://localhost:5001';
const API_FALLBACK_BASE_URL = 'http://localhost:5000';

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
    const response = await fetch(`${API_BASE_URL}/api/graph`);
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
    const response = await fetch(`${API_BASE_URL}/api/progress`);
    const data = await handleResponse(response);
    return data; // Returns { success, stats, userProgress }
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
};

// Complete a node (after passing boss fight)
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
    const response = await fetch(`${API_BASE_URL}/api/node/${nodeId}/complete`, {
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

// Verify user explanation (for boss fight)
export const verifyExplanation = async (nodeId, explanation, audioData = null, nodeData = null) => {
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
    const response = await fetch(`${API_BASE_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodeId,
        explanation,
        audioData,
        node: nodeData, // Pass the full node object
      }),
    });
    const data = await handleResponse(response);
    return data; // Returns { success, passed, score, feedback, message, suggestions }
  } catch (error) {
    console.error('Error verifying explanation:', error);
    throw error;
  }
};

// Reset progress (for testing)
export const resetProgress = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reset`, {
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
    const response = await fetch(`${API_BASE_URL}/api/generate-tree`, {
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
    return data;
  } catch (error) {
    console.error('Error generating custom tree:', error);
    throw error;
  }
};

// Check if backend is running
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    const data = await handleResponse(response);
    return data;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return { status: 'error', message: 'Backend not reachable' };
  }
};

// Past constellations CRUD (local JSON-backed on backend)
const constellationApiBases = [API_BASE_URL, API_FALLBACK_BASE_URL].filter(
  (base, idx, arr) => arr.indexOf(base) === idx
);

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

export const deletePastConstellation = async (id) => {
  return requestConstellationApi(`/api/constellations/${id}`, {
    method: 'DELETE'
  });
};
