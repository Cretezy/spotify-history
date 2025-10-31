"use client";

import { useState } from "react";
import { stopHistorySession } from "@/actions/history-sessions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, StopCircle, Clock, Music } from "lucide-react";

interface ActiveSessionProps {
  session: {
    id: string;
    name: string;
    playlistId: string;
    createdAt: Date;
    activeDuration: number | null;
    isActive: boolean;
  };
}

export default function ActiveSession({ session }: ActiveSessionProps) {
  const [isStopping, setIsStopping] = useState(false);
  const router = useRouter();

  const handleStop = async () => {
    if (!confirm("Are you sure you want to stop this session?")) {
      return;
    }

    setIsStopping(true);
    try {
      await stopHistorySession(session.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to stop session:", error);
      alert("Failed to stop session. Please try again.");
    } finally {
      setIsStopping(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return "Forever";
    const hours = ms / 3600000;
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  };

  const getTimeRemaining = () => {
    if (session.activeDuration === null) return null;
    const endTime =
      new Date(session.createdAt).getTime() + session.activeDuration;
    const remaining = endTime - Date.now();

    if (remaining <= 0) return "Expired";

    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return `${hours}h ${minutes}m remaining`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{session.name}</CardTitle>
          <Badge variant="default" className="bg-green-600  text-white">
            <div className="mr-1 h-2 w-2 rounded-full bg-white animate-pulse" />
            ACTIVE
          </Badge>
        </div>
        <CardDescription className="text-green-700 dark:text-green-300">
          Started {formatDate(session.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center gap-3 text-sm">
            <Music className="h-4 w-4 text-green-700 dark:text-green-300" />
            <div>
              <div className="font-medium text-green-900 dark:text-green-100">
                Playlist
              </div>
              <a
                href={`https://open.spotify.com/playlist/${session.playlistId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline underline-offset-4"
              >
                Open in Spotify
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-green-700 dark:text-green-300" />
            <div>
              <div className="font-medium text-green-900 dark:text-green-100">
                Duration
              </div>
              <div className="text-green-700 dark:text-green-300">
                {formatDuration(session.activeDuration)}
                {timeRemaining && ` • ${timeRemaining}`}
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleStop}
          disabled={isStopping}
          variant="destructive"
          className="w-full"
        >
          {isStopping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Stopping...
            </>
          ) : (
            <>
              <StopCircle className="mr-2 h-4 w-4" />
              Stop Session
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
