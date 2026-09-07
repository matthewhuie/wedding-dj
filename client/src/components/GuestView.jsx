import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Heart, 
  Play, 
  Pause, 
  Sparkles, 
  Send, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Music, 
  Disc, 
  X,
  MessageSquare,
  Users,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, getGuestToken } from '../services/api.js';

export default function GuestView({ 
  requests = [], 
  settings = {}, 
  playback = {}, 
  vibes = [],
  activePreview,
  togglePreview
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [filterTab, setFilterTab] = useState('popular'); // popular, upnext, mine, recent
  const [selectedVibeFilter, setSelectedVibeFilter] = useState('all');

  // Request form state
  const [guestName, setGuestName] = useState(() => localStorage.getItem('wedding_dj_guest_name') || '');
  const [tableNumber, setTableNumber] = useState(() => localStorage.getItem('wedding_dj_table') || 'Table 1');
  const [dedication, setDedication] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('Dancefloor Banger');
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');

  const guestToken = getGuestToken();

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Default recommended tracks
      api.searchSpotify('').then(res => {
        setSearchResults(res.tracks || []);
      });
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await api.searchSpotify(searchQuery);
        setSearchResults(res.tracks || []);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Initial load recommended tracks
  useEffect(() => {
    api.searchSpotify('').then(res => {
      setSearchResults(res.tracks || []);
    });
  }, []);

  const handleOpenRequestModal = (track) => {
    setSelectedTrack(track);
    setRequestError('');
    setSelectedVibe(track.vibe || 'Dancefloor Banger');
  };

  const handleCloseModal = () => {
    setSelectedTrack(null);
    setRequestError('');
    setDedication('');
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedTrack) return;

    setSubmitting(true);
    setRequestError('');

    try {
      localStorage.setItem('wedding_dj_guest_name', guestName);
      localStorage.setItem('wedding_dj_table', tableNumber);

      const res = await api.submitRequest({
        track: selectedTrack,
        requestedBy: guestName || 'A Fun Guest',
        tableNumber: tableNumber || 'Table ?',
        dedication,
        vibe: selectedVibe,
        guestToken
      });

      // Launch wedding confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#c88c50', '#e3c59f', '#f43f5e', '#fbbf24', '#ffffff']
      });

      handleCloseModal();
      setSearchQuery('');
    } catch (err) {
      setRequestError(err.message || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (requestId) => {
    try {
      await api.upvoteRequest(requestId);
    } catch (err) {
      console.error('Upvote error:', err);
    }
  };

  // Filter & sort requests
  const filteredRequests = requests.filter(req => {
    if (selectedVibeFilter !== 'all') {
      const matchVibe = (req.vibe || '').toLowerCase().includes(selectedVibeFilter.toLowerCase());
      if (!matchVibe) return false;
    }

    if (filterTab === 'upnext') {
      return req.status === 'queued';
    }
    if (filterTab === 'mine') {
      return req.votedBy?.includes(guestToken) || req.requestedBy === guestName;
    }
    return req.status !== 'declined';
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (filterTab === 'recent') {
      return (b.createdAt || 0) - (a.createdAt || 0);
    }
    // Default popular / top voted
    return (b.upvotes || 0) - (a.upvotes || 0);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28">
      
      {/* Wedding Greeting Hero */}
      <div className="text-center mb-8 relative">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold mb-3 tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Live Guest Music Requests</span>
        </div>
        <h1 className="font-serif-wedding text-3xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-100 mb-2">
          {settings.coupleNames || "Sarah & David"}'s Wedding
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
          {settings.customMessage || "Pick a song to keep the celebration dancing all night long!"}
        </p>
      </div>

      {/* Currently Playing Card */}
      {playback?.currentTrack && (
        <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="relative flex-shrink-0">
              <img 
                src={playback.currentTrack.albumArt || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&h=120&fit=crop"} 
                alt="Now Playing"
                className={`w-14 h-14 rounded-xl object-cover shadow-lg ${playback.isPlaying ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950' : ''}`}
              />
              {playback.isPlaying && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {playback.isPlaying ? "Now Playing" : "Paused"}
                </span>
              </div>
              <h3 className="text-white font-semibold text-sm sm:text-base truncate mt-0.5">
                {playback.currentTrack.name}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {playback.currentTrack.artist}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center">
              <Disc className={`w-5 h-5 text-amber-300 ${playback.isPlaying ? 'animate-spin-slow' : ''}`} />
            </div>
          </div>
        </div>
      )}

      {/* Search Input Box */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Spotify for a song, artist, or party anthem..."
            className="w-full pl-12 pr-10 py-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition text-sm sm:text-base shadow-lg"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Spotify Search Results */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold tracking-wider text-amber-200 uppercase flex items-center space-x-2">
            <Music className="w-4 h-4 text-amber-400" />
            <span>{searchQuery ? `Results for "${searchQuery}"` : "Recommended Wedding Hits"}</span>
          </h2>
          {isSearching && (
            <span className="text-xs text-slate-400 animate-pulse">Searching Spotify...</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {searchResults.map((track) => {
            const isPlayingThis = activePreview === track.previewUrl;

            return (
              <div 
                key={track.id}
                className="group flex items-center justify-between p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition shadow-sm"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={track.albumArt} 
                      alt={track.name} 
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    {track.previewUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePreview(track.previewUrl);
                        }}
                        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] rounded-lg flex items-center justify-center transition ${
                          isPlayingThis ? 'opacity-100 text-emerald-400' : 'opacity-0 group-hover:opacity-100 text-white'
                        }`}
                        title={isPlayingThis ? "Pause Preview" : "Listen to 30s Preview"}
                      >
                        {isPlayingThis ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                      </button>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-white truncate group-hover:text-amber-200 transition">
                      {track.name}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {track.artist}
                    </p>
                    {track.vibe && (
                      <span className="inline-block mt-0.5 text-[10px] text-amber-300/80 bg-amber-400/10 px-1.5 py-0.2 rounded">
                        {track.vibe}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenRequestModal(track)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white text-xs font-semibold shadow transition transform active:scale-95 flex items-center space-x-1"
                >
                  <span>Request</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Queue & Upvotes Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <span>Dancefloor Request Leaderboard</span>
            </h2>
            <p className="text-xs text-slate-400">
              Vote for your favorites! The highest-voted songs get played first.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start">
            <button
              onClick={() => setFilterTab('popular')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterTab === 'popular' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🔥 Top Voted
            </button>
            <button
              onClick={() => setFilterTab('upnext')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterTab === 'upnext' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              💍 Up Next
            </button>
            <button
              onClick={() => setFilterTab('recent')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterTab === 'recent' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⏰ Newest
            </button>
            <button
              onClick={() => setFilterTab('mine')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterTab === 'mine' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🙋 Mine
            </button>
          </div>
        </div>

        {/* Requests List */}
        {sortedRequests.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <Music className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-slate-300 font-semibold text-base mb-1">No requests found</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Be the first to search Spotify above and get the dance floor started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRequests.map((req, idx) => {
              const hasVoted = req.votedBy?.includes(guestToken);
              const isPlayingThis = activePreview === req.track.previewUrl;

              return (
                <div 
                  key={req.id}
                  className={`p-4 rounded-2xl bg-slate-900/80 border transition ${
                    req.status === 'queued' 
                      ? 'border-amber-500/40 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900' 
                      : req.status === 'played'
                      ? 'border-slate-800/50 opacity-60'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    
                    {/* Track info & Rank */}
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-[11px] font-bold text-slate-400 flex-shrink-0 mt-2">
                        #{idx + 1}
                      </div>

                      <div className="relative flex-shrink-0">
                        <img 
                          src={req.track.albumArt} 
                          alt={req.track.name} 
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                        {req.track.previewUrl && (
                          <button
                            onClick={() => togglePreview(req.track.previewUrl)}
                            className={`absolute inset-0 bg-black/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center transition ${
                              isPlayingThis ? 'opacity-100 text-emerald-400' : 'opacity-0 hover:opacity-100 text-white'
                            }`}
                          >
                            {isPlayingThis ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                          </button>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                            {req.track.name}
                          </h3>
                          {req.status === 'queued' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Queued by DJ</span>
                            </span>
                          )}
                          {req.status === 'played' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                              Played
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          {req.track.artist}
                        </p>

                        {/* Guest attribution & dedication */}
                        <div className="mt-2 text-xs text-slate-300 flex items-center space-x-2 flex-wrap">
                          <span className="font-medium text-amber-300/90 flex items-center space-x-1">
                            <Users className="w-3 h-3 inline" />
                            <span>{req.requestedBy}</span>
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{req.tableNumber}</span>
                          {req.vibe && (
                            <>
                              <span className="text-slate-500">•</span>
                              <span className="text-rose-300/80 bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                {req.vibe}
                              </span>
                            </>
                          )}
                        </div>

                        {req.dedication && (
                          <div className="mt-1.5 text-xs text-amber-100/90 italic bg-amber-500/5 border-l-2 border-amber-500/40 pl-2.5 py-0.5 rounded-r">
                            "{req.dedication}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upvote Button */}
                    <div className="flex flex-col items-center flex-shrink-0 pl-2">
                      <button
                        onClick={() => handleUpvote(req.id)}
                        className={`flex flex-col items-center justify-center w-12 h-14 rounded-2xl transition transform active:scale-95 ${
                          hasVoted 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                        title={hasVoted ? "Remove Upvote" : "Vote for this song"}
                      >
                        <Heart className={`w-5 h-5 ${hasVoted ? 'fill-white' : ''}`} />
                        <span className="text-xs font-bold mt-0.5">{req.upvotes || 0}</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {selectedTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3.5 mb-5">
              <img 
                src={selectedTrack.albumArt} 
                alt={selectedTrack.name} 
                className="w-16 h-16 rounded-2xl object-cover shadow-md"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Song Request</span>
                <h3 className="text-white font-bold text-base truncate">{selectedTrack.name}</h3>
                <p className="text-xs text-slate-400 truncate">{selectedTrack.artist}</p>
              </div>
            </div>

            {requestError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{requestError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Jessica, Uncle Bob, College Crew"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Table Number / Group
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. Table 4, Bridal Suite, Bar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Vibe Tag
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Dancefloor Banger", icon: "🔥" },
                    { label: "Slow Dance", icon: "💍" },
                    { label: "Singalong Anthem", icon: "🎤" },
                    { label: "Bride & Groom Special", icon: "❤️" }
                  ].map((v) => (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => setSelectedVibe(v.label)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center space-x-1.5 transition ${
                        selectedVibe === v.label 
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm' 
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span>{v.icon}</span>
                      <span className="truncate">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Dedication Message (Optional)
                </label>
                <textarea
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  placeholder="e.g. For the newlyweds! First dance memories! Or shoutout to Table 3!"
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending Request...' : 'Send Request to DJ 🥂'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
