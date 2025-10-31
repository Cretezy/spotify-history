import { getActiveHistorySession } from "@/actions/history-sessions";
import { auth } from "@/auth";
import CreateSessionButton from "@/components/CreateSessionButton";
import ActiveSession from "@/components/ActiveSession";
import SignIn from "@/components/SignIn";
import SignOut from "@/components/SignOut";
import PlaylistTracks from "@/components/PlaylistTracks";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans">
        <SignIn />
      </div>
    );
  }

  const activeHistorySession = await getActiveHistorySession();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl p-6 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Spotify History
            </h1>
            <p className="mt-2 text-muted-foreground">
              Track your listening history automatically
            </p>
          </div>
          <SignOut />
        </header>

        <main className="space-y-6">
          {activeHistorySession ? (
            <>
              <ActiveSession session={activeHistorySession} />
              <PlaylistTracks playlistId={activeHistorySession.playlistId} />
            </>
          ) : (
            <CreateSessionButton />
          )}
        </main>
      </div>
    </div>
  );
}
