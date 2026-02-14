// API Service for Backend Integration
const API_BASE_URL = 'http://localhost:5001';

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
export const completeNode = async (nodeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/node/${nodeId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await handleResponse(response);
    return data; // Returns { success, message, unlockedNodes, updatedGraph }
  } catch (error) {
    console.error('Error completing node:', error);
    throw error;
  }
};

// Verify user explanation (for boss fight)
export const verifyExplanation = async (nodeId, explanation, audioData = null) => {
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
