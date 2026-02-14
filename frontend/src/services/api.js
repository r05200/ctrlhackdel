/**
 * API Service for communicating with the backend
 */

const API_URL = 'http://localhost:5000';

// Error handling helper
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  return response.json();
};

const apiService = {
  /**
   * Get the complete knowledge graph
   */
  getGraph: async () => {
    try {
      const response = await fetch(`${API_URL}/api/graph`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching graph:', error);
      throw error;
    }
  },

  /**
   * Get user progress and statistics
   */
  getProgress: async () => {
    try {
      const response = await fetch(`${API_URL}/api/progress`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw error;
    }
  },

  /**
   * Complete a node (after successful boss fight)
   */
  completeNode: async (nodeId) => {
    try {
      const response = await fetch(`${API_URL}/api/node/${nodeId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error completing node:', error);
      throw error;
    }
  },

  /**
   * Verify an explanation using AI
   */
  verifyExplanation: async (nodeId, explanation, audioData = null) => {
    try {
      const response = await fetch(`${API_URL}/api/verify`, {
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
      return handleResponse(response);
    } catch (error) {
      console.error('Error verifying explanation:', error);
      throw error;
    }
  },

  /**
   * Reset all progress (for testing)
   */
  resetProgress: async () => {
    try {
      const response = await fetch(`${API_URL}/api/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error resetting progress:', error);
      throw error;
    }
  },

  /**
   * Generate a custom skill tree (bonus feature)
   */
  generateTree: async (topic, difficulty = 'intermediate', treeName = '') => {
    try {
      const response = await fetch(`${API_URL}/api/generate-tree`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          difficulty,
          treeName,
        }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error generating tree:', error);
      throw error;
    }
  },

  /**
   * Get all user's custom trees
   */
  getTrees: async () => {
    try {
      const response = await fetch(`${API_URL}/api/trees`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching trees:', error);
      throw error;
    }
  },

  /**
   * Delete a custom tree
   */
  deleteTree: async (treeId) => {
    try {
      const response = await fetch(`${API_URL}/api/trees/${treeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error deleting tree:', error);
      throw error;
    }
  },

  /**
   * Update tree status
   */
  updateTreeStatus: async (treeId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/trees/${treeId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error updating tree:', error);
      throw error;
    }
  },
};

export default apiService;
