import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header.jsx';
import GuestView from './components/GuestView.jsx';
import DJDashboard from './components/DJDashboard.jsx';
import ProjectorView from './components/ProjectorView.jsx';
import SpotifyAuthModal from './components/SpotifyAuthModal.jsx';
import { socket, api } from './services/api.js';

export default function App() {
  // Detect URL parameter ?mode=dj or ?mode=tv
  const [mode, setMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    if (m === 'dj' || m === 'tv') return m;
    return 'guest';
  });

  const [requests, setRequests] = useState([]);
  const [settings, setSettings] = useState({
    coupleNames: 'Sarah & David',
    weddingDate: 'September 12, 2026',
    customMessage: 'Welcome to our wedding! Pick your favorite songs to keep the celebration dancing all night long 🥂✨',
    autoApproveEnabled: false,
    autoApproveThreshold: 3,
    allowExplicit: false
  });
  const [playback, setPlayback] = useState(null);
  const [vibes, setVibes] = useState([]);
  const [spotifyStatus, setSpotifyStatus] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Audio preview player
  const [activePreview, setActivePreview] = useState(null);
  const audioRef = useRef(null);

  // Sync mode with URL
  const changeMode = (newMode) => {
    setMode(newMode);
    const url = new URL(window.location);
    if (newMode === 'guest') {
      url.searchParams.delete('mode');
    } else {
      url.searchParams.set('mode', newMode);
    }
    window.history.pushState({}, '', url);
  };

  const togglePreview = (url) => {
    if (!url) return;

    if (activePreview === url) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActivePreview(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch(() => {});
      audio.onended = () => setActivePreview(null);
      audioRef.current = audio;
      setActivePreview(url);
    }
  };

  // Socket.IO event listeners
  useEffect(() => {
    // Initial fetch
    api.getState().then(data => {
      if (data.requests) setRequests(data.requests);
      if (data.settings) setSettings(data.settings);
      if (data.vibes) setVibes(data.vibes);
    }).catch(console.warn);

    api.getStatus().then(data => {
      if (data.spotify) setSpotifyStatus(data.spotify);
    }).catch(console.warn);

    socket.on('initial_state', (data) => {
      if (data.requests) setRequests(data.requests);
      if (data.settings) setSettings(data.settings);
      if (data.vibes) setVibes(data.vibes);
      if (data.spotify) setSpotifyStatus(data.spotify);
    });

    socket.on('request_added', ({ request }) => {
      setRequests(prev => {
        if (prev.some(r => r.id === request.id)) return prev;
        return [request, ...prev];
      });
    });

    socket.on('request_updated', (updated) => {
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
    });

    socket.on('request_deleted', ({ id }) => {
      setRequests(prev => prev.filter(r => r.id !== id));
    });

    socket.on('playback_update', (newPlayback) => {
      setPlayback(newPlayback);
    });

    socket.on('settings_updated', (newSettings) => {
      setSettings(newSettings);
    });

    socket.on('spotify_status_updated', (status) => {
      setSpotifyStatus(status);
    });

    return () => {
      socket.off('initial_state');
      socket.off('request_added');
      socket.off('request_updated');
      socket.off('request_deleted');
      socket.off('playback_update');
      socket.off('settings_updated');
      socket.off('spotify_status_updated');
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Header bar (hidden on projector view for clean fullscreen aesthetic) */}
      {mode !== 'tv' && (
        <Header 
          currentMode={mode}
          setMode={changeMode}
          settings={settings}
          spotifyStatus={spotifyStatus}
          onOpenSettings={() => setIsAuthModalOpen(true)}
          activePreview={activePreview}
        />
      )}

      {/* Main View Mode Content */}
      <main className="flex-1">
        {mode === 'guest' && (
          <GuestView 
            requests={requests}
            settings={settings}
            playback={playback}
            vibes={vibes}
            activePreview={activePreview}
            togglePreview={togglePreview}
          />
        )}

        {mode === 'dj' && (
          <DJDashboard 
            requests={requests}
            settings={settings}
            playback={playback}
            spotifyStatus={spotifyStatus}
            onOpenSpotifyModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {mode === 'tv' && (
          <div>
            <div className="fixed top-4 right-4 z-50">
              <button
                onClick={() => changeMode('guest')}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 hover:text-white backdrop-blur-md"
              >
                Exit Projector Mode
              </button>
            </div>
            <ProjectorView 
              requests={requests}
              settings={settings}
              playback={playback}
            />
          </div>
        )}
      </main>

      {/* Spotify & Music Setup Modal */}
      <SpotifyAuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        spotifyStatus={spotifyStatus}
        onConfigUpdated={() => {
          api.getStatus().then(data => {
            if (data.spotify) setSpotifyStatus(data.spotify);
          });
        }}
      />

    </div>
  );
}
