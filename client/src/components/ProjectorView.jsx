import React, { useState, useEffect } from 'react';
import { Disc, Heart, Music, Maximize2, Minimize2, Sparkles, QrCode, Volume2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function ProjectorView({ requests = [], settings = {}, playback = {} }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const guestPortalUrl = window.location.origin;

  const currentTrack = playback?.currentTrack || {
    name: "September",
    artist: "Earth, Wind & Fire",
    albumArt: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop"
  };

  // Find request data for current track to show dedication if available
  const matchingRequest = requests.find(r => 
    r.track?.name?.toLowerCase() === currentTrack.name?.toLowerCase()
  );

  const upcomingRequests = requests
    .filter(r => r.status === 'queued' || (r.status === 'pending' && r.upvotes > 1))
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 3);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-between p-6 sm:p-12 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <span className="text-xs uppercase font-semibold tracking-widest text-amber-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Wedding Reception Celebration</span>
          </span>
          <h1 className="font-serif-wedding text-2xl sm:text-4xl font-bold tracking-wide text-amber-100 mt-0.5">
            {settings.coupleNames || "Sarah & David"}
          </h1>
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition shadow-lg"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Center Stage: Now Playing Vinyl & QR Request Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8 relative z-10 max-w-7xl mx-auto w-full">
        
        {/* Left / Center Stage: Spinning Vinyl & Song Hero */}
        <div className="lg:col-span-8 flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
          
          {/* Animated Vinyl Graphic */}
          <div className="relative flex-shrink-0">
            {/* Vinyl record disc */}
            <div className={`w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-black border-4 border-slate-800 shadow-2xl flex items-center justify-center relative overflow-hidden ${playback?.isPlaying ? 'animate-vinyl' : ''}`}>
              {/* Grooves */}
              <div className="absolute inset-4 rounded-full border border-slate-800/80" />
              <div className="absolute inset-8 rounded-full border border-slate-800/60" />
              <div className="absolute inset-12 rounded-full border border-slate-800/40" />
              {/* Album art center sticker */}
              <img 
                src={currentTrack.albumArt} 
                alt={currentTrack.name}
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-amber-400/80 shadow-md"
              />
              <div className="absolute w-4 h-4 rounded-full bg-slate-950 border border-slate-700" />
            </div>

            {/* Glowing soundwave indicator */}
            {playback?.isPlaying && (
              <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Now Spinning</span>
              </div>
            )}
          </div>

          {/* Track Details & Guest Dedication Callout */}
          <div className="min-w-0 text-center sm:text-left">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-2">
              {currentTrack.name}
            </h2>
            <p className="text-base sm:text-2xl text-amber-200/90 font-light">
              {currentTrack.artist}
            </p>

            {/* Simulated Audio Equalizer Bars */}
            <div className="flex items-center justify-center sm:justify-start space-x-1 mt-4 h-6">
              {[40, 70, 90, 60, 100, 75, 45, 85, 55, 95, 30].map((h, i) => (
                <div 
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-rose-500 to-amber-400 rounded-full transition-all duration-300"
                  style={{ 
                    height: playback?.isPlaying ? `${Math.max(15, (h * ((i % 3) + 1)) % 100)}%` : '20%',
                    opacity: playback?.isPlaying ? 0.9 : 0.3
                  }}
                />
              ))}
            </div>

            {/* Dedication Banner */}
            {matchingRequest && (
              <div className="mt-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 max-w-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-xs font-semibold text-amber-300 mb-0.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span>Requested by {matchingRequest.requestedBy} ({matchingRequest.tableNumber})</span>
                </div>
                {matchingRequest.dedication && (
                  <p className="text-xs sm:text-sm text-slate-200 italic">
                    "{matchingRequest.dedication}"
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Stage: Large Table QR Code */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl backdrop-blur-md text-center max-w-xs w-full">
            <div className="flex items-center justify-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-widest mb-3">
              <QrCode className="w-4 h-4" />
              <span>Scan To Request</span>
            </div>

            <div className="p-3 bg-white rounded-2xl shadow-inner inline-block mb-3">
              <QRCodeSVG 
                value={guestPortalUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="text-xs text-slate-300 font-medium">
              Point your phone camera to pick the next wedding dance song!
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Footer: Up Next Preview Carousel */}
      <div className="relative z-10 pt-4 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Up Next on the Dancefloor:
            </span>
          </div>

          <div className="flex items-center space-x-4 overflow-x-auto">
            {upcomingRequests.length === 0 ? (
              <span className="text-xs text-slate-500">Scan QR code to queue up next!</span>
            ) : (
              upcomingRequests.map((req, idx) => (
                <div 
                  key={req.id}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex-shrink-0"
                >
                  <span className="font-bold text-amber-400">#{idx + 1}</span>
                  <img src={req.track.albumArt} alt={req.track.name} className="w-6 h-6 rounded object-cover" />
                  <span className="text-white font-medium truncate max-w-[120px]">{req.track.name}</span>
                  <span className="text-slate-400 text-[11px] truncate max-w-[90px]">({req.requestedBy})</span>
                  <span className="text-rose-400 font-bold flex items-center">
                    ❤️ {req.upvotes}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
