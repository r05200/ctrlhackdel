import React, { useState } from 'react';
import treeAPI from '../services/treeAPI';
import './SaveTreeModal.css';

const SaveTreeModal = ({ isOpen, onClose, treeData, userId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const statusOptions = ['draft', 'in-progress', 'completed'];

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

      await treeAPI.createTree(userId, {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        tags,
        status,
        tree_data: treeData
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('General');
      setTagsInput('');
      setStatus('draft');

      onClose();
    } catch (err) {
      console.error('Error saving tree:', err);
      setError(err.message || 'Failed to save tree');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="save-tree-modal-overlay" onClick={onClose}>
      <div className="save-tree-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💾 Save Tree to Library</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="Enter tree title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Optional: Add a description for this tree"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                placeholder="e.g., Computer Science"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-select"
                disabled={loading}
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <input
              type="text"
              placeholder="Comma-separated tags (e.g., math, algorithms, learning)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="form-input"
              disabled={loading}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? '⏳ Saving...' : '💾 Save Tree'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveTreeModal;
