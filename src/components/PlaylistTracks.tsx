"use client";

import { useState, useEffect } from "react";
import { getPlaylistTracksWithMetadata } from "@/src/actions/spotify";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Music, RefreshCw } from "lucide-react";

interface Track {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumArt?: string;
  duration: number;
  addedAt: string;
}

interface PlaylistTracksProps {
  playlistId: string;
}

export default function PlaylistTracks({ playlistId }: PlaylistTracksProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadTracks = async () => {
    try {
      const fetchedTracks = await getPlaylistTracksWithMetadata(playlistId);
      setTracks(fetchedTracks);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to load tracks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();

    // Refresh every 30 seconds
    const interval = setInterval(loadTracks, 30000);

    return () => clearInterval(interval);
  }, [playlistId]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Playlist Tracks</CardTitle>
        <CardDescription>
          {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Music className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No tracks in this playlist yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tracks will appear here as they're added automatically
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                {track.albumArt ? (
                  <img
                    src={track.albumArt}
                    alt={track.album}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                    <Music className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{track.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {track.artists}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                  <div>{formatDuration(track.duration)}</div>
                  <div className="text-xs">{formatDate(track.addedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
