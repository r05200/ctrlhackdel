import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/SideBar';
import Header from './components/Header';
import TextBox from './components/TextBox';
import Greeting from './components/Greeting';
import SplashScreen from './components/SplashScreen';
import StarryBackground from './components/StarryBackground';
import TelescopeView from './components/TelescopeView';

const API_URL = 'http://localhost:5000';

function App() {
  
  const [isHovered, setIsHovered] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [mainVisible, setMainVisible] = useState(false);
  const [telescopeMode, setTelescopeMode] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [splashDone, setSplashDone] = useState(false);

  const handleSplashComplete = () => {
    setSplashDone(true);
    setShowSplash(false);
    requestAnimationFrame(() => setMainVisible(true));
  };

  const handleTextSubmit = (query) => {
    setSearchQuery(query);
    setFadingOut(true);
    // Wait for fade-out animation to complete (1200ms) + brief pause (500ms) before showing telescope
    setTimeout(() => {
      setTelescopeMode(true);
      setFadingOut(false);
    }, 1700);
  };

  if (showSplash) {
    return (
      <div className="h-screen w-screen overflow-hidden relative">
        <StarryBackground hideMeteors={true} splashDone={false} />
        <SplashScreen onComplete={handleSplashComplete} />
      </div>
    );
  }

  return (
    <div className={`app-container flex h-screen w-screen bg-black text-gray-100 overflow-hidden relative ${mainVisible ? 'main-enter' : ''}`}>
      <StarryBackground hideMeteors={telescopeMode} splashDone={true} />

      {/* Telescope overlay */}
      {telescopeMode && <TelescopeView query={searchQuery} />}
      
      <div className={`sidebar ${fadingOut ? 'fade-out-up' : ''}`}>
        <Sidebar isHovered={isHovered} setIsHovered={setIsHovered} />
      </div>
      
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isHovered ? 'ml-56' : 'ml-16'}`}>
        <div className={`${fadingOut ? 'fade-out-up' : ''}`}>
          <Header isHovered={isHovered}/>
        </div>
        <div className={`flex-1 p-4 flex flex-col justify-center items-center ${fadingOut ? 'fade-out-up' : ''}`}>
          {!telescopeMode && (
            <>
              <Greeting />
              <div className="w-[55vw]">
                <TextBox onSubmit={handleTextSubmit} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
