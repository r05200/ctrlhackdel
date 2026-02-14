import React, { useState, useEffect } from 'react';
import treeAPI from '../services/treeAPI';
import './LibraryView.css';

const LibraryView = ({ userId, onBack, onOpenTree }) => {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Metadata
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  
  // UI states
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  const statusOptions = ['draft', 'in-progress', 'completed', 'archived'];
  const statusColors = {
    draft: '#718096',
    'in-progress': '#4299e1',
    completed: '#48bb78',
    archived: '#a0aec0'
  };
  const statusEmojis = {
    draft: '📝',
    'in-progress': '⚡',
    completed: '✓',
    archived: '📦'
  };

  // Fetch trees and metadata
  useEffect(() => {
    fetchTreesAndMetadata();
  }, [userId]);

  const fetchTreesAndMetadata = async () => {
    try {
      setLoading(true);
      const [treesRes, categoriesRes, tagsRes] = await Promise.all([
        treeAPI.getTreesByUser(userId),
        treeAPI.getCategoriesByUser(userId),
        treeAPI.getTagsByUser(userId)
      ]);

      setTrees(treesRes.trees || []);
      setCategories(categoriesRes.categories || []);
      setTags(tagsRes.tags || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching trees:', err);
      setError(err.message);
      setTrees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTree = (tree) => {
    onOpenTree(tree);
  };

  const handleDeleteTree = async (treeId) => {
    if (!window.confirm('Are you sure you want to delete this tree?')) return;

    try {
      await treeAPI.deleteTree(treeId, userId);
      setTrees(trees.filter(t => t._id !== treeId));
    } catch (err) {
      console.error('Error deleting tree:', err);
      alert('Failed to delete tree');
    }
  };

  const handleToggleArchive = async (tree) => {
    try {
      const updated = tree.status === 'archived' 
        ? await treeAPI.unarchiveTree(tree._id, userId)
        : await treeAPI.archiveTree(tree._id, userId);

      setTrees(trees.map(t => t._id === tree._id ? updated.tree : t));
    } catch (err) {
      console.error('Error archiving tree:', err);
      alert(`Failed to ${tree.status === 'archived' ? 'unarchive' : 'archive'} tree`);
    }
  };

  const handleEditStart = (tree) => {
    setEditingId(tree._id);
    setEditTitle(tree.title);
    setEditCategory(tree.category);
    setEditTags(tree.tags.join(', '));
    setEditStatus(tree.status);
  };

  const handleEditSave = async (treeId) => {
    try {
      const updatedTags = editTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

      const updated = await treeAPI.updateTree(treeId, userId, {
        title: editTitle,
        category: editCategory,
        tags: updatedTags,
        status: editStatus
      });

      setTrees(trees.map(t => t._id === treeId ? updated.tree : t));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating tree:', err);
      alert('Failed to update tree');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const filteredTrees = trees.filter(tree => {
    let matches = true;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matches = matches && (
        tree.title.toLowerCase().includes(query) ||
        tree.description.toLowerCase().includes(query)
      );
    }

    if (selectedStatus) {
      matches = matches && tree.status === selectedStatus;
    }

    if (selectedCategory) {
      matches = matches && tree.category === selectedCategory;
    }

    if (selectedTags.length > 0) {
      matches = matches && selectedTags.some(tag => tree.tags.includes(tag));
    }

    return matches;
  });

  if (loading) {
    return (
      <div className="library-view">
        <div className="library-header">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <h1 className="library-title">📚 Library</h1>
          <div className="header-stats">
            <span>Loading...</span>
          </div>
        </div>

        <div className="library-search-skeleton"></div>
        <div className="library-filters-skeleton"></div>

        <div className="library-trees">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="tree-card-skeleton">
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-subtitle"></div>
              <div className="skeleton-line skeleton-text" style={{ width: '70%' }}></div>
              <div className="skeleton-actions">
                <div className="skeleton-button"></div>
                <div className="skeleton-button"></div>
                <div className="skeleton-button"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="library-view">
      {/* Header */}
      <div className="library-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1 className="library-title">📚 Library</h1>
        <div className="header-stats">
          <span>{filteredTrees.length} tree{filteredTrees.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Search Section */}
      <div className="library-search">
        <input
          type="text"
          placeholder="Search trees..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filters Section */}
      <div className="library-filters">
        <div className="filter-group">
          <label>Status:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${selectedStatus === null ? 'active' : ''}`}
              onClick={() => setSelectedStatus(null)}
            >
              All
            </button>
            {statusOptions.map(status => (
              <button
                key={status}
                className={`filter-btn ${selectedStatus === status ? 'active' : ''}`}
                onClick={() => setSelectedStatus(status)}
                style={{
                  backgroundColor: selectedStatus === status ? statusColors[status] : 'transparent'
                }}
              >
                {statusEmojis[status]} {status}
              </button>
            ))}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="filter-group">
            <label>Category:</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="filter-group">
            <label>Tags:</label>
            <div className="filter-buttons">
              {tags.map(tag => (
                <button
                  key={tag}
                  className={`tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTags(
                      selectedTags.includes(tag)
                        ? selectedTags.filter(t => t !== tag)
                        : [...selectedTags, tag]
                    );
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="library-error">
          Error: {error}
        </div>
      )}

      {/* Trees List */}
      <div className="library-trees">
        {filteredTrees.length === 0 ? (
          <div className="no-trees">
            <p>No trees found. Create a new tree to get started!</p>
          </div>
        ) : (
          filteredTrees.map(tree => (
            <div
              key={tree._id}
              className={`tree-card ${editingId === tree._id ? 'editing' : ''}`}
            >
              {editingId === tree._id ? (
                // Edit Mode
                <div className="tree-card-edit">
                  <div className="edit-field">
                    <label>Title:</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  <div className="edit-field">
                    <label>Category:</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  <div className="edit-field">
                    <label>Tags (comma-separated):</label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  <div className="edit-field">
                    <label>Status:</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="edit-select"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {statusEmojis[status]} {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="edit-actions">
                    <button
                      className="btn-save"
                      onClick={() => handleEditSave(tree._id)}
                    >
                      ✓ Save
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={handleEditCancel}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="tree-card-view">
                  <div className="tree-header">
                    <div className="tree-title-section">
                      <h3 className="tree-title">{tree.title}</h3>
                      <span
                        className="tree-status"
                        style={{ backgroundColor: statusColors[tree.status] }}
                      >
                        {statusEmojis[tree.status]} {tree.status}
                      </span>
                    </div>
                    <div className="tree-category">
                      📂 {tree.category}
                    </div>
                  </div>

                  {tree.description && (
                    <p className="tree-description">{tree.description}</p>
                  )}

                  {tree.tags && tree.tags.length > 0 && (
                    <div className="tree-tags">
                      {tree.tags.map(tag => (
                        <span key={tag} className="tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="tree-metadata">
                    <span className="metadata-item">
                      📅 Created: {new Date(tree.created_at).toLocaleDateString()}
                    </span>
                    <span className="metadata-item">
                      🕐 Last opened: {new Date(tree.last_opened).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="tree-actions">
                    <button
                      className="btn-action btn-open"
                      onClick={() => handleOpenTree(tree)}
                      title="Open tree"
                    >
                      🔍 Open
                    </button>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleEditStart(tree)}
                      title="Edit tree"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-action btn-archive"
                      onClick={() => handleToggleArchive(tree)}
                      title={tree.status === 'archived' ? 'Unarchive' : 'Archive'}
                    >
                      {tree.status === 'archived' ? '📂 Unarchive' : '📦 Archive'}
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDeleteTree(tree._id)}
                      title="Delete tree"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LibraryView;
