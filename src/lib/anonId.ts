import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "ab_anon_id";

export async function getOrCreateAnonId() {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;

  if (existing) return existing;

  const anonId = crypto.randomUUID();
  store.set(COOKIE_NAME, anonId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return anonId;
}
