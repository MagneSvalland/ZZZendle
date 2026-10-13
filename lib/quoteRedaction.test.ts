import { describe, it, expect } from 'vitest'
import { getQuoteSegments, quoteHasGiveaway } from './quoteRedaction'
import type { Agent } from './types'

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'jane-doe',
    name: 'Jane Doe',
    rank: 'A',
    attribute: 'Fire',
    specialty: 'Attack',
    faction: 'Victoria',
    release_date: '2026-06-20',
    release_version: '1.0',
    gender: 'Female',
    icon_image: null,
    splash_image: null,
    splash_focus: null,
    quotes: [],
    emojis: [],
    ...overrides,
  }
}

describe('getQuoteSegments / quoteHasGiveaway', () => {
  it('redacts the agent\'s full name when it appears in the quote', () => {
    const agent = makeAgent()
    const quote = 'They call me Jane Doe for a reason.'
    const segments = getQuoteSegments(agent, quote)
    expect(quoteHasGiveaway(agent, quote)).toBe(true)
    const redacted = segments.filter(s => s.redacted).map(s => s.text)
    expect(redacted).toContain('Jane Doe')
  })

  it('redacts just the first or last name alone', () => {
    const agent = makeAgent({ name: 'Jane Doe' })
    expect(quoteHasGiveaway(agent, 'Jane always finishes what she starts.')).toBe(true)
  })

  it('redacts the id with hyphens turned into spaces', () => {
    const agent = makeAgent({ id: 'starlight-billy', name: 'Billy' })
    expect(quoteHasGiveaway(agent, 'Some call me starlight billy.')).toBe(true)
  })

  it('does not flag a quote with no giveaway tokens', () => {
    const agent = makeAgent()
    const quote = 'A storm is coming, and I will be ready.'
    expect(quoteHasGiveaway(agent, quote)).toBe(false)
    expect(getQuoteSegments(agent, quote)).toEqual([{ text: quote, redacted: false }])
  })

  it('does not redact short name fragments (<= 2 chars) as standalone words', () => {
    // "Al" as a 2-char fragment shouldn't be redacted as a giveaway on its own,
    // but the full name still should be.
    const agent = makeAgent({ name: 'Al Vance' })
    const quote = 'Alright, let\'s go. — Al Vance'
    const segments = getQuoteSegments(agent, quote)
    const redactedTexts = segments.filter(s => s.redacted).map(s => s.text)
    expect(redactedTexts).toContain('Al Vance')
    // "Alright" must not be partially redacted as "Al" + "right"
    expect(segments.map(s => s.text).join('')).toBe(quote)
  })

  it('does not cross word boundaries (e.g. "Ann" inside "Anna")', () => {
    const agent = makeAgent({ name: 'Ann' })
    const quote = 'Anna is not the same as me.'
    // "Ann" must not match inside "Anna" — nothing here should get redacted.
    expect(quoteHasGiveaway(agent, quote)).toBe(false)
    expect(getQuoteSegments(agent, quote)).toEqual([{ text: quote, redacted: false }])
  })

  it('is case-insensitive', () => {
    const agent = makeAgent({ name: 'Jane Doe' })
    expect(quoteHasGiveaway(agent, 'jane doe is who I am.')).toBe(true)
  })

  it('handles an empty quote', () => {
    const agent = makeAgent()
    expect(getQuoteSegments(agent, '')).toEqual([{ text: '', redacted: false }])
    expect(quoteHasGiveaway(agent, '')).toBe(false)
  })

  it('preserves the full original text when segments are joined back together', () => {
    const agent = makeAgent({ name: 'Jane Doe' })
    const quote = 'Jane Doe, at your service. Doe by name, doe by nature.'
    const segments = getQuoteSegments(agent, quote)
    expect(segments.map(s => s.text).join('')).toBe(quote)
  })
})

describe('faction redaction', () => {
  it('redacts the full faction name', () => {
    const agent = makeAgent({ faction: 'External Strategy Department' })
    const segments = getQuoteSegments(agent, "I'm head of the External Strategy Department.")
    expect(segments.filter(s => s.redacted).map(s => s.text)).toEqual(['External Strategy Department'])
  })

  it('redacts shorter faction aliases', () => {
    const agent = makeAgent({ faction: 'Victoria Housekeeping Co.' })
    expect(quoteHasGiveaway(agent, 'Rina from Victoria Housekeeping, at your service.')).toBe(true)
    const yunkui = makeAgent({ faction: 'Yunkui Summit' })
    expect(quoteHasGiveaway(yunkui, 'A true Yunkui disciple never gives up.')).toBe(true)
  })

  it('leaves other factions alone', () => {
    const agent = makeAgent({ faction: 'Spook Shack' })
    expect(quoteHasGiveaway(agent, 'Victoria Housekeeping is hiring.')).toBe(false)
  })
})
