import scheduleData from '@/data/schedule.json'
import agentsData from '@/data/agents.json'
import classicOverridesData from '@/data/classic-overrides.json'
import type { Agent } from './types'

const schedule = scheduleData as Record<string, string>
const agents = agentsData as Agent[]
// Manual pins for classic mode (date -> agent id), checked before the seeded
// pick. Applied inside buildPickHistory (not layered on top of it) so the
// pin still counts toward the 30-day cooldown for later dates.
const classicOverrides = classicOverridesData as Record<string, string>

export function getAgentOfTheDay(dateStr: string): Agent | null {
  const agentId = schedule[dateStr]
  if (!agentId) return null
  return agents.find((a) => a.id === agentId) ?? null
}

/** Returns IDs of agents scheduled within the last `days` days (including today). */
export function getRecentAgentIds(days: number): Set<string> {
  const result = new Set<string>()
  const now = new Date()
  for (let i = 0; i <= days; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('en-CA')
    const id = schedule[dateStr]
    if (id) result.add(id)
  }
  return result
}

function seedHash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
    h >>>= 0
  }
  return h
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA')
}

const COOLDOWN_DAYS = 30
// Always start from launch so every date shares the same historical context.
const LAUNCH_DATE = '2026-06-20'

interface DayPicks { classic: Agent | null; emoji: Agent | null; quote: Agent | null }

/**
 * Builds cooldown-aware picks from LAUNCH_DATE up to and including targetDate.
 * Starting from a fixed origin guarantees every date is globally consistent —
 * calling this for any target always produces the same pick for any given day.
 * O(days_since_launch × COOLDOWN_DAYS) — fast for years.
 */
function buildPickHistory(targetDate: string): Map<string, DayPicks> {
  const history = new Map<string, DayPicks>()
  let d = LAUNCH_DATE

  while (d <= targetDate) {
    const splashId = schedule[d]
    const available = agents.filter(a => !a.available_from || a.available_from <= d)

    const classicRecent = new Set<string>()
    const emojiRecent   = new Set<string>()
    const quoteRecent   = new Set<string>()
    for (let j = 1; j <= COOLDOWN_DAYS; j++) {
      const prev = history.get(addDays(d, -j))
      if (prev?.classic) classicRecent.add(prev.classic.id)
      if (prev?.emoji)   emojiRecent.add(prev.emoji.id)
      if (prev?.quote)   quoteRecent.add(prev.quote.id)
    }

    const cPool  = available.filter(a => a.id !== splashId && !classicRecent.has(a.id))
    const cFinal = cPool.length > 0 ? cPool : available.filter(a => a.id !== splashId)
    const seededClassic = cFinal[seedHash(d + 'classic') % cFinal.length] ?? null
    const classic = classicOverrides[d]
      ? agents.find(a => a.id === classicOverrides[d]) ?? seededClassic
      : seededClassic

    const ePool  = available.filter(a => a.id !== splashId && a.id !== classic?.id && !emojiRecent.has(a.id))
    const eFinal = ePool.length > 0 ? ePool : available.filter(a => a.id !== splashId && a.id !== classic?.id)
    const emoji  = eFinal[seedHash(d + 'emoji') % eFinal.length] ?? null

    const qPool  = available.filter(a => a.quote && a.id !== splashId && a.id !== classic?.id && a.id !== emoji?.id && !quoteRecent.has(a.id))
    const qFinal = qPool.length > 0 ? qPool : available.filter(a => a.quote && a.id !== splashId && a.id !== classic?.id && a.id !== emoji?.id)
    const quote  = qFinal[seedHash(d + 'quote') % qFinal.length] ?? null

    history.set(d, { classic, emoji, quote })
    d = addDays(d, 1)
  }

  return history
}

/**
 * Returns a deterministic, mode-specific agent for the given date.
 * Splash uses the manually curated schedule.
 * Classic/emoji/quote use a seeded pick with a 30-day cooldown so
 * the same agent cannot repeat within the window across each mode.
 */
export function getAgentForMode(mode: string, dateStr: string): Agent | null {
  const splashId = schedule[dateStr]

  if (mode === 'splash') {
    return splashId ? agents.find(a => a.id === splashId) ?? null : null
  }

  const history = buildPickHistory(dateStr)
  const today   = history.get(dateStr)

  if (mode === 'classic') return today?.classic ?? null
  if (mode === 'emoji')   return today?.emoji   ?? null
  if (mode === 'quote')   return today?.quote   ?? null

  return null
}
