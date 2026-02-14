import React, { useState } from 'react';
import apiService from '../services/api';

const CreateTree = ({ onCancel, onCreateSuccess }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [treeName, setTreeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    
    if (!treeName.trim()) {
      setError('Please enter a name for your tree');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call backend to generate tree
      const response = await apiService.generateTree(topic, difficulty, treeName);

      if (response.success) {
        alert(`✨ Tree "${treeName}" created successfully!`);
        if (onCreateSuccess) {
          onCreateSuccess(response.tree);
        }
        onCancel(); // Go back to skill tree view
      }
    } catch (err) {
      console.error('Error creating tree:', err);
      setError(err.message || 'Failed to create tree. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Debug info */}
      <div className="absolute top-4 right-4 z-50 text-xs text-white bg-purple-900 p-3 rounded pointer-events-none">
        <div>CreateTree Loaded</div>
        <div>Loading: {loading.toString()}</div>
        <div>Error: {error ? 'Yes' : 'No'}</div>
      </div>
      <div className="w-full max-w-2xl overflow-y-auto max-h-full pr-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onCancel}
            className="mb-4 text-gray-400 hover:text-gray-200 text-sm flex items-center gap-2 transition-colors"
          >
            ← Back to Skill Tree
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">✨ Create a New Skill Tree</h1>
          <p className="text-gray-400">Design your own custom learning path</p>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="space-y-6">
          {/* Tree Name */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">Tree Name</label>
            <input
              type="text"
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              placeholder="e.g., 'Web Development', 'Data Science'"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              disabled={loading}
            />
          </div>

          {/* Topic */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">Topic / Subject</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe the topic you want to learn. Be specific! E.g., 'I want to learn blockchain development, starting from cryptography basics'"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none h-32"
              disabled={loading}
            />
            <p className="text-gray-500 text-sm mt-1">
              {topic.length}/500 characters
            </p>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">Difficulty Level</label>
            <div className="flex gap-3">
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  disabled={loading}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all capitalize ${
                    difficulty === level
                      ? 'bg-blue-600 text-white border border-blue-500'
                      : 'bg-gray-900 text-gray-300 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <p className="text-gray-300 text-sm">
              <span className="font-semibold text-blue-400">💡 Tip:</span> The AI will analyze your topic and create a structured learning path with interconnected skills, prerequisites, and learning objectives.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-800 text-gray-200 rounded-lg font-semibold hover:bg-gray-700 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>✨ Create Tree</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTree;
