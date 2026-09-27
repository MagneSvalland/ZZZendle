import { NextRequest, NextResponse } from 'next/server'
import { DEV_COOKIE, checkPassword, isDevRequest } from '@/lib/devAuth'

export const dynamic = 'force-dynamic'

// GET: is this browser logged in? POST: log in. DELETE: log out.

export async function GET(req: NextRequest) {
  return NextResponse.json({ isDevAuth: isDevRequest(req) })
}

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))
  const token = checkPassword(password)
  if (!token) return NextResponse.json({ ok: false }, { status: 401 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(DEV_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(DEV_COOKIE)
  return res
}
