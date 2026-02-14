import React, { useState, useEffect } from 'react';
import SkillTreeVisualization from './SkillTreeVisualization';
import BossFightModal from './BossFightModal';
import apiService from '../services/api';

const SkillTreeView = () => {
  const [graphData, setGraphData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showBossFight, setShowBossFight] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsPanelCollapsed, setStatsPanelCollapsed] = useState(false);

  // Load graph data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both graph and progress data in parallel
      const [graphRes, progressRes] = await Promise.all([
        apiService.getGraph(),
        apiService.getProgress(),
      ]);

      if (graphRes.success && graphRes.data) {
        setGraphData(graphRes.data);
      }
      
      if (progressRes.success) {
        setProgress(progressRes);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node) => {
    // If node is null, deselect
    if (node === null) {
      setSelectedNode(null);
      setShowBossFight(false);
      return;
    }
    
    setSelectedNode(node);
    
    // Only allow interaction with active or mastered nodes
    if (node.status === 'active') {
      setShowBossFight(true);
    } else if (node.status === 'locked') {
      alert('This node is locked. Complete the prerequisites first!');
    }
  };

  const handleBossFightComplete = async (nodeId) => {
    try {
      // Call API to mark node as complete
      const response = await apiService.completeNode(nodeId);
      
      if (response.success) {
        // Update the graph with the new data
        setGraphData(response.updatedGraph);
        
        // Show success message
        alert(`🎉 ${response.message}\nUnlocked nodes: ${response.unlockedNodes.join(', ') || 'none new'}`);
        
        // Reload progress
        await loadData();
        setSelectedNode(null);
        setShowBossFight(false);
      }
    } catch (err) {
      console.error('Error completing node:', err);
      alert('Failed to complete node. Please try again.');
    }
  };

  const handleCloseBossFight = () => {
    setShowBossFight(false);
  };

  const handleResetProgress = async () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      try {
        await apiService.resetProgress();
        await loadData();
        setSelectedNode(null);
      } catch (err) {
        console.error('Error resetting progress:', err);
        alert('Failed to reset progress. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white">Loading skill tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading skill tree: {error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <p className="text-white">No skill tree data available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <SkillTreeVisualization
        graphData={graphData}
        onNodeClick={handleNodeClick}
        selectedNodeId={selectedNode?.id}
      />

      {/* Bottom-right stats panel - collapsible */}
      {progress && (
        <>
          {!statsPanelCollapsed ? (
            <div className="fixed bottom-6 right-6 z-[100] bg-gray-900 border border-gray-700 rounded shadow-lg pointer-events-auto w-56">
              <div className="p-4 text-sm text-gray-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-blue-400">Progress Stats</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Collapsing stats panel');
                      setStatsPanelCollapsed(true);
                    }}
                    className="text-gray-400 hover:text-gray-200 transition-colors text-lg cursor-pointer p-1 hover:bg-gray-800 rounded pointer-events-auto"
                    type="button"
                    title="Collapse panel"
                  >
                    ▼
                  </button>
                </div>
                <div className="space-y-2">
                  <p>Mastered: <span className="text-blue-400 font-semibold">{progress.stats.mastered}/{progress.stats.total}</span></p>
                  <p>Active: <span className="text-green-400 font-semibold">{progress.stats.active}</span></p>
                  <p>Locked: <span className="text-gray-400 font-semibold">{progress.stats.locked}</span></p>
                  <p>Completion: <span className="text-yellow-400 font-semibold">{progress.stats.percentage}%</span></p>
                  <p>Challenges: <span className="text-cyan-400 font-semibold">{progress.userProgress.completedChallenges}</span></p>
                </div>
                <button
                  onClick={handleResetProgress}
                  className="mt-4 w-full px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition cursor-pointer pointer-events-auto"
                >
                  Reset Progress
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Expanding stats panel');
                setStatsPanelCollapsed(false);
              }}
              className="fixed bottom-6 right-6 z-[100] w-12 h-12 bg-gray-900 border border-gray-700 rounded shadow-lg pointer-events-auto flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-gray-800 transition-all cursor-pointer text-2xl"
              type="button"
              title="Expand stats panel"
            >
              ▲
            </button>
          )}
        </>
      )}

      {/* Boss fight modal */}
      {showBossFight && selectedNode && (
        <BossFightModal
          node={selectedNode}
          onClose={handleCloseBossFight}
          onComplete={handleBossFightComplete}
        />
      )}
    </div>
  );
};

export default SkillTreeView;
