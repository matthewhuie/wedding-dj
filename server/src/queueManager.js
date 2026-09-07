import { v4 as uuidv4 } from 'uuid';

class QueueManager {
  constructor() {
    this.requests = [];
    this.bannedItems = [
      { id: 'ban-1', type: 'song', value: 'Baby Shark' },
      { id: 'ban-2', type: 'song', value: 'The Chicken Dance' }
    ];

    this.settings = {
      coupleNames: 'Sarah & David',
      weddingDate: 'September 12, 2026',
      customMessage: 'Welcome to our wedding celebration! Request your favorite tune and help us make this night unforgettable 🥂🎶',
      autoApproveEnabled: false,
      autoApproveThreshold: 3,
      allowExplicit: false,
      maxRequestsPerGuest: 5,
      announcements: [
        'Cake cutting at 9:30 PM! 🎂',
        'Late night tacos arrive at 10:45 PM! 🌮'
      ]
    };

    // Initialize with a couple of fun pre-requests so the UI looks lively immediately!
    this.seedInitialRequests();
  }

  seedInitialRequests() {
    this.requests = [
      {
        id: uuidv4(),
        track: {
          id: "spotify:track:2grjqo0Frpf25SaUM2vydS",
          name: "September",
          artist: "Earth, Wind & Fire",
          album: "The Best of Earth, Wind & Fire, Vol. 1",
          albumArt: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
          durationMs: 215000,
          explicit: false,
          previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        },
        requestedBy: "Maid of Honor (Jessica)",
        tableNumber: "Head Table",
        dedication: "For the newlyweds! Let's get the whole bridal party on the floor!",
        vibe: "Dancefloor Banger",
        upvotes: 6,
        votedBy: ["guest-1", "guest-2", "guest-3", "guest-4", "guest-5", "guest-6"],
        status: "queued", // 'pending' | 'queued' | 'played' | 'declined'
        createdAt: Date.now() - 1000 * 60 * 15
      },
      {
        id: uuidv4(),
        track: {
          id: "spotify:track:4kLLWz7srcuLrz7vl9P2AX",
          name: "Can't Help Falling in Love",
          artist: "Elvis Presley",
          album: "Blue Hawaii",
          albumArt: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop",
          durationMs: 182000,
          explicit: false,
          previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
        },
        requestedBy: "Grandma Rose",
        tableNumber: "Table 1",
        dedication: "To our beautiful Sarah & David, 60 years of love from Grandma and Grandpa.",
        vibe: "Slow Dance",
        upvotes: 8,
        votedBy: ["guest-1", "guest-2", "guest-3", "guest-7", "guest-8", "guest-9", "guest-10", "guest-11"],
        status: "pending",
        createdAt: Date.now() - 1000 * 60 * 10
      },
      {
        id: uuidv4(),
        track: {
          id: "spotify:track:0GjEhRrHG39Voq0eh19Teq",
          name: "Mr. Brightside",
          artist: "The Killers",
          album: "Hot Fuss",
          albumArt: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=300&h=300&fit=crop",
          durationMs: 222000,
          explicit: false,
          previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
        },
        requestedBy: "College Crew (Dave)",
        tableNumber: "Table 8",
        dedication: "Save this for midnight! We're screaming this one!",
        vibe: "Singalong",
        upvotes: 4,
        votedBy: ["guest-1", "guest-4", "guest-8", "guest-12"],
        status: "pending",
        createdAt: Date.now() - 1000 * 60 * 5
      }
    ];
  }

  isBanned(track) {
    const title = track.name.toLowerCase();
    const artist = track.artist.toLowerCase();

    return this.bannedItems.some(b => {
      const val = b.value.toLowerCase();
      if (b.type === 'song') {
        return title.includes(val);
      }
      if (b.type === 'artist') {
        return artist.includes(val);
      }
      return title.includes(val) || artist.includes(val);
    });
  }

  addRequest({ track, requestedBy, tableNumber, dedication, vibe, guestToken }) {
    // Check explicit filter
    if (!this.settings.allowExplicit && track.explicit) {
      throw new Error("Explicit tracks are restricted by the wedding hosts.");
    }

    // Check banned list
    if (this.isBanned(track)) {
      throw new Error(`"${track.name}" is on the couple's Do-Not-Play list!`);
    }

    // Check duplicate in pending or queued
    const existing = this.requests.find(
      r => (r.status === 'pending' || r.status === 'queued') && r.track.id === track.id
    );
    if (existing) {
      // Auto-upvote instead of rejecting
      this.upvoteRequest(existing.id, guestToken || 'guest-anon');
      return { request: existing, duplicateUpvoted: true };
    }

    // Rate limiting per guest
    if (guestToken) {
      const guestRequestCount = this.requests.filter(
        r => r.votedBy.includes(guestToken) && r.status !== 'declined'
      ).length;
      if (guestRequestCount >= this.settings.maxRequestsPerGuest) {
        throw new Error(`You have reached the maximum of ${this.settings.maxRequestsPerGuest} requests. Upvote other songs in the queue!`);
      }
    }

    const newRequest = {
      id: uuidv4(),
      track,
      requestedBy: (requestedBy || 'A Fun Guest').trim(),
      tableNumber: (tableNumber || 'Table ?').trim(),
      dedication: (dedication || '').trim(),
      vibe: vibe || 'Dancefloor Banger',
      upvotes: 1,
      votedBy: guestToken ? [guestToken] : [],
      status: 'pending',
      createdAt: Date.now()
    };

    // Auto-approve if threshold is 1 and auto-approve enabled
    if (this.settings.autoApproveEnabled && this.settings.autoApproveThreshold <= 1) {
      newRequest.status = 'queued';
    }

    this.requests.push(newRequest);
    return { request: newRequest, duplicateUpvoted: false };
  }

  upvoteRequest(requestId, guestToken) {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');

    if (guestToken && req.votedBy.includes(guestToken)) {
      // Toggle off upvote if already voted
      req.votedBy = req.votedBy.filter(t => t !== guestToken);
      req.upvotes = Math.max(0, req.upvotes - 1);
      return { request: req, action: 'removed' };
    }

    if (guestToken) {
      req.votedBy.push(guestToken);
    }
    req.upvotes += 1;

    // Check auto-approve threshold
    if (
      this.settings.autoApproveEnabled &&
      req.status === 'pending' &&
      req.upvotes >= this.settings.autoApproveThreshold
    ) {
      req.status = 'queued';
    }

    return { request: req, action: 'added' };
  }

  updateStatus(requestId, status) {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');
    req.status = status;
    if (status === 'queued') {
      req.queuedAt = Date.now();
    }
    return req;
  }

  deleteRequest(requestId) {
    this.requests = this.requests.filter(r => r.id !== requestId);
    return true;
  }

  addBannedItem({ type, value }) {
    const item = { id: uuidv4(), type, value: value.trim() };
    this.bannedItems.push(item);
    return item;
  }

  removeBannedItem(id) {
    this.bannedItems = this.bannedItems.filter(b => b.id !== id);
    return true;
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }

  getState() {
    return {
      requests: this.requests,
      settings: this.settings,
      bannedItems: this.bannedItems
    };
  }
}

export const queueManager = new QueueManager();
