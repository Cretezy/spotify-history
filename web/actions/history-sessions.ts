"use server";

import { auth } from "@/auth";
import { db, historySessions } from "@spotify-history/lib/db";
import { eq, and, or, isNull, sql } from "drizzle-orm";

export async function getActiveHistorySession() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const now = Date.now();

  // Find an active session that:
  // 1. Is marked as active
  // 2. Has no duration (null) OR hasn't expired yet
  const activeSessions = await db
    .select()
    .from(historySessions)
    .where(
      and(
        eq(historySessions.userId, session.user.id),
        eq(historySessions.isActive, true),
        or(
          isNull(historySessions.activeDuration),
          sql`${historySessions.createdAt} + ${historySessions.activeDuration} > ${now}`,
        ),
      ),
    )
    .limit(1);

  return activeSessions[0] || null;
}

export async function createHistorySession(data: {
  name: string;
  playlistId: string;
  activeDuration?: number | null;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Deactivate any existing active sessions for this user
  await db
    .update(historySessions)
    .set({ isActive: false })
    .where(
      and(
        eq(historySessions.userId, session.user.id),
        eq(historySessions.isActive, true),
      ),
    );

  // Create new session
  const newSession = await db
    .insert(historySessions)
    .values({
      name: data.name,
      userId: session.user.id,
      playlistId: data.playlistId,
      activeDuration: data.activeDuration,
    })
    .returning();

  return newSession[0];
}

export async function stopHistorySession(sessionId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await db
    .update(historySessions)
    .set({ isActive: false })
    .where(
      and(
        eq(historySessions.id, sessionId),
        eq(historySessions.userId, session.user.id),
      ),
    );

  return { success: true };
}
