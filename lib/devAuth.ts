import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

// Server-side half of dev auth. The password lives only in the DEV_PASSWORD
// env var (.env.local locally, Vercel project settings in prod) and never
// reaches the client bundle. A successful login gets an httpOnly cookie whose
// value is an HMAC derived from the password, so changing DEV_PASSWORD
// invalidates every existing session.

export const DEV_COOKIE = 'zzzendle-dev-session'

function sessionToken(password: string): string {
  return createHmac('sha256', password).update('zzzendle-dev-session').digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/** Returns the session token for a correct password, or null. */
export function checkPassword(pw: unknown): string | null {
  const expected = process.env.DEV_PASSWORD
  if (!expected || typeof pw !== 'string') return null
  return safeEqual(pw, expected) ? sessionToken(expected) : null
}

export function isDevRequest(req: NextRequest): boolean {
  const expected = process.env.DEV_PASSWORD
  const cookie = req.cookies.get(DEV_COOKIE)?.value
  if (!expected || !cookie) return false
  return safeEqual(cookie, sessionToken(expected))
}
