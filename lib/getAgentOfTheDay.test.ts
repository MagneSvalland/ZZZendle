import { describe, it, expect } from 'vitest'
import { getAgentOfTheDay, getAgentForMode, getQuoteForDay, computePickIds, type FrozenPicks } from './getAgentOfTheDay'
import { getEffectiveDate } from './date'
import agentsData from '@/data/agents.json'
import scheduleData from '@/data/schedule.json'
import classicOverridesData from '@/data/classic-overrides.json'
import dailyPicksData from '@/data/daily-picks.json'
import type { Agent } from './types'

const agents = agentsData as Agent[]
const schedule = scheduleData as Record<string, string>
const classicOverrides = classicOverridesData as Record<string, string>
const dailyPicks = dailyPicksData as FrozenPicks

// A handful of real scheduled dates, sampled from actual data instead of
// hardcoded, so this file keeps working as the schedule grows/rotates.
const scheduledDates = Object.keys(schedule).sort()
const sampleDates = [
  scheduledDates[0],
  scheduledDates[Math.floor(scheduledDates.length / 2)],
  scheduledDates[scheduledDates.length - 1],
]

describe('getAgentOfTheDay', () => {
  it('returns null for a date with no schedule entry', () => {
    expect(getAgentOfTheDay('1999-01-01')).toBeNull()
  })

  it('returns the agent scheduled for a real date', () => {
    for (const d of sampleDates) {
      const expectedId = schedule[d]
      expect(getAgentOfTheDay(d)?.id).toBe(expectedId)
    }
  })

})

describe('getAgentForMode — splash', () => {
  it('mirrors schedule.json exactly', () => {
    for (const d of sampleDates) {
      expect(getAgentForMode('splash', d)?.id).toBe(schedule[d])
    }
  })

  it('is null for an unscheduled date', () => {
    expect(getAgentForMode('splash', '1999-01-01')).toBeNull()
  })

  it('is null for an unknown mode', () => {
    expect(getAgentForMode('not-a-real-mode', sampleDates[0])).toBeNull()
  })
})

describe('getAgentForMode — classic/emoji/quote seeded picks', () => {
  it('is deterministic: the same date always gives the same pick', () => {
    for (const d of sampleDates) {
      const a1 = getAgentForMode('classic', d)
      const a2 = getAgentForMode('classic', d)
      expect(a1?.id).toBe(a2?.id)
    }
  })

  it('never picks the same agent as that day\'s splash agent', () => {
    for (const d of sampleDates) {
      const splashId = schedule[d]
      expect(getAgentForMode('classic', d)?.id).not.toBe(splashId)
      expect(getAgentForMode('emoji', d)?.id).not.toBe(splashId)
      expect(getAgentForMode('quote', d)?.id).not.toBe(splashId)
    }
  })

  it('never gives classic, emoji and quote the same agent on the same day', () => {
    for (const d of sampleDates) {
      const classic = getAgentForMode('classic', d)?.id
      const emoji = getAgentForMode('emoji', d)?.id
      const quote = getAgentForMode('quote', d)?.id
      expect(classic).not.toBe(emoji)
      if (quote) {
        expect(quote).not.toBe(classic)
        expect(quote).not.toBe(emoji)
      }
    }
  })

  it('only ever picks agents that actually exist in agents.json', () => {
    const ids = new Set(agents.map(a => a.id))
    for (const d of sampleDates) {
      for (const mode of ['classic', 'emoji', 'quote'] as const) {
        const pick = getAgentForMode(mode, d)
        if (pick) expect(ids.has(pick.id)).toBe(true)
      }
    }
  })

  it('honors a manual classic-mode pin over the seeded pick', () => {
    for (const [date, agentId] of Object.entries(classicOverrides)) {
      expect(getAgentForMode('classic', date)?.id).toBe(agentId)
    }
  })

  it('does not repeat a classic pick within the 30-day cooldown window', () => {
    // Walk 40 consecutive days from launch — comfortably inside the run of
    // dates where every agent is available (see data/agents.json — only one
    // agent has an available_from gate), so the cooldown pool never has to
    // fall back to ignoring the cooldown for lack of eligible agents.
    const start = scheduledDates[0]
    const picks: string[] = []
    let d = start
    for (let i = 0; i < 40; i++) {
      const id = getAgentForMode('classic', d)?.id
      if (id) picks.push(id)
      const next = new Date(d + 'T12:00:00')
      next.setDate(next.getDate() + 1)
      d = next.toLocaleDateString('en-CA')
    }
    for (let i = 0; i < picks.length; i++) {
      // Cooldown looks back 30 days (j = 1..30), i.e. indices i-1 down to i-30.
      for (let j = Math.max(0, i - 30); j < i; j++) {
        expect(picks[i]).not.toBe(picks[j])
      }
    }
  })
})

describe('quote mode with several quotes per agent', () => {
  const nextDay = (d: string) => {
    const n = new Date(d + 'T12:00:00')
    n.setDate(n.getDate() + 1)
    return n.toLocaleDateString('en-CA')
  }

  it('gives every agent at least one quote', () => {
    for (const a of agents) expect(a.quotes.length, a.name).toBeGreaterThan(0)
  })

  it('keeps the first quote for days before the variants', () => {
    for (const a of agents) expect(getQuoteForDay(a, '2026-10-13')).toBe(a.quotes[0])
  })

  it('never picks an agent before its quotes_from date', () => {
    const late = new Map(agents.filter(a => a.quotes_from).map(a => [a.id, a.quotes_from!]))
    expect(late.size).toBeGreaterThan(0)
    for (let d = '2026-09-01'; d <= '2026-10-13'; d = nextDay(d)) {
      const id = getAgentForMode('quote', d)?.id
      if (id && late.has(id)) expect(d >= late.get(id)!).toBe(true)
    }
  })

  it('rotates through the lines from the variants date on', () => {
    const multi = agents.find(a => a.quotes.length >= 3)!
    const seen = new Set<string>()
    for (let d = '2026-10-14'; d <= '2026-12-31'; d = nextDay(d)) {
      const q = getQuoteForDay(multi, d)
      expect(multi.quotes).toContain(q)
      seen.add(q)
    }
    expect(seen.size).toBe(multi.quotes.length)
  })
})

describe('frozen daily picks', () => {
  const frozenDates = Object.keys(dailyPicks).sort()

  // CI sets CHECK_FROZEN_PICKS only on PRs that touch agents/schedule data —
  // the file going a day stale is harmless until the data changes.
  it.runIf(process.env.CHECK_FROZEN_PICKS)('covers today and tomorrow (ET) — run `npm run freeze-picks` before changing data', () => {
    const tomorrow = new Date(getEffectiveDate() + 'T12:00:00')
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(frozenDates.at(-1)! >= tomorrow.toLocaleDateString('en-CA')).toBe(true)
  })

  it('serves exactly the frozen pick for every frozen date', () => {
    for (const d of frozenDates) {
      expect(getAgentForMode('classic', d)?.id ?? null).toBe(dailyPicks[d].classic)
      expect(getAgentForMode('emoji', d)?.id ?? null).toBe(dailyPicks[d].emoji)
      expect(getAgentForMode('quote', d)?.id ?? null).toBe(dailyPicks[d].quote)
    }
  })

  it('only references agents that exist and never that day\'s splash agent', () => {
    const ids = new Set(agents.map(a => a.id))
    for (const d of frozenDates) {
      for (const id of Object.values(dailyPicks[d])) {
        if (!id) continue
        expect(ids.has(id), `${d}: ${id}`).toBe(true)
        expect(id, `${d} clashes with splash`).not.toBe(schedule[d])
      }
    }
  })

  it('stays put when an agent is added or the splash schedule changes', () => {
    const last = frozenDates.at(-1)!
    const newcomer = { ...agents[0], id: 'newcomer', available_from: frozenDates[0] }
    const reshuffled = Object.fromEntries(Object.keys(schedule).map(d => [d, 'newcomer']))
    const picks = computePickIds(last, {
      agents: [...agents, newcomer],
      schedule: reshuffled,
      classicOverrides,
      frozen: dailyPicks,
    })
    for (const d of frozenDates) expect(picks[d]).toEqual(dailyPicks[d])
  })
})
