import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  Check, 
  X, 
  Trash2, 
  Sparkles, 
  Disc, 
  QrCode, 
  ShieldAlert, 
  Settings2, 
  ListMusic, 
  Radio, 
  Heart, 
  ExternalLink,
  Speaker,
  Users,
  AlertTriangle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api.js';

export default function DJDashboard({ 
  requests = [], 
  settings = {}, 
  playback = {}, 
  spotifyStatus = {},
  onOpenSpotifyModal
}) {
  const [activeTab, setActiveTab] = useState('pending'); // pending, queued, played, blacklist, settings
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Settings form
  const [editSettings, setEditSettings] = useState({ ...settings });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Blacklist form
  const [banType, setBanType] = useState('song');
  const [banValue, setBanValue] = useState('');

  useEffect(() => {
    setEditSettings({ ...settings });
  }, [settings]);

  useEffect(() => {
    api.getDevices().then(res => {
      const devList = res.devices || [];
      setDevices(devList);
      if (devList.length > 0 && !selectedDevice) {
        const active = devList.find(d => d.is_active) || devList[0];
        setSelectedDevice(active.id);
      }
    }).catch(console.warn);
  }, []);

  const handlePlayPause = async () => {
    try {
      if (playback?.isPlaying) {
        await api.pause(selectedDevice);
      } else {
        await api.play(null, selectedDevice);
      }
    } catch (e) {
      alert('Playback control notice: ' + (e.message || 'Error controlling playback'));
    }
  };

  const handleNextTrack = async () => {
    try {
      await api.nextTrack(selectedDevice);
    } catch (e) {
      alert('Next track notice: ' + e.message);
    }
  };

  const handlePushToSpotify = async (req) => {
    try {
      await api.addToSpotifyQueue(req.track.id, selectedDevice, req.id);
    } catch (e) {
      alert('Could not push to Spotify: ' + e.message);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await api.updateRequestStatus(requestId, status, false, selectedDevice);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (confirm('Delete this request?')) {
      await api.deleteRequest(requestId);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    await api.updateSettings(editSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleAddBan = async (e) => {
    e.preventDefault();
    if (!banValue.trim()) return;
    await api.addBannedItem(banType, banValue.trim());
    setBanValue('');
  };

  const handleRemoveBan = async (id) => {
    await api.removeBannedItem(id);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending').sort((a, b) => b.upvotes - a.upvotes);
  const queuedRequests = requests.filter(r => r.status === 'queued').sort((a, b) => (b.queuedAt || 0) - (a.queuedAt || 0));
  const playedRequests = requests.filter(r => r.status === 'played').sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const guestPortalUrl = window.location.origin;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28">
      
      {/* Top DJ Deck: Spotify Playback & Master Controls */}
      <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-gradient-to-br from-rose-500/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Current Track Info */}
          <div className="flex items-center space-x-4 w-full lg:w-auto">
            <div className="relative flex-shrink-0">
              <img 
                src={playback?.currentTrack?.albumArt || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=160&h=160&fit=crop"} 
                alt="Current Playing" 
                className={`w-20 h-20 rounded-2xl object-cover shadow-xl ${playback?.isPlaying ? 'ring-2 ring-amber-400/80 ring-offset-2 ring-offset-slate-950' : ''}`}
              />
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
                <Disc className={`w-4 h-4 text-amber-300 ${playback?.isPlaying ? 'animate-spin-slow' : ''}`} />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {playback?.isPlaying ? 'Now Playing' : 'Playback Paused'}
                </span>
                {!spotifyStatus?.isConnected && (
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Demo Deck
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white truncate mt-1">
                {playback?.currentTrack?.name || 'No song playing'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 truncate">
                {playback?.currentTrack?.artist || 'Select a request to start playback'}
              </p>
            </div>
          </div>

          {/* Transport & Device Controls */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
            
            {/* Device Selector */}
            <div className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <Speaker className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                {devices.length === 0 ? (
                  <option value="">Default Speaker</option>
                ) : (
                  devices.map(d => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.name} {d.is_active ? '●' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className="p-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-lg shadow-amber-400/20 transition transform active:scale-95"
              title={playback?.isPlaying ? "Pause" : "Play"}
            >
              {playback?.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Next Track Button */}
            <button
              onClick={handleNextTrack}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition transform active:scale-95"
              title="Next Track"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Table QR Code Button */}
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition"
            >
              <QrCode className="w-4 h-4" />
              <span>Table QR Code</span>
            </button>

            {/* Spotify Settings Modal Button */}
            <button
              onClick={onOpenSpotifyModal}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              title="Spotify Account Setup"
            >
              <Settings2 className="w-5 h-5" />
            </button>

          </div>
        </div>
      </div>

      {/* Cockpit Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <span>Pending Review</span>
          <span className="px-2 py-0.5 rounded-full bg-black/30 text-xs">
            {pendingRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('queued')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'queued'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <span>Queued / Up Next</span>
          <span className="px-2 py-0.5 rounded-full bg-black/20 text-xs">
            {queuedRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('played')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'played'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <span>Played ({playedRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('blacklist')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'blacklist'
              ? 'bg-red-950/80 border border-red-800 text-red-300'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>Do-Not-Play List</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-slate-800 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Wedding Settings</span>
        </button>
      </div>

      {/* TAB CONTENT: PENDING REQUESTS */}
      {activeTab === 'pending' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Guest Requests (Sorted by Upvotes)
            </h3>
            {settings.autoApproveEnabled && (
              <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-approves at {settings.autoApproveThreshold}+ upvotes</span>
              </span>
            )}
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-slate-900/40 border border-slate-800">
              <ListMusic className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 font-medium">All pending requests have been handled!</p>
              <p className="text-slate-600 text-xs mt-1">Guests can scan the QR code to request more songs.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div 
                  key={req.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <img 
                      src={req.track.albumArt} 
                      alt={req.track.name} 
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-white font-bold text-sm sm:text-base truncate">
                          {req.track.name}
                        </h4>
                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
                          <Heart className="w-3 h-3 fill-current" />
                          <span>{req.upvotes}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{req.track.artist}</p>
                      
                      <div className="mt-1 text-xs text-slate-300 flex items-center space-x-2 flex-wrap">
                        <span className="font-semibold text-amber-300">{req.requestedBy}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{req.tableNumber}</span>
                        {req.vibe && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-rose-300/80 bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px]">
                              {req.vibe}
                            </span>
                          </>
                        )}
                      </div>

                      {req.dedication && (
                        <p className="text-xs text-amber-200/90 italic mt-1 bg-amber-500/5 border-l-2 border-amber-400/40 pl-2 rounded-r">
                          "{req.dedication}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* DJ Action Buttons */}
                  <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handlePushToSpotify(req)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md transition transform active:scale-95 flex items-center space-x-1"
                      title="Add directly to Spotify player queue"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Push to Spotify</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(req.id, 'queued')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      title="Mark as queued / approved"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(req.id, 'played')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      title="Mark as already played"
                    >
                      Play Now
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(req.id, 'declined')}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                      title="Decline request"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: QUEUED / UP NEXT */}
      {activeTab === 'queued' && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Songs Approved & In Queue
          </h3>

          {queuedRequests.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-slate-900/40 border border-slate-800">
              <p className="text-slate-400 font-medium">No songs in the active queue.</p>
              <p className="text-slate-600 text-xs mt-1">Approve songs from "Pending Review" to see them here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queuedRequests.map((req, idx) => (
                <div 
                  key={req.id}
                  className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/15 to-slate-900 border border-amber-500/30 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <span className="text-xs font-bold text-amber-400">#{idx + 1}</span>
                    <img 
                      src={req.track.albumArt} 
                      alt={req.track.name} 
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <h4 className="text-white font-semibold text-sm truncate">{req.track.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{req.track.artist}</p>
                      <p className="text-[11px] text-amber-300/80">Requested by {req.requestedBy} ({req.tableNumber})</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'played')}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition"
                    >
                      Mark Played
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(req.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PLAYED HISTORY */}
      {activeTab === 'played' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Tonight's Played Songs
          </h3>
          {playedRequests.map((req) => (
            <div 
              key={req.id}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between opacity-80"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <img src={req.track.albumArt} alt={req.track.name} className="w-10 h-10 rounded-lg object-cover" />
                <div className="min-w-0">
                  <h4 className="text-slate-200 font-medium text-sm truncate">{req.track.name}</h4>
                  <p className="text-xs text-slate-500 truncate">{req.track.artist} • Requested by {req.requestedBy}</p>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                Played
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: DO-NOT-PLAY BLACKLIST */}
      {activeTab === 'blacklist' && (
        <div className="max-w-xl">
          <div className="mb-6 p-4 rounded-2xl bg-red-950/20 border border-red-900/50">
            <h4 className="text-red-300 font-bold text-sm flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Wedding "Do Not Play" List</span>
            </h4>
            <p className="text-xs text-red-300/80 mt-1">
              Any requests matching these song titles or artist names will be immediately blocked from guest submissions.
            </p>
          </div>

          <form onSubmit={handleAddBan} className="flex gap-2 mb-6">
            <select
              value={banType}
              onChange={(e) => setBanType(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none"
            >
              <option value="song">Song Title</option>
              <option value="artist">Artist Name</option>
            </select>
            <input
              type="text"
              value={banValue}
              onChange={(e) => setBanValue(e.target.value)}
              placeholder="e.g. Macarena, The Chicken Dance, ex-partner songs..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition"
            >
              Add Ban
            </button>
          </form>

          <div className="space-y-2">
            {(settings.bannedItems || []).map((ban) => (
              <div key={ban.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                    {ban.type}
                  </span>
                  <span className="text-white text-sm font-medium">{ban.value}</span>
                </div>
                <button
                  onClick={() => handleRemoveBan(ban.id)}
                  className="text-slate-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: WEDDING SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-xl">
          <form onSubmit={handleSaveSettings} className="space-y-4">
            {settingsSaved && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                Wedding settings saved successfully!
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Couple Names
              </label>
              <input
                type="text"
                value={editSettings.coupleNames || ''}
                onChange={(e) => setEditSettings({ ...editSettings, coupleNames: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Wedding Date
              </label>
              <input
                type="text"
                value={editSettings.weddingDate || ''}
                onChange={(e) => setEditSettings({ ...editSettings, weddingDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Guest Welcome Message
              </label>
              <textarea
                value={editSettings.customMessage || ''}
                onChange={(e) => setEditSettings({ ...editSettings, customMessage: e.target.value })}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Auto-Approve Popular Requests</h4>
                  <p className="text-xs text-slate-400">Automatically push songs to the queue when they reach a vote threshold</p>
                </div>
                <input
                  type="checkbox"
                  checked={editSettings.autoApproveEnabled || false}
                  onChange={(e) => setEditSettings({ ...editSettings, autoApproveEnabled: e.target.checked })}
                  className="w-5 h-5 accent-rose-500 cursor-pointer"
                />
              </div>

              {editSettings.autoApproveEnabled && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Upvote threshold for auto-approval: {editSettings.autoApproveThreshold} votes
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={editSettings.autoApproveThreshold || 3}
                    onChange={(e) => setEditSettings({ ...editSettings, autoApproveThreshold: parseInt(e.target.value) })}
                    className="w-full accent-rose-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="text-sm font-semibold text-white">Allow Explicit Lyrics</h4>
                  <p className="text-xs text-slate-400">Uncheck to restrict grandma-unfriendly songs</p>
                </div>
                <input
                  type="checkbox"
                  checked={editSettings.allowExplicit || false}
                  onChange={(e) => setEditSettings({ ...editSettings, allowExplicit: e.target.checked })}
                  className="w-5 h-5 accent-rose-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition"
              >
                Save Wedding Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE QR CODE MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center relative">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Table Sign</span>
            <h3 className="font-serif-wedding text-2xl font-bold text-white mt-1 mb-1">
              {settings.coupleNames || "Sarah & David"}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Scan with your phone camera to request songs!
            </p>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mb-4">
              <QRCodeSVG 
                value={guestPortalUrl}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="text-xs font-mono text-amber-300/80 break-all mb-4">
              {guestPortalUrl}
            </p>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
            >
              Print Table Signs 🖨️
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
