import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/SideBar';
import Header from './components/Header';
import TextBox from './components/TextBox';
import Greeting from './components/Greeting';
import SplashScreen from './components/SplashScreen';
import StarryBackground from './components/StarryBackground';
import TelescopeView from './components/TelescopeView';
import ConstellationView from './components/ConstellationView';

const MAIN_UI_FADE_MS = 900;

const PAGE_CONTENT = {
  past: {
    title: 'Past Constellations',
    subtitle: 'Simple outline view',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Simple outline view',
  },
  profile: {
    title: 'Profile',
    subtitle: 'Simple outline view',
  },
};

function SimpleOutlinePage({ title, subtitle }) {
  return (
    <div className="simple-page-outline">
      <div className="simple-page-outline-inner">
        <h2 className="simple-page-title">{title}</h2>
        <p className="simple-page-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}

function App() {

  const [isHovered, setIsHovered] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [mainVisible, setMainVisible] = useState(false);
  const [telescopeMode, setTelescopeMode] = useState(false);
  const [constellationMode, setConstellationMode] = useState(false);
  const [constellationReady, setConstellationReady] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [constellationData, setConstellationData] = useState(null);
  const [constellationTopic, setConstellationTopic] = useState('');
  const [activePage, setActivePage] = useState('create');

  const [splashDone, setSplashDone] = useState(false);

  const handleSplashComplete = () => {
    setSplashDone(true);
    setShowSplash(false);
    setMainVisible(true);
  };

  const handleTextSubmit = (query) => {
    if (fadingOut || telescopeMode || activePage !== 'create') return;

    setSearchQuery(query);
    setFadingOut(true);

    // Wait for main UI fade-out to complete before starting search.
    setTimeout(() => {
      setTelescopeMode(true);
    }, MAIN_UI_FADE_MS);
  };

  const handleTelescopeComplete = (tree) => {
    setTelescopeMode(false);
    if (tree) {
      setConstellationData(tree);
      setConstellationMode(true);
      setConstellationReady(false);
      setActivePage('create');
      setConstellationTopic(searchQuery || '');
      // Fade in UI after the zoom transition completes
      setTimeout(() => {
        setConstellationReady(true);
      }, 600);
      return;
    }
    setConstellationData(null);
    setConstellationMode(false);
    setConstellationReady(false);
    setFadingOut(false);
  };

  const handleMenuClick = (pageId) => {
    setActivePage(pageId);
    setFadingOut(false);
    setTelescopeMode(false);
    if (pageId !== 'create') {
      setConstellationMode(false);
      setConstellationReady(false);
    }
  };

  const showConstellationView = constellationMode && constellationData && activePage === 'create';
  const showMainUI = !showConstellationView;

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-black text-gray-100">
      {/* Always-mounted StarryBackground — eliminates black flash between views */}
      <StarryBackground
        hideMeteors={showSplash}
        enableGeminiStars={!showSplash && !showConstellationView}
        panUpTransition={fadingOut && !telescopeMode}
      />

      {/* Splash screen overlays on top */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Constellation view */}
      {showConstellationView && (
        <>
          <div className={`constellation-sidebar-rail ${constellationReady ? 'constellation-ui-visible' : 'constellation-ui-hidden'}`}>
            <Sidebar
              isHovered={isHovered}
              setIsHovered={setIsHovered}
              onMenuClick={handleMenuClick}
              activePage={activePage}
            />
            <div className={`constellation-rail-panels ${isHovered ? 'expanded' : 'collapsed'}`}>
              <div className="constellation-rail-learning">
                <div className="constellation-rail-learning-label">Learning Path:</div>
                <div className="constellation-rail-learning-topic">
                  {(constellationTopic || searchQuery || 'Knowledge').toUpperCase()}
                </div>
              </div>
              <div className="constellation-rail-legend">
                <div className="constellation-rail-legend-row">
                  <span className="constellation-legend-dot mastered" />
                  <span>Mastered</span>
                </div>
                <div className="constellation-rail-legend-row">
                  <span className="constellation-legend-dot available" />
                  <span>Available</span>
                </div>
                <div className="constellation-rail-legend-row">
                  <span className="constellation-legend-dot locked" />
                  <span>Locked</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`constellation-content-offset ${isHovered ? 'wide' : 'narrow'}`}>
            <ConstellationView
              graphData={constellationData}
              query={searchQuery}
              hideSideHud={true}
              onTopicResolved={setConstellationTopic}
            />
          </div>
        </>
      )}

      {/* Main UI (create/pages) */}
      {showMainUI && !showSplash && (
        <div className={`app-container flex h-screen w-screen text-gray-100 overflow-hidden relative ${mainVisible ? 'main-enter' : ''}`}>
          {/* Telescope overlay */}
          {telescopeMode && <TelescopeView query={searchQuery} onComplete={handleTelescopeComplete} />}

          <div className={`main-ui-layer ${fadingOut ? 'main-ui-shift-up' : ''}`}>
            <div className="sidebar">
              <Sidebar
                isHovered={isHovered}
                setIsHovered={setIsHovered}
                onMenuClick={handleMenuClick}
                activePage={activePage}
              />
            </div>

            <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isHovered ? 'ml-56' : 'ml-16'}`}>
              <div>
                <Header isHovered={isHovered} />
              </div>
              <div className="flex-1 p-4 flex flex-col justify-center items-center">
                {activePage === 'create' ? (
                  <>
                    <Greeting />
                    <div className="w-[55vw]">
                      <TextBox onSubmit={handleTextSubmit} />
                    </div>
                  </>
                ) : (
                  <SimpleOutlinePage
                    title={PAGE_CONTENT[activePage]?.title || 'Page'}
                    subtitle={PAGE_CONTENT[activePage]?.subtitle || 'Simple outline view'}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
