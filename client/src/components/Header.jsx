import React from 'react';
import { Music, Radio, Sliders, Tv, Settings, Heart, Sparkles, Volume2 } from 'lucide-react';

export default function Header({ 
  currentMode, 
  setMode, 
  settings, 
  spotifyStatus, 
  onOpenSettings,
  activePreview
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Couple Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setMode('guest')}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-200 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif-wedding text-xl sm:text-2xl font-bold tracking-wide text-amber-100">
                  {settings.coupleNames || "Sarah & David"}
                </span>
                <span className="hidden sm:inline-block text-xs uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Wedding DJ
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light hidden sm:block">
                {settings.weddingDate || "Wedding Celebration"} • Real-Time Music Requests
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setMode('guest')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentMode === 'guest'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Guest View</span>
            </button>

            <button
              onClick={() => setMode('dj')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentMode === 'dj'
                  ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>DJ Cockpit</span>
            </button>

            <button
              onClick={() => setMode('tv')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentMode === 'tv'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span className="hidden sm:inline">Projector Screen</span>
              <span className="sm:hidden">TV</span>
            </button>
          </div>

          {/* Spotify Status & Settings */}
          <div className="flex items-center space-x-2">
            {activePreview && (
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-pulse">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Previewing clip</span>
              </div>
            )}

            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
              title="Spotify & Wedding Settings"
            >
              <div className={`w-2 h-2 rounded-full ${spotifyStatus?.isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-purple-400'}`} />
              <span className="hidden md:inline">
                {spotifyStatus?.isConnected ? 'Spotify Live' : 'Demo Mode'}
              </span>
              <Settings className="w-4 h-4 text-slate-400" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
