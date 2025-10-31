import { db } from "../db/index.ts";
import { accounts } from "../db/schema.ts";
import { eq } from "drizzle-orm";

interface TokenData {
  access_token: string;
  refresh_token: string | null;
  expires_at: number | null;
}

async function refreshAccessToken(
  userId: string,
  refreshToken: string,
): Promise<string> {
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.AUTH_SPOTIFY_ID}:${process.env.AUTH_SPOTIFY_SECRET}`,
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Failed to refresh token:", response.status, errorBody);
      throw new Error("Failed to refresh access token");
    }

    const data: any = await response.json();

    // Calculate expiration timestamp (in seconds)
    const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

    // Update the token in the database
    await db
      .update(accounts)
      .set({
        access_token: data.access_token,
        expires_at: expiresAt,
        // Update refresh token if a new one was provided
        ...(data.refresh_token && { refresh_token: data.refresh_token }),
      })
      .where(eq(accounts.userId, userId));

    console.log(`Refreshed access token for user ${userId}`);
    return data.access_token;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
}

async function refreshTokenIfExpired(
  userId: string,
  tokenData: TokenData,
): Promise<string> {
  const { access_token, refresh_token, expires_at } = tokenData;

  // If no expiration time, assume token is valid
  if (!expires_at) {
    return access_token;
  }

  // Check if token is expired or will expire in the next 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const bufferTime = 300; // 5 minutes in seconds

  if (expires_at - now < bufferTime) {
    console.log(
      `Token expired or expiring soon for user ${userId}, refreshing...`,
    );

    if (!refresh_token) {
      throw new Error("No refresh token available");
    }

    return await refreshAccessToken(userId, refresh_token);
  }

  return access_token;
}

export async function getAccessToken(userId: string): Promise<string | null> {
  try {
    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1);

    if (!account[0] || !account[0].access_token) {
      console.error(`No access token found for user ${userId}`);
      return null;
    }

    const tokenData: TokenData = {
      access_token: account[0].access_token,
      refresh_token: account[0].refresh_token,
      expires_at: account[0].expires_at,
    };

    const validToken = await refreshTokenIfExpired(userId, tokenData);
    return validToken;
  } catch (error) {
    console.error(`Error getting access token for user ${userId}:`, error);
    return null;
  }
}
