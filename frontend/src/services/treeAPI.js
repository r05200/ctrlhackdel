/**
 * Tree API Service
 * Handles all API calls related to skill trees
 */

const API_URL = 'http://localhost:5000/api/trees';

const treeAPI = {
  /**
   * Get all trees for a user with optional filters
   */
  getTreesByUser: async (userId, filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.tags) queryParams.append('tags', filters.tags);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`${API_URL}/${userId}?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch trees');
      return await response.json();
    } catch (error) {
      console.error('Error fetching trees:', error);
      throw error;
    }
  },

  /**
   * Get a specific tree by ID
   */
  getTreeById: async (treeId) => {
    try {
      const response = await fetch(`${API_URL}/get/${treeId}`);
      if (!response.ok) throw new Error('Failed to fetch tree');
      return await response.json();
    } catch (error) {
      console.error('Error fetching tree:', error);
      throw error;
    }
  },

  /**
   * Create a new tree
   */
  createTree: async (userId, treeData) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...treeData
        })
      });
      if (!response.ok) throw new Error('Failed to create tree');
      return await response.json();
    } catch (error) {
      console.error('Error creating tree:', error);
      throw error;
    }
  },

  /**
   * Update a tree
   */
  updateTree: async (treeId, userId, treeData) => {
    try {
      const response = await fetch(`${API_URL}/${treeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...treeData
        })
      });
      if (!response.ok) throw new Error('Failed to update tree');
      return await response.json();
    } catch (error) {
      console.error('Error updating tree:', error);
      throw error;
    }
  },

  /**
   * Delete a tree
   */
  deleteTree: async (treeId, userId) => {
    try {
      const response = await fetch(`${API_URL}/${treeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to delete tree');
      return await response.json();
    } catch (error) {
      console.error('Error deleting tree:', error);
      throw error;
    }
  },

  /**
   * Archive a tree
   */
  archiveTree: async (treeId, userId) => {
    try {
      const response = await fetch(`${API_URL}/${treeId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to archive tree');
      return await response.json();
    } catch (error) {
      console.error('Error archiving tree:', error);
      throw error;
    }
  },

  /**
   * Unarchive a tree
   */
  unarchiveTree: async (treeId, userId) => {
    try {
      const response = await fetch(`${API_URL}/${treeId}/unarchive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to unarchive tree');
      return await response.json();
    } catch (error) {
      console.error('Error unarchiving tree:', error);
      throw error;
    }
  },

  /**
   * Get all categories for a user
   */
  getCategoriesByUser: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/${userId}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  /**
   * Get all tags for a user
   */
  getTagsByUser: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/${userId}/tags`);
      if (!response.ok) throw new Error('Failed to fetch tags');
      return await response.json();
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }
};

export default treeAPI;
