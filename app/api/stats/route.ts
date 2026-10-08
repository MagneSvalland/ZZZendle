import { NextRequest, NextResponse } from 'next/server'
import { redisEnabled, redisPipeline } from '@/lib/redis'
import { HISTORY_DAYS, parseHash, pickSummary } from '@/lib/globalStats'
import { DAILY_MODES } from '@/lib/stats'
import agents from '@/data/agents.json'

export const dynamic = 'force-dynamic'

// Global stats for the result screen.
// POST: record a finished daily game (once per browser, mode and day) and
//       return the summary. GET: just the summary, for revisits.
// Only { average, topPercent, scope } is ever returned, never player counts.

const KEY_TTL_SECONDS = 60 * 60 * 24 * 30
const MAX_GUESSES = agents.length

function etDate(offsetDays = 0): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
  return shiftDate(today, offsetDays)
}

function shiftDate(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const key = (mode: string, date: string) => `stats:${mode}:${date}`
const cookieName = (mode: string) => `zzzendle-stats-${mode}`

interface Input { mode: string; date: string; guesses: number }

// Yesterday is accepted too, for games finished just before the daily reset.
function validate(mode: unknown, date: unknown, guesses: unknown): Input | null {
  if (typeof mode !== 'string' || !(DAILY_MODES as readonly string[]).includes(mode)) return null
  if (date !== etDate() && date !== etDate(-1)) return null
  const g = Number(guesses)
  if (!Number.isInteger(g) || g < 1 || g > MAX_GUESSES) return null
  return { mode, date: date as string, guesses: g }
}

// The free Upstash tier is metered per command, so the week of history is
// only read when today alone is too thin to show anything.
async function summary({ mode, date, guesses }: Input, record: boolean) {
  const writes = record
    ? [['HINCRBY', key(mode, date), guesses, 1], ['EXPIRE', key(mode, date), KEY_TTL_SECONDS]]
    : []
  const results = await redisPipeline([...writes, ['HGETALL', key(mode, date)]])
  const today = parseHash(results[writes.length])
  const fromToday = pickSummary(today, [], guesses)
  if (fromToday) return fromToday

  const history = Array.from({ length: HISTORY_DAYS - 1 }, (_, i) => ['HGETALL', key(mode, shiftDate(date, -(i + 1)))])
  return pickSummary(today, (await redisPipeline(history)).map(parseHash), guesses)
}

export async function GET(req: NextRequest) {
  if (!redisEnabled()) return NextResponse.json({ enabled: false })
  const p = req.nextUrl.searchParams
  const input = validate(p.get('mode'), p.get('date'), p.get('guesses'))
  if (!input) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  try {
    const res = NextResponse.json({ enabled: true, summary: await summary(input, false) })
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return res
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  if (!redisEnabled()) return NextResponse.json({ enabled: false })
  const body = await req.json().catch(() => ({}))
  const input = validate(body.mode, body.date, body.guesses)
  if (!input) return NextResponse.json({ error: 'bad request' }, { status: 400 })

  // Not cheat-proof (a script can skip cookies), just keeps refreshes and
  // replays from a normal browser from counting twice.
  const alreadyRecorded = req.cookies.get(cookieName(input.mode))?.value === input.date
  try {
    const res = NextResponse.json({ enabled: true, summary: await summary(input, !alreadyRecorded) })
    res.cookies.set(cookieName(input.mode), input.date, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/stats',
      maxAge: 60 * 60 * 48,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
