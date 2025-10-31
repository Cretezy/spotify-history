"use client";

import { useState, useEffect } from "react";
import { createHistorySession } from "@/actions/history-sessions";
import { getUserPlaylists, createSpotifyPlaylist } from "@/actions/spotify";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

interface Playlist {
  id: string;
  name: string;
  imageUrl?: string;
}

export default function CreateSessionButton() {
  const getDefaultSessionName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `History - ${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(getDefaultSessionName());
  const [playlistOption, setPlaylistOption] = useState<"new" | string>("new");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [duration, setDuration] = useState<"1h" | "3h" | "6h" | "12h" | "24h">(
    "6h",
  );
  const router = useRouter();

  useEffect(() => {
    if (showForm) {
      loadPlaylists();
    }
  }, [showForm]);

  const loadPlaylists = async () => {
    setIsLoadingPlaylists(true);
    try {
      const userPlaylists = await getUserPlaylists();
      setPlaylists(userPlaylists);
    } catch (error) {
      console.error("Failed to load playlists:", error);
      alert("Failed to load playlists. Please try again.");
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      let playlistId: string;

      // If creating a new playlist
      if (playlistOption === "new") {
        const newPlaylist = await createSpotifyPlaylist(name);
        playlistId = newPlaylist.id;
      } else {
        playlistId = playlistOption;
      }

      const durationMs =
        duration === "1h"
          ? 3600000
          : duration === "3h"
            ? 10800000
            : duration === "6h"
              ? 21600000
              : duration === "12h"
                ? 43200000
                : 86400000; // 24h

      await createHistorySession({
        name,
        playlistId,
        activeDuration: durationMs,
      });

      router.refresh();
    } catch (error) {
      console.error("Failed to create session:", error);
      alert("Failed to create session. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!showForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Session</CardTitle>
          <CardDescription>
            Create a history session to start tracking your Spotify listening
            history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowForm(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create History Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create History Session</CardTitle>
        <CardDescription>
          Configure your new listening history tracking session.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Session Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Work Session"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlist">Spotify Playlist</Label>
            {isLoadingPlaylists ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading playlists...
              </div>
            ) : (
              <Select value={playlistOption} onValueChange={setPlaylistOption}>
                <SelectTrigger id="playlist">
                  <SelectValue placeholder="Select a playlist" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="new">Create new playlist</SelectItem>
                  {playlists.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={duration}
              onValueChange={(value) => setDuration(value as typeof duration)}
            >
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="3h">3 Hours</SelectItem>
                <SelectItem value="6h">6 Hours</SelectItem>
                <SelectItem value="12h">12 Hours</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-8">
            <Button type="submit" disabled={isCreating} className="flex-1">
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreating ? "Creating..." : "Create Session"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
