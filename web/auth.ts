import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Spotify from "next-auth/providers/spotify";
import { db } from "@spotify-history/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  trustHost: true,
  providers: [
    Spotify({
      clientId: process.env.AUTH_SPOTIFY_ID,
      clientSecret: process.env.AUTH_SPOTIFY_SECRET,
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: {
          scope: [
            "user-read-email",
            "playlist-read-private",
            "playlist-modify-private",
            "playlist-modify-public",
            "user-read-currently-playing",
            "user-read-playback-state",
          ].join(" "),
        },
      },
    }),
  ],
});
