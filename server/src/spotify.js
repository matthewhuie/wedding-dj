import axios from 'axios';
import { MOCK_WEDDING_TRACKS } from './mockData.js';

class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:4000/api/spotify/callback';
    
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;
    this.isDemoMode = !process.env.SPOTIFY_CLIENT_ID;

    // Simulated playback state for demo mode or fallback
    this.simulatedPlayback = {
      isPlaying: true,
      currentTrack: MOCK_WEDDING_TRACKS[0],
      progressMs: 34000,
      timestamp: Date.now(),
      device: {
        id: "demo-device-1",
        name: "Venue Sound System (Demo)",
        type: "Speaker",
        is_active: true,
        volume_percent: 85
      }
    };

    // Simulated devices list
    this.simulatedDevices = [
      { id: "demo-device-1", name: "Venue Sound System (Demo)", type: "Speaker", is_active: true, volume_percent: 85 },
      { id: "demo-device-2", name: "DJ MacBook Pro", type: "Computer", is_active: false, volume_percent: 100 },
      { id: "demo-device-3", name: "Cocktail Patio Sonos", type: "Speaker", is_active: false, volume_percent: 70 }
    ];
  }

  setCredentials({ clientId, clientSecret, redirectUri }) {
    if (clientId) this.clientId = clientId.trim();
    if (clientSecret) this.clientSecret = clientSecret.trim();
    if (redirectUri) this.redirectUri = redirectUri.trim();
    if (!this.clientId) {
      this.isDemoMode = true;
    }
  }

  setDemoMode(isDemo) {
    this.isDemoMode = isDemo;
  }

  getStatus() {
    return {
      isDemoMode: this.isDemoMode,
      hasCredentials: Boolean(this.clientId && this.clientSecret),
      isConnected: Boolean(this.accessToken && Date.now() < this.tokenExpiry),
      clientId: this.clientId ? `${this.clientId.substring(0, 6)}...` : null
    };
  }

  getAuthorizeUrl(state = 'wedding') {
    if (!this.clientId) return null;
    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
      state: state
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async handleCallback(code) {
    try {
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`
          }
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      this.accessToken = access_token;
      if (refresh_token) this.refreshToken = refresh_token;
      this.tokenExpiry = Date.now() + expires_in * 1000;
      this.isDemoMode = false;
      return true;
    } catch (err) {
      console.error('Spotify token exchange failed:', err.response?.data || err.message);
      throw new Error(err.response?.data?.error_description || 'Failed to exchange authorization code');
    }
  }

  async getAccessToken() {
    if (this.isDemoMode) return null;
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    if (this.refreshToken) {
      try {
        const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        const res = await axios.post(
          'https://accounts.spotify.com/api/token',
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${basicAuth}`
            }
          }
        );
        this.accessToken = res.data.access_token;
        this.tokenExpiry = Date.now() + res.data.expires_in * 1000;
        return this.accessToken;
      } catch (err) {
        console.error('Failed to refresh Spotify token:', err.response?.data || err.message);
        this.accessToken = null;
      }
    }
    return null;
  }

  async searchTracks(query, limit = 15) {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      return MOCK_WEDDING_TRACKS.slice(0, limit);
    }

    const token = await this.getAccessToken();

    // If we have an active Spotify token, query Spotify Web API
    if (token) {
      try {
        const res = await axios.get('https://api.spotify.com/v1/search', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            q: query,
            type: 'track',
            limit: limit
          }
        });

        const items = res.data?.tracks?.items || [];
        return items.map(item => ({
          id: item.uri || `spotify:track:${item.id}`,
          spotifyId: item.id,
          name: item.name,
          artist: item.artists.map(a => a.name).join(', '),
          album: item.album.name,
          albumArt: item.album.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
          durationMs: item.duration_ms,
          explicit: item.explicit,
          previewUrl: item.preview_url,
          year: item.album.release_date ? parseInt(item.album.release_date.split('-')[0]) : null
        }));
      } catch (err) {
        console.warn('Spotify search failed, falling back to catalog:', err.message);
      }
    }

    // Demo catalog search with fuzzy match
    const filtered = MOCK_WEDDING_TRACKS.filter(track => {
      const matchName = track.name.toLowerCase().includes(q);
      const matchArtist = track.artist.toLowerCase().includes(q);
      const matchVibe = track.vibe?.toLowerCase().includes(q);
      return matchName || matchArtist || matchVibe;
    });

    if (filtered.length > 0) return filtered;

    // Fallback: If user types a custom song not in mock list, generate a realistic track item so they can still request it!
    return [
      {
        id: `spotify:track:custom_${Date.now()}`,
        name: query.split(' - ')[0] || query,
        artist: query.includes(' - ') ? query.split(' - ')[1] : 'Wedding Guest Request',
        album: 'Special Request',
        albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
        durationMs: 210000,
        explicit: false,
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        vibe: "Guest Choice",
        year: 2024
      },
      ...MOCK_WEDDING_TRACKS.slice(0, 5)
    ];
  }

  async addToQueue(uri, deviceId = null) {
    const token = await this.getAccessToken();
    if (token) {
      try {
        const params = { uri };
        if (deviceId) params.device_id = deviceId;
        await axios.post('https://api.spotify.com/v1/me/player/queue', null, {
          headers: { Authorization: `Bearer ${token}` },
          params
        });
        return { success: true, mode: 'spotify' };
      } catch (err) {
        console.error('Spotify add to queue error:', err.response?.data || err.message);
        throw new Error(err.response?.data?.error?.message || 'Spotify queue request failed');
      }
    }

    // Demo Mode Queue
    return { success: true, mode: 'demo' };
  }

  async getPlaybackState() {
    const token = await this.getAccessToken();
    if (token) {
      try {
        const res = await axios.get('https://api.spotify.com/v1/me/player', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 204 || !res.data) {
          return { isPlaying: false, currentTrack: null, device: null };
        }

        const data = res.data;
        const item = data.item;
        return {
          isPlaying: data.is_playing,
          progressMs: data.progress_ms,
          timestamp: Date.now(),
          device: data.device ? {
            id: data.device.id,
            name: data.device.name,
            type: data.device.type,
            is_active: data.device.is_active,
            volume_percent: data.device.volume_percent
          } : null,
          currentTrack: item ? {
            id: item.uri,
            spotifyId: item.id,
            name: item.name,
            artist: item.artists.map(a => a.name).join(', '),
            album: item.album.name,
            albumArt: item.album.images?.[0]?.url,
            durationMs: item.duration_ms,
            explicit: item.explicit
          } : null
        };
      } catch (err) {
        console.warn('Failed to get Spotify playback state:', err.message);
      }
    }

    // Demo simulation
    return this.simulatedPlayback;
  }

  async getDevices() {
    const token = await this.getAccessToken();
    if (token) {
      try {
        const res = await axios.get('https://api.spotify.com/v1/me/player/devices', {
          headers: { Authorization: `Bearer ${token}` }
        });
        return res.data?.devices || [];
      } catch (err) {
        console.warn('Failed to get Spotify devices:', err.message);
      }
    }

    return this.simulatedDevices;
  }

  async play(uri = null, deviceId = null) {
    const token = await this.getAccessToken();
    if (token) {
      const params = deviceId ? { device_id: deviceId } : {};
      const body = uri ? { uris: [uri] } : {};
      await axios.put('https://api.spotify.com/v1/me/player/play', body, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return { success: true };
    }

    this.simulatedPlayback.isPlaying = true;
    return { success: true, mode: 'demo' };
  }

  async pause(deviceId = null) {
    const token = await this.getAccessToken();
    if (token) {
      const params = deviceId ? { device_id: deviceId } : {};
      await axios.put('https://api.spotify.com/v1/me/player/pause', null, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return { success: true };
    }

    this.simulatedPlayback.isPlaying = false;
    return { success: true, mode: 'demo' };
  }

  async nextTrack(deviceId = null) {
    const token = await this.getAccessToken();
    if (token) {
      const params = deviceId ? { device_id: deviceId } : {};
      await axios.post('https://api.spotify.com/v1/me/player/next', null, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return { success: true };
    }

    // Pick next simulated track
    const currentIndex = MOCK_WEDDING_TRACKS.findIndex(t => t.id === this.simulatedPlayback.currentTrack?.id);
    const nextIndex = (currentIndex + 1) % MOCK_WEDDING_TRACKS.length;
    this.simulatedPlayback.currentTrack = MOCK_WEDDING_TRACKS[nextIndex];
    this.simulatedPlayback.progressMs = 0;
    return { success: true, mode: 'demo', track: this.simulatedPlayback.currentTrack };
  }

  // Update simulated now playing manually from DJ board
  setSimulatedCurrentTrack(track) {
    this.simulatedPlayback.currentTrack = track;
    this.simulatedPlayback.progressMs = 0;
    this.simulatedPlayback.isPlaying = true;
  }
}

export const spotifyService = new SpotifyService();
