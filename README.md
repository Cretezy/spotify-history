# [Spotify History Tracker](https://spotify-history.cretezy.com)

An automatic Spotify listening history tracker that saves your currently playing songs to a playlist in real-time.

[View the website here](https://spotify-history.cretezy.com)

## What It Does

Spotify History Tracker creates "history sessions" that automatically track what you're listening to on Spotify and adds those tracks to a playlist. Think of it as your personal listening journal that updates itself. Useful for sharing what was listened to at a party!

**Key Features:**

- ⏱️ Automatically adds songs you're currently playing to a playlist after listening for 20+ seconds
- 🚫 Duplicate detection - won't add the same song twice
- ⏰ Time-limited sessions (1h, 3h, 6h, 12h, 24h)
- 📊 Live playlist view

## How It Works

The application runs two processes:

1. **Next.js Web App**: User interface for creating/managing history sessions and viewing tracked songs
2. **Background Server**: Polls the Spotify API every 10 seconds to check what you're currently playing

**Tracking Logic:**

- Every 10 seconds, the server checks your currently playing track
- If the same track is seen twice in a row (~10 seconds), it's added to the playlist
- Tracks already in the playlist are never added again (even after server restarts)
- When a session ends or is stopped, tracking automatically stops

## Tech Stack

### Frontend

- **Next.js/React** - Front-end framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Lucide React** - Icons

### Backend

- **Next.js** - Backend API
- **Auth.js** - Authentication with Spotify OAuth
- **Drizzle ORM** - Type-safe database queries
- **SQLite** - Database (via libsql)

### Background/Worker Server

- **Node.js** - Runtime
- **Spotify Web API** - Currently playing & playlist management

## Prerequisites

- Node.js
- pnpm (recommended) or npm
- Spotify Developer Account

## Setup

### 1. Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://127.0.0.1:3000/api/auth/callback/spotify` (or your deployed URI)
4. Note your Client ID and Client Secret

### 2. Clone and Install

```bash
git clone https://github.com/Cretezy/spotify-history.git
cd spotify-history
pnpm install
```

### 3. Configure Environment

Create `.env.local`:

```env
# Auth.js
AUTH_SECRET="<generate with: openssl rand -base64 32>"
AUTH_URL=http://127.0.0.1:3000/api/auth

# Spotify OAuth
AUTH_SPOTIFY_ID=<your-spotify-client-id>
AUTH_SPOTIFY_SECRET=<your-spotify-client-secret>

# Database
DB_FILE_NAME=file:local.db
```

### 4. Setup Database

```bash
# Generate and apply migrations
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

## Running Locally

```bash
pnpm dev
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000). This will run the Next.js app and the tracking worker concurrently.

## Running with Docker

A pre-built image is available at `ghcr.io/cretezy/spotify-history`.

### Build the Image

```bash
docker build -t spotify-history .
```

### Run the Container

```bash
docker run -p 3000:3000 \
  -e AUTH_SECRET="your-secret-here" \
  -e AUTH_SPOTIFY_ID="your-spotify-client-id" \
  -e AUTH_SPOTIFY_SECRET="your-spotify-client-secret" \
  -e AUTH_URL="http://127.0.0.1:3000/api/auth" \
  -e DB_FILE_NAME="file:/app/data/local.db" \
  -v $(pwd)/data:/app/data \
  ghcr.io/cretezy/spotify-history
```

The Docker container runs both the Next.js app and tracking worker automatically.

## Usage

1. **Sign In**: Log in with your Spotify account
2. **Create Session**: Click "Create History Session"
   - Choose a name (auto-generated with timestamp)
   - Select existing playlist or create new one
   - Set duration (1-24 hours)
3. **Start Listening**: Play music on Spotify
4. **Watch It Track**: Songs appear in the playlist after ~10 seconds
5. **View Live**: Playlist tracks list refreshes every 30 seconds
6. **Stop Session**: Click "Stop Session" when done

## Development

### Available Scripts

```bash
pnpm dev           # Start Next.js dev server and tracking worker (in watch mode)
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run ESLint
pnpm format        # Format all files with Prettier
pnpm format:check  # Check formatting without modifying
```

### Database Commands

```bash
pnpm drizzle-kit generate   # Generate migrations
pnpm drizzle-kit push       # Apply migrations
pnpm drizzle-kit studio     # Open Drizzle Studio
```

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT

## Acknowledgements

This project is not associated with Spotify. It uses the Spotify Web API to track listening history and manage playlists. All Spotify trademarks are property of their respective owners.
