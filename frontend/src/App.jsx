import React, { useState, useRef, useCallback, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import BossFightModal from './components/BossFightModal';
import { knowledgeGraphData, getNodeColor, getLinkColor } from './data/knowledgeGraph';
import './App.css';
import Sidebar from './components/SideBar';
import Header from './components/Header';
import TextBox from './components/TextBox';
import AddMedia from './components/AddMedia';
import Greeting from './components/Greeting';
import SplashScreen from './components/SplashScreen';
import StarryBackground from './components/StarryBackground';
import ConstellationView from './components/ConstellationView';
import LibraryView from './components/LibraryView';

const API_URL = 'http://localhost:5000';

function App() {
  
  const [isHovered, setIsHovered] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [mainVisible, setMainVisible] = useState(false);
  const [showConstellation, setShowConstellation] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [userId] = useState('user-' + Math.random().toString(36).substr(2, 9));

  const handleSplashComplete = () => {
    setShowSplash(false);
    requestAnimationFrame(() => setMainVisible(true));
  };

  const handlePromptSubmit = (prompt) => {
    setUserPrompt(prompt);
    setShowConstellation(true);
  };

  const handleBackToPrompt = () => {
    setShowConstellation(false);
  };

  const handleMenuClick = (menuLabel) => {
    switch (menuLabel) {
      case 'Library':
        setShowLibrary(true);
        break;
      case 'Create Tree':
        setShowConstellation(false);
        setShowLibrary(false);
        break;
      case 'Settings':
        // TODO: Implement settings
        break;
      default:
        break;
    }
  };

  const handleBackFromLibrary = () => {
    setShowLibrary(false);
  };

  const handleOpenTreeFromLibrary = (tree) => {
    // TODO: Load tree into constellation view
    console.log('Opening tree:', tree);
    setShowLibrary(false);
    setShowConstellation(true);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete}/>;
  }

  if (showLibrary) {
    return (
      <div className={`app-container library-wrapper flex h-screen w-screen bg-black text-gray-100 overflow-hidden relative ${mainVisible ? 'main-enter' : ''}`}>
        <StarryBackground />
        <div className="sidebar">
          <Sidebar isHovered={isHovered} setIsHovered={setIsHovered} onMenuClick={handleMenuClick} />
        </div>
        <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isHovered ? 'ml-56' : 'ml-16'}`}>
          <LibraryView userId={userId} onBack={handleBackFromLibrary} onOpenTree={handleOpenTreeFromLibrary} />
        </div>
      </div>
    );
  }

  if (showConstellation) {
    return <ConstellationView onBack={handleBackToPrompt} userPrompt={userPrompt} />;
  }

  return (
    <div className={`app-container flex h-screen w-screen bg-black text-gray-100 overflow-hidden relative ${mainVisible ? 'main-enter' : ''}`}>
      <StarryBackground />
      
      <div className="sidebar">
        <Sidebar isHovered={isHovered} setIsHovered={setIsHovered} onMenuClick={handleMenuClick} />
      </div>
      
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isHovered ? 'ml-56' : 'ml-16'}`}>
        <Header isHovered={isHovered}/>
        <div className="flex-1 p-4 flex flex-col justify-center items-center relative z-20 pointer-events-auto">
          <Greeting />
          <div className="w-[55vw] z-20 pointer-events-auto">
            <TextBox onSubmit={handlePromptSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
