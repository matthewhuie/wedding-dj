import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { spotifyService } from './spotify.js';
import { queueManager } from './queueManager.js';
import { WEDDING_VIBES } from './mockData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve static client build if it exists (for single-server production/preview)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// --- API ROUTES ---

// App status & Spotify connection status
app.get('/api/status', (req, res) => {
  const spotifyStatus = spotifyService.getStatus();
  res.json({
    ok: true,
    spotify: spotifyStatus,
    settings: queueManager.settings
  });
});

// Full state for initial load
app.get('/api/state', (req, res) => {
  res.json({
    ...queueManager.getState(),
    vibes: WEDDING_VIBES
  });
});

// Spotify track search
app.get('/api/spotify/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const limit = parseInt(req.query.limit) || 12;
    const tracks = await spotifyService.searchTracks(q, limit);
    res.json({ tracks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Spotify playback state
app.get('/api/spotify/playback', async (req, res) => {
  try {
    const playback = await spotifyService.getPlaybackState();
    res.json(playback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Spotify devices
app.get('/api/spotify/devices', async (req, res) => {
  try {
    const devices = await spotifyService.getDevices();
    res.json({ devices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Spotify transport controls
app.post('/api/spotify/play', async (req, res) => {
  try {
    const { uri, deviceId } = req.body || {};
    const result = await spotifyService.play(uri, deviceId);
    broadcastPlayback();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/spotify/pause', async (req, res) => {
  try {
    const { deviceId } = req.body || {};
    const result = await spotifyService.pause(deviceId);
    broadcastPlayback();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/spotify/next', async (req, res) => {
  try {
    const { deviceId } = req.body || {};
    const result = await spotifyService.nextTrack(deviceId);
    broadcastPlayback();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add track directly to Spotify playback queue
app.post('/api/spotify/queue', async (req, res) => {
  try {
    const { uri, deviceId, requestId } = req.body || {};
    if (!uri) return res.status(400).json({ error: 'Missing track uri' });
    
    const result = await spotifyService.addToQueue(uri, deviceId);

    if (requestId) {
      const updated = queueManager.updateStatus(requestId, 'queued');
      io.emit('request_updated', updated);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Spotify Auth & Configuration
app.post('/api/spotify/config', (req, res) => {
  const { clientId, clientSecret, redirectUri, isDemoMode } = req.body;
  if (isDemoMode !== undefined) {
    spotifyService.setDemoMode(isDemoMode);
  }
  if (clientId !== undefined) {
    spotifyService.setCredentials({ clientId, clientSecret, redirectUri });
  }
  io.emit('spotify_status_updated', spotifyService.getStatus());
  res.json({ success: true, status: spotifyService.getStatus() });
});

app.get('/api/spotify/login', (req, res) => {
  const url = spotifyService.getAuthorizeUrl();
  if (!url) {
    return res.status(400).json({ error: 'Spotify Client ID not configured.' });
  }
  res.json({ url });
});

app.get('/api/spotify/callback', async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;

  if (error) {
    return res.redirect(`/?spotify_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect('/?spotify_error=no_code');
  }

  try {
    await spotifyService.handleCallback(code);
    io.emit('spotify_status_updated', spotifyService.getStatus());
    res.redirect('/?spotify_connected=true');
  } catch (err) {
    res.redirect(`/?spotify_error=${encodeURIComponent(err.message)}`);
  }
});

// Submit a song request (Guest)
app.post('/api/requests', (req, res) => {
  try {
    const { track, requestedBy, tableNumber, dedication, vibe, guestToken } = req.body;
    if (!track || !track.name) {
      return res.status(400).json({ error: 'Invalid track data' });
    }

    const { request, duplicateUpvoted } = queueManager.addRequest({
      track,
      requestedBy,
      tableNumber,
      dedication,
      vibe,
      guestToken
    });

    io.emit('request_added', { request, duplicateUpvoted });
    res.status(201).json({ request, duplicateUpvoted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Upvote or toggle vote on request
app.post('/api/requests/:id/upvote', (req, res) => {
  try {
    const { guestToken } = req.body;
    const { request, action } = queueManager.upvoteRequest(req.params.id, guestToken);
    io.emit('request_updated', request);
    res.json({ request, action });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update request status (DJ action: 'queued' | 'played' | 'declined' | 'pending')
app.patch('/api/requests/:id/status', async (req, res) => {
  try {
    const { status, sendToSpotify, deviceId } = req.body;
    const updated = queueManager.updateStatus(req.params.id, status);

    // If marked 'played', set as current simulated track if in demo mode
    if (status === 'played' && spotifyService.isDemoMode) {
      spotifyService.setSimulatedCurrentTrack(updated.track);
      broadcastPlayback();
    }

    // Optionally queue directly to Spotify
    if (sendToSpotify && status === 'queued' && updated.track.id) {
      try {
        await spotifyService.addToQueue(updated.track.id, deviceId);
      } catch (e) {
        console.warn('Auto queue to spotify notice:', e.message);
      }
    }

    io.emit('request_updated', updated);
    res.json({ request: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete request
app.delete('/api/requests/:id', (req, res) => {
  try {
    queueManager.deleteRequest(req.params.id);
    io.emit('request_deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update wedding settings
app.put('/api/settings', (req, res) => {
  try {
    const settings = queueManager.updateSettings(req.body);
    io.emit('settings_updated', settings);
    res.json({ settings });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Banned items
app.post('/api/banned', (req, res) => {
  try {
    const item = queueManager.addBannedItem(req.body);
    io.emit('banned_updated', queueManager.bannedItems);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/banned/:id', (req, res) => {
  try {
    queueManager.removeBannedItem(req.params.id);
    io.emit('banned_updated', queueManager.bannedItems);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Helper to broadcast playback state to all websockets
async function broadcastPlayback() {
  try {
    const state = await spotifyService.getPlaybackState();
    io.emit('playback_update', state);
  } catch (e) {
    // Ignore polling errors
  }
}

// WebSocket connection lifecycle
io.on('connection', (socket) => {
  socket.emit('initial_state', {
    ...queueManager.getState(),
    vibes: WEDDING_VIBES,
    spotify: spotifyService.getStatus()
  });

  spotifyService.getPlaybackState().then(playback => {
    socket.emit('playback_update', playback);
  });
});

// Polling timer for live playback synchronization
setInterval(() => {
  broadcastPlayback();
}, 4000);

// Fallback for SPA routing
app.get('*', (req, res) => {
  if (req.accepts('html') && !req.path.startsWith('/api')) {
    const indexPath = path.join(clientDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.json({
          status: 'WeddingBeats DJ Server running',
          client: 'Run client via npm run dev or build client'
        });
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`🎵 WeddingBeats DJ Server listening on http://localhost:${PORT}`);
  console.log(`✨ Mode: ${spotifyService.isDemoMode ? 'Interactive Demo Mode' : 'Connected to Spotify'}`);
});
