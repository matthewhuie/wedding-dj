# 💍 Wedding DJ for Spotify

> A collaborative, real-time wedding DJ web application that allows wedding guests to request songs, dedicate tracks, and upvote their favorites on Spotify—giving the couple/DJ total control of the dancefloor without needing to hire an expensive DJ.

---

## ✨ Key Features

1. **Guest Mobile Experience**:
   - **Spotify Catalog Search**: Search any song, artist, or wedding classic.
   - **Audio Previews**: 30-second sound clips so guests can check the song before requesting.
   - **Personal Dedications & Vibes**: Add your name, table number (e.g., *Table 4*, *Bridal Suite*), a dedication (*"For the newlyweds!"*), and vibe tag (*Dancefloor Banger 🔥*, *Slow Dance 💍*, *Singalong 🎤*, etc.).
   - **Live Upvote Leaderboard**: Guests can browse and upvote requested songs in real time. Songs with the highest crowd energy rise to the top!

2. **DJ / Host Cockpit (`?mode=dj`)**:
   - **Live Spotify Playback Deck**: Real-time Now Playing display with album art, progress bar, play/pause, and skip controls.
   - **Speaker / Device Selection**: Easily route audio to your venue sound system, Sonos, iPad, or laptop.
   - **Request Management**: Approve, push directly to Spotify's playback queue, or decline requests with one click.
   - **Auto-DJ Mode**: Optionally automatically queue songs when they hit $N$ upvotes.
   - **Do-Not-Play Blacklist**: Block songs (e.g., *Baby Shark*, *The Chicken Dance*) or specific artists.
   - **Explicit Lyrics Filter**: Keeps the party friendly for Grandma and younger guests.
   - **Printable Table QR Generator**: Generates high-res QR codes for table cards so guests can scan with their phone camera.

3. **Projector / TV Ambient Screen (`?mode=tv`)**:
   - High-impact fullscreen display for the venue TV or projector screen.
   - Animated spinning vinyl record with glowing album art and live audio visualizer equalizer.
   - Live guest dedication callouts (*"Requested by Grandma Rose for Table 1: '60 years of love from Grandma and Grandpa' ❤️"*).
   - Prominent, oversized QR code for guests to scan from anywhere in the hall.
   - Up-next song preview carousel.

4. **Dual Mode Support**:
   - **Interactive Demo Mode**: Ready out of the box with zero configuration! Includes a curated wedding music catalog and audio previews.
   - **Spotify Connect Mode**: Simply enter your Spotify Developer `Client ID` and `Client Secret` to connect directly to Spotify and your venue sound setup.

---

## 🚀 Quick Start

### 1. Start the Application
From the project directory:
```bash
# Start the server (serves the web app on http://localhost:4000)
npm run start
```

Open your browser to:
- **Guest Portal**: `http://localhost:4000` (or local Wi-Fi IP e.g. `http://192.168.1.50:4000`)
- **DJ Cockpit**: `http://localhost:4000/?mode=dj`
- **Projector / Venue TV**: `http://localhost:4000/?mode=tv`

### 2. Development Mode (with Live Reload)
```bash
# Terminal 1: Run Backend
npm run server

# Terminal 2: Run Frontend with Vite HMR
npm run client
```

---

## 🎧 Connecting to Spotify

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Click **Create an App**.
   - App name: `Wedding DJ`
   - App description: `Wedding music request portal`
   - Redirect URI: `http://localhost:4000/api/spotify/callback`
3. In the DJ Cockpit, click **Settings** (top right) ➔ select **Connect Spotify**.
4. Enter your **Client ID** and **Client Secret**, then click **Authorize with Spotify**.
5. Once authorized, all song requests can be pushed directly to your active Spotify player (Sonos, laptop, phone, or Bluetooth speaker)!

---

## 📱 Wedding Day Venue Setup Tips

1. **Table Signs**: Open the DJ Cockpit, click **Table QR Code**, and print table cards with the QR code.
2. **Audio Setup**: Connect a laptop or iPad to the venue sound system / PA speakers with Spotify running.
3. **Projector / Screen**: If the venue has a projector or TV, open `http://localhost:4000/?mode=tv` on a second monitor or Chromecast for the animated vinyl party display!
