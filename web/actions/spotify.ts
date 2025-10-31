"use server";

import { auth } from "@/auth";
import { getAccessToken as getAccessTokenFromLib } from "@spotify-history/lib/spotify";

async function getAccessToken() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const accessToken = await getAccessTokenFromLib(session.user.id);

  if (!accessToken) {
    throw new Error("No Spotify account found");
  }

  return accessToken;
}

export async function getUserPlaylists() {
  const accessToken = await getAccessToken();

  const response = await fetch(
    "https://api.spotify.com/v1/me/playlists?limit=50",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Spotify API Error (Get Playlists):", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    throw new Error(
      `Failed to fetch playlists: ${response.status} ${response.statusText} - ${errorBody}`,
    );
  }

  const data = await response.json();

  return data.items.map((playlist: any) => ({
    id: playlist.id,
    name: playlist.name,
    imageUrl: playlist.images?.[0]?.url,
  }));
}

export async function createSpotifyPlaylist(name: string) {
  const session = await auth();
  const accessToken = await getAccessToken();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get Spotify user ID
  const userResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to fetch user info");
  }

  const userData = await userResponse.json();

  // Create playlist
  const response = await fetch(
    `https://api.spotify.com/v1/users/${userData.id}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description: "Created by Spotify History Tracker",
        public: false,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Spotify API Error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    throw new Error(
      `Failed to create playlist: ${response.status} ${response.statusText} - ${errorBody}`,
    );
  }

  const playlist = await response.json();

  return {
    id: playlist.id,
    name: playlist.name,
  };
}

export async function getPlaylistTracksWithMetadata(playlistId: string) {
  const session = await auth();
  const accessToken = await getAccessToken();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const tracks: Array<{
    id: string;
    name: string;
    artists: string;
    album: string;
    albumArt?: string;
    duration: number;
    addedAt: string;
  }> = [];

  try {
    let url: string | null =
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;

    while (url) {
      // Weird TypeScript bug
      const fetchUrl = url as string;
      const response = await fetch(fetchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `Failed to fetch playlist tracks: ${response.status} - ${errorBody}`,
        );
        break;
      }

      const data = await response.json();

      for (const item of data.items) {
        if (item.track) {
          tracks.push({
            id: item.track.id,
            name: item.track.name,
            artists: item.track.artists.map((a: any) => a.name).join(", "),
            album: item.track.album.name,
            albumArt: item.track.album.images?.[0]?.url,
            duration: item.track.duration_ms,
            addedAt: item.added_at,
          });
        }
      }

      url = data.next;
    }
  } catch (error) {
    console.error("Error fetching playlist tracks:", error);
    throw error;
  }

  return tracks;
}
