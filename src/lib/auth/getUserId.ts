import { auth } from '@/lib/auth'
import { getOrCreateAnonId } from '@/lib/anonId'

/**
 * Returns the authenticated user's ID, or falls back to anon cookie.
 * Use this everywhere instead of getOrCreateAnonId() directly.
 */
export async function getUserId(): Promise<string> {
  const session = await auth()
  if (session?.user?.id) return session.user.id
  return getOrCreateAnonId()
}
