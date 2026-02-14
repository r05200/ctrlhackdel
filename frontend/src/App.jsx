import React, { useState, useRef, useCallback, useEffect } from 'react';
import BossFightModal from './components/BossFightModal';
import Sidebar from './components/SideBar';
import Header from './components/Header';
import SkillTreeView from './components/SkillTreeView';
import CreateTree from './components/CreateTree';
import OtherTrees from './components/OtherTrees';
import SplashScreen from './components/SplashScreen';
import StarryBackground from './components/StarryBackground';
import './App.css';

function App() {
  const [isHovered, setIsHovered] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [mainVisible, setMainVisible] = useState(false);
  const [currentView, setCurrentView] = useState('skill-tree'); // 'skill-tree', 'create-tree', 'other-trees'

  const handleSplashComplete = () => {
    setShowSplash(false);
    requestAnimationFrame(() => setMainVisible(true));
  };

  const handleNavigation = (viewId) => {
    setCurrentView(viewId);
  };

  const handleBackToSkillTree = () => {
    setCurrentView('skill-tree');
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className={`app-container flex h-screen w-screen bg-black text-gray-100 overflow-hidden relative ${mainVisible ? 'main-enter' : ''}`}>
      <StarryBackground />

      <div className="sidebar">
        <Sidebar isHovered={isHovered} setIsHovered={setIsHovered} onNavigate={handleNavigation} />
      </div>
      
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isHovered ? 'ml-56' : 'ml-16'}`}>
        <Header isHovered={isHovered} />
        <div className="flex-1 overflow-hidden">
          {/* Main View - Skill Tree */}
          {currentView === 'skill-tree' && <SkillTreeView />}

          {/* Create Tree View */}
          {currentView === 'create-tree' && (
            <CreateTree onCancel={handleBackToSkillTree} onCreateSuccess={() => setCurrentView('other-trees')} />
          )}

          {/* Other Trees View */}
          {currentView === 'other-trees' && (
            <OtherTrees onCancel={handleBackToSkillTree} onSelectTree={() => handleBackToSkillTree()} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
