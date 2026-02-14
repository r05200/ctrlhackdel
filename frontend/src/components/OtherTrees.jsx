import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const OtherTrees = ({ onCancel, onSelectTree }) => {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    console.log('[OtherTrees] Component mounted, loading trees...');
    loadTrees();
  }, []);

  const loadTrees = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[OtherTrees] Fetching trees from API...');
      const response = await apiService.getTrees();
      console.log('[OtherTrees] API response:', response);
      if (response.success) {
        const treesData = response.trees || [];
        console.log('[OtherTrees] Setting trees data:', treesData);
        setTrees(treesData);
      } else {
        setError('Failed to fetch trees: response not successful');
      }
    } catch (err) {
      console.error('Error loading trees:', err);
      setError(err.message || 'Failed to load trees');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrees = trees.filter((tree) => {
    const matchesSearch =
      tree.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tree.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || tree.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Log on every render - must be after filteredTrees is defined
  console.log('[OtherTrees] Render - loading:', loading, 'trees:', trees.length, 'filtered:', filteredTrees.length, 'error:', error);

  const handleDeleteTree = async (treeId) => {
    if (window.confirm('Are you sure you want to delete this tree?')) {
      try {
        await apiService.deleteTree(treeId);
        setTrees(trees.filter((t) => t.id !== treeId));
        alert('Tree deleted successfully');
      } catch (err) {
        alert('Failed to delete tree: ' + err.message);
      }
    }
  };

  const handleSelectTree = (tree) => {
    if (onSelectTree) {
      onSelectTree(tree);
    }
  };

  return (
    <div className="w-full h-full bg-black flex flex-col p-6 relative overflow-hidden">
      {/* Debug info */}
      <div className="absolute top-2 right-2 z-50 text-xs text-white bg-red-900 p-2 rounded pointer-events-none">
        <div>Loading: {loading.toString()}</div>
        <div>Trees: {trees.length}</div>
        <div>Error: {error || 'None'}</div>
      </div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onCancel}
          className="mb-4 text-gray-400 hover:text-gray-200 text-sm flex items-center gap-2 transition-colors"
        >
          ← Back to Skill Tree
        </button>
        <h1 className="text-4xl font-bold text-white mb-2">📚 Your Skill Trees</h1>
        <p className="text-gray-400">Manage and explore your custom learning paths</p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search trees by name or topic..."
          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
        >
          <option value="all">All Status</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your trees...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-200 mb-4">
          {error}
          <button
            onClick={loadTrees}
            className="ml-4 underline hover:no-underline text-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTrees.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-lg mb-4">
              {trees.length === 0 ? 'No trees yet. Create one to get started!' : 'No trees match your search'}
            </p>
            {trees.length === 0 && (
              <button
                onClick={onCancel}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
              >
                Create First Tree
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trees Grid */}
      {!loading && filteredTrees.length > 0 && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto w-full">
          {filteredTrees.map((tree) => (
            <div
              key={tree.id}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-all cursor-pointer group"
              onClick={() => handleSelectTree(tree)}
            >
              {/* Tree Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">
                    {tree.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{tree.topic}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                    tree.status === 'completed'
                      ? 'bg-green-900 text-green-200'
                      : tree.status === 'in-progress'
                      ? 'bg-blue-900 text-blue-200'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  {tree.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{tree.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all"
                    style={{ width: `${tree.progress}%` }}
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 space-y-1 mb-4">
                <p>📊 {tree.nodeCount || 0} skills</p>
                <p>📅 Created {tree.createdAt || 'recently'}</p>
                <p>🎯 Difficulty: {tree.difficulty || 'medium'}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTree(tree);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-all"
                >
                  Open
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTree(tree.id);
                  }}
                  className="px-3 py-2 bg-red-900 hover:bg-red-800 text-red-200 text-xs font-semibold rounded transition-all"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && trees.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{trees.length}</p>
            <p className="text-gray-400 text-xs uppercase">Total Trees</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">
              {trees.filter((t) => t.status === 'completed').length}
            </p>
            <p className="text-gray-400 text-xs uppercase">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              {trees.filter((t) => t.status === 'in-progress').length}
            </p>
            <p className="text-gray-400 text-xs uppercase">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {Math.round(trees.reduce((sum, t) => sum + (t.progress || 0), 0) / trees.length)}%
            </p>
            <p className="text-gray-400 text-xs uppercase">Avg Progress</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherTrees;
