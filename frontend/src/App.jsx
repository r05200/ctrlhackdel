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

const API_URL = 'http://localhost:5000';

function App() {
  
  const [isHovered, setIsHovered] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [mainVisible, setMainVisible] = useState(false);

  const handleSplashComplete = () => {
    setShowSplash(false);
    // Small delay so the main content mounts before animating in
    requestAnimationFrame(() => setMainVisible(true));
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className={`app-container flex h-screen w-screen bg-black text-gray-100 overflow-hidden relative ${mainVisible ? 'main-enter' : ''}`}>
      <StarryBackground />
      
      <div className="sidebar">
        <Sidebar isHovered={isHovered} setIsHovered={setIsHovered} />
      </div>
      
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isHovered ? 'ml-56' : 'ml-16'}`}>
        <Header isHovered={isHovered}/>
        <div className="flex-1 p-4 flex flex-col justify-center items-center">
          <Greeting />
          <div className="w-[55vw]">
            <TextBox />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
