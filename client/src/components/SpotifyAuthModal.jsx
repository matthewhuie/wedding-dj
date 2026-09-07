import React, { useState } from 'react';
import { X, ExternalLink, Key, CheckCircle, Radio, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';

export default function SpotifyAuthModal({ isOpen, onClose, spotifyStatus = {}, onConfigUpdated }) {
  const [activeTab, setActiveTab] = useState(spotifyStatus?.hasCredentials ? 'spotify' : 'demo');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('http://localhost:4000/api/spotify/callback');
  const [statusMsg, setStatusMsg] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveSpotifyCreds = async (e) => {
    e.preventDefault();
    if (!clientId.trim()) {
      setStatusMsg('Please enter your Spotify Client ID');
      return;
    }

    setSaving(true);
    setStatusMsg('');

    try {
      await api.updateSpotifyConfig({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        redirectUri: redirectUri.trim(),
        isDemoMode: false
      });

      setStatusMsg('Credentials saved! Redirecting to Spotify login...');
      
      const { url } = await api.getSpotifyLoginUrl();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setStatusMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToDemo = async () => {
    setSaving(true);
    try {
      await api.updateSpotifyConfig({ isDemoMode: true });
      if (onConfigUpdated) onConfigUpdated();
      onClose();
    } catch (err) {
      setStatusMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Music Source & Spotify Setup</h3>
            <p className="text-xs text-slate-400">Choose between Spotify and Interactive Demo Mode</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('demo')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'demo'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Demo Mode</span>
          </button>
          
          <button
            onClick={() => setActiveTab('spotify')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'spotify'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Connect Spotify</span>
          </button>
        </div>

        {/* TAB 1: DEMO MODE */}
        {activeTab === 'demo' && (
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <h4 className="font-semibold text-white mb-1 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Zero-Configuration Ready</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Demo mode includes a pre-curated catalog of high-energy wedding classics, slow dances, and dancefloor anthems. Guests can search, request with dedications, preview audio clips, and upvote in real time.
              </p>
            </div>

            <p className="text-xs text-slate-400">
              Ideal for testing out the guest experience, rehearsing your wedding setup, or using without a Spotify Developer account.
            </p>

            <button
              onClick={handleSwitchToDemo}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg"
            >
              Use Interactive Demo Mode
            </button>
          </div>
        )}

        {/* TAB 2: LIVE SPOTIFY MODE */}
        {activeTab === 'spotify' && (
          <div>
            {spotifyStatus?.isConnected ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Connected to Spotify Account!</span>
                </div>
                <button 
                  onClick={handleSwitchToDemo} 
                  className="text-xs underline text-slate-400 hover:text-white"
                >
                  Disconnect
                </button>
              </div>
            ) : null}

            <form onSubmit={handleSaveSpotifyCreds} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Spotify Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Paste Spotify Client ID"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Spotify Client Secret
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Paste Spotify Client Secret"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Redirect URI
                </label>
                <input
                  type="text"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400"
                />
              </div>

              {statusMsg && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {statusMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
              >
                {saving ? 'Connecting...' : 'Authorize with Spotify 🚀'}
              </button>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">How to get your free Spotify keys:</p>
                <p>1. Open <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center">Spotify Developer Dashboard <ExternalLink className="w-2.5 h-2.5 ml-0.5" /></a></p>
                <p>2. Create an App named <strong>"Wedding DJ"</strong></p>
                <p>3. In App Settings, add <code className="bg-slate-800 px-1 rounded text-amber-300">http://localhost:4000/api/spotify/callback</code> as a Redirect URI</p>
                <p>4. Paste your Client ID and Secret above!</p>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
