import { eq, and, or, isNull, sql } from "drizzle-orm";
import {
  getCurrentlyPlaying,
  addTrackToPlaylist,
  getPlaylistTracks,
  getAccessToken,
  type TrackInfo,
} from "@spotify-history/lib/spotify";
import dotenv from "dotenv";
import { createDb, historySessions } from "@spotify-history/lib/db";

dotenv.config({ path: "../.env", quiet: true });

const db = createDb();

// Check interval in milliseconds (10 seconds)
const CHECK_INTERVAL_MS = 10_000;

interface UserTrackState {
  userId: string;
  sessionId: string;
  currentTrack: TrackInfo | null;
  previousTrack: TrackInfo | null;
  seenCount: number;
  existingTracks: Set<string>; // Set of track URIs already in the playlist
}

// Single buffer to track user track states
const trackStateBuffer: Map<string, UserTrackState> = new Map();

async function getActiveSessions() {
  const now = Date.now();

  const activeSessions = await db
    .select({
      id: historySessions.id,
      userId: historySessions.userId,
      playlistId: historySessions.playlistId,
      name: historySessions.name,
      createdAt: historySessions.createdAt,
      activeDuration: historySessions.activeDuration,
    })
    .from(historySessions)
    .where(
      and(
        eq(historySessions.isActive, true),
        or(
          isNull(historySessions.activeDuration),
          sql`${historySessions.createdAt} + ${historySessions.activeDuration} > ${now}`,
        ),
      ),
    );

  return activeSessions;
}

async function processSession(session: {
  id: string;
  userId: string;
  playlistId: string;
  name: string;
  createdAt: Date;
  activeDuration: number | null;
}) {
  const { id: sessionId, userId, playlistId, name } = session;
  const key = `${userId}-${sessionId}`;

  // Get access token
  const accessToken = await getAccessToken(userId);
  if (!accessToken) {
    return;
  }

  // Get currently playing track
  const currentTrack = await getCurrentlyPlaying(accessToken);

  // Get previous state from buffer
  let previousState = trackStateBuffer.get(key);

  // If first time seeing this session, load existing playlist tracks
  if (!previousState) {
    console.log(
      `First time seeing session ${name}, loading existing playlist tracks...`,
    );
    const existingTracks = await getPlaylistTracks(accessToken, playlistId);
    console.log(`Loaded ${existingTracks.size} existing tracks from playlist`);

    previousState = {
      userId,
      sessionId,
      currentTrack: null,
      previousTrack: null,
      seenCount: 0,
      existingTracks,
    };
    trackStateBuffer.set(key, previousState);
  }

  if (!currentTrack || !currentTrack.isPlaying) {
    // No track playing or paused - clear state
    trackStateBuffer.set(key, {
      userId,
      sessionId,
      currentTrack: null,
      previousTrack: previousState.currentTrack || null,
      seenCount: 0,
      existingTracks: previousState.existingTracks,
    });
    return;
  }

  // Check if this is the same track as before
  if (previousState.currentTrack?.uri === currentTrack.uri) {
    // Same track, increment seen count
    const newSeenCount = previousState.seenCount + 1;

    // Add to playlist if we've seen it twice and it's not already in the playlist
    if (
      newSeenCount >= 2 &&
      !previousState.existingTracks.has(currentTrack.uri)
    ) {
      console.log(
        `Adding track to playlist: ${currentTrack.name} by ${currentTrack.artists} (Session: ${name})`,
      );
      const success = await addTrackToPlaylist(
        accessToken,
        playlistId,
        currentTrack.uri,
      );

      if (success) {
        console.log(`✓ Successfully added track to playlist ${playlistId}`);
        // Add to existing tracks set
        previousState.existingTracks.add(currentTrack.uri);
        trackStateBuffer.set(key, {
          userId,
          sessionId,
          currentTrack,
          previousTrack: currentTrack,
          seenCount: newSeenCount,
          existingTracks: previousState.existingTracks,
        });
      } else {
        // Keep trying
        trackStateBuffer.set(key, {
          userId,
          sessionId,
          currentTrack,
          previousTrack: previousState.previousTrack,
          seenCount: newSeenCount,
          existingTracks: previousState.existingTracks,
        });
      }
    } else {
      // Same track, but either not seen twice yet or already in playlist
      trackStateBuffer.set(key, {
        userId,
        sessionId,
        currentTrack,
        previousTrack: previousState.previousTrack,
        seenCount: newSeenCount,
        existingTracks: previousState.existingTracks,
      });
    }
  } else {
    // Different track, reset state
    trackStateBuffer.set(key, {
      userId,
      sessionId,
      currentTrack,
      previousTrack: previousState.currentTrack || null,
      seenCount: 1, // First time seeing this track
      existingTracks: previousState.existingTracks,
    });
  }
}

async function tick() {
  console.log(`[${new Date().toISOString()}] Checking active sessions...`);

  try {
    const activeSessions = await getActiveSessions();
    console.log(`Found ${activeSessions.length} active session(s)`);

    // Build set of active session keys
    const activeSessionKeys = new Set(
      activeSessions.map((session) => `${session.userId}-${session.id}`),
    );

    // Remove ended sessions from buffer
    for (const key of trackStateBuffer.keys()) {
      if (!activeSessionKeys.has(key)) {
        console.log(`Removing ended session from buffer: ${key}`);
        trackStateBuffer.delete(key);
      }
    }

    // Process each active session
    for (const session of activeSessions) {
      await processSession(session);
    }
  } catch (error) {
    console.error("Error during tick:", error);
  }
}

async function main() {
  console.log("🎵 Spotify history tracker worker started");
  console.log(
    `Checking for active sessions every ${CHECK_INTERVAL_MS / 1000} seconds...\n`,
  );

  // Run immediately on start
  await tick();

  // Then run on interval
  setInterval(tick, CHECK_INTERVAL_MS);
}

main().catch(console.error);
