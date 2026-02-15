import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Sidebar from './components/SideBar';
import Header from './components/Header';
import TextBox from './components/TextBox';
import Greeting from './components/Greeting';
import SplashScreen from './components/SplashScreen';
import StarryBackground from './components/StarryBackground';
import TelescopeView from './components/TelescopeView';
import ConstellationView from './components/ConstellationView';
import PastConstellationsView from './components/PastConstellationsView';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import { createPastConstellation } from './services/api';

const MAIN_UI_FADE_MS = 900;
const PAST_OPEN_GLINT_MS = 700;
const PAST_OPEN_ZOOM_MS = 850;
const PAST_OPEN_DISSOLVE_MS = 550;
const APP_SETTINGS_KEY = 'ctrlhackdel_app_settings';
const DEFAULT_APP_SETTINGS = {
  disableStartingAnimation: false,
  disableBackgroundElements: false,
  userName: '',
  starColor: '#ffffff'
};

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

function parseGraphPayload(payload) {
  if (!payload) return null;
  if (payload.graph?.nodes && payload.graph?.links) return payload.graph;
  if (payload.nodes && payload.links) return payload;
  return null;
}

function buildSeededStars(seedKey, count = 18) {
  const seedString = String(seedKey || 'constellation');
  let seed = 0;
  for (let i = 0; i < seedString.length; i += 1) {
    seed = (seed * 31 + seedString.charCodeAt(i)) >>> 0;
  }
  const next = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967295;
  };

  return Array.from({ length: count }).map((_, idx) => ({
    id: `transition-star-${idx}`,
    x: 7 + next() * 86,
    y: 10 + next() * 80,
    size: 1.8 + next() * 3.1,
    delayMs: Math.round(next() * 640)
  }));
}

function getStoredAppSettings() {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_APP_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed
    };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

function sanitizeStarColor(value, fallback = '#ffffff') {
  const raw = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toLowerCase() : fallback;
}

function App() {
  const initialSettingsRef = useRef(getStoredAppSettings());
  const initialSettings = initialSettingsRef.current;

  const [isHovered, setIsHovered] = useState(false);
  const [showSplash, setShowSplash] = useState(!initialSettings.disableStartingAnimation);
  const [mainVisible, setMainVisible] = useState(initialSettings.disableStartingAnimation);
  const [telescopeMode, setTelescopeMode] = useState(false);
  const [constellationMode, setConstellationMode] = useState(false);
  const [constellationReady, setConstellationReady] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [constellationData, setConstellationData] = useState(null);
  const [constellationTopic, setConstellationTopic] = useState('');
  const [activePage, setActivePage] = useState('create');
  const [pastOpenTransition, setPastOpenTransition] = useState(null);
  const pastOpenTimersRef = useRef([]);
  const [appSettings, setAppSettings] = useState(initialSettings);

  const [splashDone, setSplashDone] = useState(false);

  const clearPastOpenTimers = () => {
    pastOpenTimersRef.current.forEach((id) => clearTimeout(id));
    pastOpenTimersRef.current = [];
  };

  useEffect(() => () => clearPastOpenTimers(), []);

  useEffect(() => {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings));
  }, [appSettings]);

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
      const graph = parseGraphPayload(tree);
      const topic = tree.topic || searchQuery || '';
      if (!graph) {
        setConstellationData(null);
        setConstellationMode(false);
        setConstellationReady(false);
        setFadingOut(false);
        return;
      }

      setConstellationData(graph);
      setConstellationMode(true);
      setConstellationReady(false);
      setActivePage('create');
      setConstellationTopic(topic);

      createPastConstellation({
        title: topic || 'Untitled Constellation',
        query: searchQuery || '',
        tags: [],
        graph
      }).catch((err) => {
        console.error('Failed to persist constellation:', err);
      });

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
    clearPastOpenTimers();
    setPastOpenTransition(null);
    setActivePage(pageId);
    setFadingOut(false);
    setTelescopeMode(false);
    if (pageId !== 'create') {
      setConstellationMode(false);
      setConstellationReady(false);
    }
  };

  const handleOpenPastConstellation = (item, transitionMeta = {}) => {
    if (!item?.graph?.nodes || !item?.graph?.links) return;
    clearPastOpenTimers();

    const shell = {
      phase: 'glisten',
      originRect: transitionMeta?.originRect || null,
      stars: transitionMeta?.previewStars || buildSeededStars(item.id)
    };
    setPastOpenTransition(shell);

    const toZoomMs = PAST_OPEN_GLINT_MS;
    const toDissolveMs = PAST_OPEN_GLINT_MS + PAST_OPEN_ZOOM_MS;
    const mountConstellationMs = toDissolveMs - 120;
    const endTransitionMs = toDissolveMs + PAST_OPEN_DISSOLVE_MS;

    pastOpenTimersRef.current.push(setTimeout(() => {
      setPastOpenTransition((prev) => (prev ? { ...prev, phase: 'zoom' } : prev));
    }, toZoomMs));

    pastOpenTimersRef.current.push(setTimeout(() => {
      setSearchQuery(item.query || '');
      setConstellationTopic(item.title || item.query || 'Knowledge');
      setConstellationData(item.graph);
      setConstellationMode(true);
      setConstellationReady(false);
      setActivePage('create');
      setFadingOut(false);
      setTelescopeMode(false);
    }, mountConstellationMs));

    pastOpenTimersRef.current.push(setTimeout(() => {
      setPastOpenTransition((prev) => (prev ? { ...prev, phase: 'dissolve' } : prev));
    }, toDissolveMs));

    pastOpenTimersRef.current.push(setTimeout(() => {
      setConstellationReady(true);
    }, toDissolveMs + 180));

    pastOpenTimersRef.current.push(setTimeout(() => {
      setPastOpenTransition(null);
      clearPastOpenTimers();
    }, endTransitionMs));
  };

  const handleSettingsChange = (patch) => {
    setAppSettings((prev) => {
      const next = { ...prev, ...patch };
      if (Object.prototype.hasOwnProperty.call(patch, 'userName')) {
        next.userName = String(patch.userName || '').slice(0, 25);
      }
      if (Object.prototype.hasOwnProperty.call(patch, 'starColor')) {
        next.starColor = sanitizeStarColor(patch.starColor, prev.starColor || DEFAULT_APP_SETTINGS.starColor);
      }
      if (patch.disableStartingAnimation) {
        setShowSplash(false);
        setMainVisible(true);
      }
      return next;
    });
  };

  const greetingName = String(appSettings.userName || '').trim() || 'Explorer';
  const starColor = sanitizeStarColor(appSettings.starColor, DEFAULT_APP_SETTINGS.starColor);

  const showConstellationView = constellationMode && constellationData && activePage === 'create';
  const showMainUI = !showConstellationView;

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-black text-gray-100">
      {/* Always-mounted StarryBackground — eliminates black flash between views */}
      {!appSettings.disableBackgroundElements && (
        <StarryBackground
          hideMeteors={showSplash}
          enableGeminiStars={!showSplash && !showConstellationView && !telescopeMode}
          panUpTransition={fadingOut || telescopeMode || showConstellationView}
          starColor={starColor}
        />
      )}

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
                    <Greeting name={greetingName} />
                    <div className="w-[55vw]">
                      <TextBox onSubmit={handleTextSubmit} />
                    </div>
                  </>
                ) : activePage === 'past' ? (
                  <PastConstellationsView onOpenConstellation={handleOpenPastConstellation} />
                ) : activePage === 'settings' ? (
                  <SettingsView settings={appSettings} onChange={handleSettingsChange} />
                ) : activePage === 'profile' ? (
                  <ProfileView />
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

      {pastOpenTransition && (
        <div
          className={`past-open-transition-overlay phase-${pastOpenTransition.phase}`}
          style={{
            '--past-origin-left': `${pastOpenTransition.originRect?.left ?? window.innerWidth * 0.2}px`,
            '--past-origin-top': `${pastOpenTransition.originRect?.top ?? window.innerHeight * 0.2}px`,
            '--past-origin-width': `${pastOpenTransition.originRect?.width ?? window.innerWidth * 0.6}px`,
            '--past-origin-height': `${pastOpenTransition.originRect?.height ?? window.innerHeight * 0.42}px`
          }}
        >
          <div className="past-open-transition-backdrop" />
          <div className="past-open-zoom-shell">
            <div className="past-open-star-layer">
              {pastOpenTransition.stars.map((star) => (
                <span
                  key={star.id}
                  className="past-open-star"
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    animationDelay: `${star.delayMs}ms`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
