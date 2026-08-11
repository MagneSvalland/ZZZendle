import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

// Always read fresh from disk — no route caching. The admin panel's
// gap-detection used to rely on schedule.json's build-time static import,
// which could go stale relative to what's actually on disk after another
// session (or a direct file edit) changed it. This endpoint is the fix:
// the client fetches current data at runtime instead of trusting the bundle.
export const dynamic = 'force-dynamic'

export async function GET() {
  const root = path.join(process.cwd())
  const [schedule, splashConfig] = await Promise.all([
    readFile(path.join(root, 'data', 'schedule.json'), 'utf-8').then(JSON.parse),
    readFile(path.join(root, 'data', 'splash-config.json'), 'utf-8').then(JSON.parse),
  ])
  return NextResponse.json(
    { schedule, splashConfig },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
