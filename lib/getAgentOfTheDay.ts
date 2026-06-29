import scheduleData from '@/data/schedule.json'
import agentsData from '@/data/agents.json'
import type { Agent } from './types'

const schedule = scheduleData as Record<string, string>
const agents = agentsData as Agent[]

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

/**
 * Returns a deterministic, mode-specific agent for the given date.
 * Classic & Splash use the schedule. Emoji & Quote get a seeded pick
 * from the remaining pool so all three modes show different agents.
 */
export function getAgentForMode(mode: string, dateStr: string): Agent | null {
  // schedule.json is the manually curated splash schedule
  const splashId = schedule[dateStr]

  if (mode === 'splash') {
    return splashId ? agents.find(a => a.id === splashId) ?? null : null
  }

  // Classic, emoji, quote are all seeded random — each excluding the splash agent
  if (mode === 'classic') {
    const pool = agents.filter(a => a.id !== splashId)
    if (pool.length === 0) return null
    return pool[seedHash(dateStr + 'classic') % pool.length]
  }

  if (mode === 'emoji') {
    const classicPool = agents.filter(a => a.id !== splashId)
    const classicAgent = classicPool.length > 0 ? classicPool[seedHash(dateStr + 'classic') % classicPool.length] : null
    const pool = agents.filter(a => a.id !== splashId && a.id !== classicAgent?.id)
    if (pool.length === 0) return null
    return pool[seedHash(dateStr + 'emoji') % pool.length]
  }

  if (mode === 'quote') {
    const classicPool = agents.filter(a => a.id !== splashId)
    const classicAgent = classicPool.length > 0 ? classicPool[seedHash(dateStr + 'classic') % classicPool.length] : null
    const emojiPool = agents.filter(a => a.id !== splashId && a.id !== classicAgent?.id)
    const emojiAgent = emojiPool.length > 0 ? emojiPool[seedHash(dateStr + 'emoji') % emojiPool.length] : null
    const pool = agents.filter(a => a.id !== splashId && a.id !== classicAgent?.id && a.id !== emojiAgent?.id)
    if (pool.length === 0) return null
    return pool[seedHash(dateStr + 'quote') % pool.length]
  }

  return null
}
