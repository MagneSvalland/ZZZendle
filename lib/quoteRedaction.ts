import type { Agent } from './types'

export interface QuoteSegment {
  text: string
  redacted: boolean
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Shorter ways agents refer to their own faction, on top of its full name.
const FACTION_ALIASES: Record<string, string[]> = {
  'Victoria Housekeeping Co.': ['Victoria Housekeeping', 'Victoria'],
  'Belobog Heavy Industries': ['Belobog Industries', 'Belobog'],
  'Hollow Special Operations Section 6': ['Section 6'],
  'Stars of Lyra': ['Lyra'],
  'Krampus Compliance Authority': ['Krampus'],
  'Sons of Calydon': ['Calydon'],
  'Criminal Investigation Special Response Team': ['Criminal Investigation'],
  'Yunkui Summit': ['Yunkui'],
  'Obol Squad': ['Obol'],
  'Defense Force - Silver Squad': ['Silver Squad'],
  'Covenant of Dayat': ['Dayat'],
  'Airspace Patrol Department': ['Airspace Patrol'],
  'Flint Workshop': ['Flint'],
}

/** Words/phrases in an agent's own quote that would give away who's speaking. */
function getGiveawayTokens(agent: Agent): string[] {
  const tokens = new Set<string>()

  tokens.add(agent.name)
  if (agent.id) tokens.add(agent.id.replace(/-/g, ' '))

  for (const part of agent.name.split(/\s+/)) {
    const clean = part.replace(/[^a-zA-Z]/g, '')
    if (clean.length > 2) tokens.add(clean)
  }

  if (agent.faction) {
    tokens.add(agent.faction)
    for (const alias of FACTION_ALIASES[agent.faction] ?? []) tokens.add(alias)
  }

  // Longest first so multi-word matches (e.g. full name) win over single words.
  return [...tokens].sort((a, b) => b.length - a.length)
}

/**
 * Splits one of the agent's quotes into plain and "redacted" segments, where
 * the redacted parts are words that would directly give away the speaker's
 * identity (their name, surname, nickname, or faction).
 */
export function getQuoteSegments(agent: Agent, quote: string): QuoteSegment[] {
  const tokens = getGiveawayTokens(agent).filter(Boolean)
  if (tokens.length === 0 || !quote) return [{ text: quote, redacted: false }]

  const pattern = new RegExp(`\\b(${tokens.map(escapeRegExp).join('|')})\\b`, 'gi')

  const segments: QuoteSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(quote)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: quote.slice(lastIndex, match.index), redacted: false })
    }
    segments.push({ text: match[0], redacted: true })
    lastIndex = match.index + match[0].length
    // Avoid infinite loop on zero-length matches.
    if (match[0].length === 0) pattern.lastIndex++
  }
  if (lastIndex < quote.length) {
    segments.push({ text: quote.slice(lastIndex), redacted: false })
  }
  return segments
}

export function quoteHasGiveaway(agent: Agent, quote: string): boolean {
  return getQuoteSegments(agent, quote).some((s) => s.redacted)
}
