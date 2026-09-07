import { io } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

// Guest token stored in localStorage so each phone remembers its upvotes & requests
export const getGuestToken = () => {
  let token = localStorage.getItem('wedding_dj_guest_token');
  if (!token) {
    token = 'guest_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('wedding_dj_guest_token', token);
  }
  return token;
};

export const api = {
  async getStatus() {
    const res = await fetch('/api/status');
    return res.json();
  },

  async getState() {
    const res = await fetch('/api/state');
    return res.json();
  },

  async searchSpotify(query) {
    const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  async submitRequest(requestData) {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit request');
    }
    return res.json();
  },

  async upvoteRequest(requestId) {
    const guestToken = getGuestToken();
    const res = await fetch(`/api/requests/${requestId}/upvote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestToken })
    });
    return res.json();
  },

  async updateRequestStatus(requestId, status, sendToSpotify = false, deviceId = null) {
    const res = await fetch(`/api/requests/${requestId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, sendToSpotify, deviceId })
    });
    return res.json();
  },

  async deleteRequest(requestId) {
    const res = await fetch(`/api/requests/${requestId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async getDevices() {
    const res = await fetch('/api/spotify/devices');
    return res.json();
  },

  async play(uri = null, deviceId = null) {
    const res = await fetch('/api/spotify/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri, deviceId })
    });
    return res.json();
  },

  async pause(deviceId = null) {
    const res = await fetch('/api/spotify/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId })
    });
    return res.json();
  },

  async nextTrack(deviceId = null) {
    const res = await fetch('/api/spotify/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId })
    });
    return res.json();
  },

  async addToSpotifyQueue(uri, deviceId = null, requestId = null) {
    const res = await fetch('/api/spotify/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri, deviceId, requestId })
    });
    return res.json();
  },

  async updateSettings(settings) {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  async addBannedItem(type, value) {
    const res = await fetch('/api/banned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value })
    });
    return res.json();
  },

  async removeBannedItem(id) {
    const res = await fetch(`/api/banned/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async updateSpotifyConfig(config) {
    const res = await fetch('/api/spotify/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  async getSpotifyLoginUrl() {
    const res = await fetch('/api/spotify/login');
    return res.json();
  }
};
