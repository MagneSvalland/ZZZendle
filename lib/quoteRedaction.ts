import type { Agent } from './types'

export interface QuoteSegment {
  text: string
  redacted: boolean
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

  // Longest first so multi-word matches (e.g. full name) win over single words.
  return [...tokens].sort((a, b) => b.length - a.length)
}

/**
 * Splits an agent's quote into plain and "redacted" segments, where the
 * redacted parts are words that would directly give away the speaker's
 * identity (their name, surname, or nickname).
 */
export function getQuoteSegments(agent: Agent): QuoteSegment[] {
  const quote = agent.quote ?? ''
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

export function quoteHasGiveaway(agent: Agent): boolean {
  return getQuoteSegments(agent).some((s) => s.redacted)
}
