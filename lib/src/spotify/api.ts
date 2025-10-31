export interface TrackInfo {
  uri: string;
  name: string;
  artists: string;
  isPlaying: boolean;
  progressMs: number;
}

export async function getCurrentlyPlaying(
  accessToken: string,
): Promise<TrackInfo | null> {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (response.status === 204 || !response.ok) {
      // No track currently playing or error
      return null;
    }

    const data: any = await response.json();

    if (!data.item) {
      return null;
    }

    return {
      uri: data.item.uri,
      name: data.item.name,
      artists: data.item.artists.map((a: any) => a.name).join(", "),
      isPlaying: data.is_playing,
      progressMs: data.progress_ms,
    };
  } catch (error) {
    console.error("Error fetching currently playing:", error);
    return null;
  }
}

export async function addTrackToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUri: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [trackUri],
          position: 0, // Add to the beginning of the playlist
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Failed to add track to playlist: ${response.status} - ${errorBody}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error adding track to playlist:", error);
    return false;
  }
}

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
): Promise<Set<string>> {
  const trackUris = new Set<string>();

  try {
    let url: string | null =
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(uri)),next&limit=100`;

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

      const data: any = await response.json();

      // Add track URIs to set
      for (const item of data.items) {
        if (item.track?.uri) {
          trackUris.add(item.track.uri);
        }
      }

      // Handle pagination
      url = data.next;
    }
  } catch (error) {
    console.error("Error fetching playlist tracks:", error);
  }

  return trackUris;
}
