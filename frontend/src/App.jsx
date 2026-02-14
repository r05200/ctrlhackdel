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
<<<<<<< HEAD
import ConstellationView from './components/ConstellationView';
=======
import TelescopeView from './components/TelescopeView';
>>>>>>> a0f182024c81e06bb9447a3a8b4fa4875d94b9c7

const API_URL = 'http://localhost:5000';

function App() {
  
  const [isHovered, setIsHovered] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [mainVisible, setMainVisible] = useState(false);
<<<<<<< HEAD
  const [showConstellation, setShowConstellation] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
=======
  const [telescopeMode, setTelescopeMode] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
>>>>>>> a0f182024c81e06bb9447a3a8b4fa4875d94b9c7

  const handleSplashComplete = () => {
    setShowSplash(false);
    requestAnimationFrame(() => setMainVisible(true));
  };

<<<<<<< HEAD
  const handlePromptSubmit = (prompt) => {
    setUserPrompt(prompt);
    setShowConstellation(true);
  };

  const handleBackToPrompt = () => {
    setShowConstellation(false);
=======
  const handleTextSubmit = (query) => {
    setSearchQuery(query);
    setFadingOut(true);
    // After the UI fades out, switch to telescope view
    setTimeout(() => {
      setTelescopeMode(true);
      setFadingOut(false);
    }, 1200);
>>>>>>> a0f182024c81e06bb9447a3a8b4fa4875d94b9c7
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete}/>;
  }

  if (showConstellation) {
    return <ConstellationView onBack={handleBackToPrompt} userPrompt={userPrompt} />;
  }

  return (
    <div className={`app-container flex h-screen w-screen bg-black text-gray-100 overflow-hidden relative ${mainVisible ? 'main-enter' : ''}`}>
      <StarryBackground hideMeteors={telescopeMode} />

      {/* Telescope overlay */}
      {telescopeMode && <TelescopeView query={searchQuery} />}
      
      <div className={`sidebar ${fadingOut ? 'fade-out-up' : ''}`}>
        <Sidebar isHovered={isHovered} setIsHovered={setIsHovered} />
      </div>
      
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isHovered ? 'ml-56' : 'ml-16'}`}>
        <Header isHovered={isHovered}/>
<<<<<<< HEAD
        <div className="flex-1 p-4 flex flex-col justify-center items-center">
          <Greeting />
          <div className="w-[55vw]">
            <TextBox onSubmit={handlePromptSubmit} />
          </div>
=======
        <div className={`flex-1 p-4 flex flex-col justify-center items-center ${fadingOut ? 'fade-out-up' : ''}`}>
          {!telescopeMode && (
            <>
              <Greeting />
              <div className="w-[55vw]">
                <TextBox onSubmit={handleTextSubmit} />
              </div>
            </>
          )}
>>>>>>> a0f182024c81e06bb9447a3a8b4fa4875d94b9c7
        </div>
      </div>
    </div>
  );
}

export default App;
