import { describe, it, expect } from 'vitest'
import { getQuoteSegments, quoteHasGiveaway } from './quoteRedaction'
import type { Agent } from './types'

function makeAgent(overrides: Partial<Agent>): Agent {
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
    quote: '',
    emojis: [],
    ...overrides,
  }
}

describe('getQuoteSegments / quoteHasGiveaway', () => {
  it('redacts the agent\'s full name when it appears in the quote', () => {
    const agent = makeAgent({ quote: 'They call me Jane Doe for a reason.' })
    const segments = getQuoteSegments(agent)
    expect(quoteHasGiveaway(agent)).toBe(true)
    const redacted = segments.filter(s => s.redacted).map(s => s.text)
    expect(redacted).toContain('Jane Doe')
  })

  it('redacts just the first or last name alone', () => {
    const agent = makeAgent({ name: 'Jane Doe', quote: 'Jane always finishes what she starts.' })
    expect(quoteHasGiveaway(agent)).toBe(true)
  })

  it('redacts the id with hyphens turned into spaces', () => {
    const agent = makeAgent({ id: 'starlight-billy', name: 'Billy', quote: 'Some call me starlight billy.' })
    expect(quoteHasGiveaway(agent)).toBe(true)
  })

  it('does not flag a quote with no giveaway tokens', () => {
    const agent = makeAgent({ quote: 'A storm is coming, and I will be ready.' })
    expect(quoteHasGiveaway(agent)).toBe(false)
    const segments = getQuoteSegments(agent)
    expect(segments).toEqual([{ text: agent.quote, redacted: false }])
  })

  it('does not redact short name fragments (<= 2 chars) as standalone words', () => {
    // "Al" as a 2-char fragment shouldn't be redacted as a giveaway on its own,
    // but the full name still should be.
    const agent = makeAgent({ name: 'Al Vance', quote: 'Alright, let\'s go. — Al Vance' })
    const segments = getQuoteSegments(agent)
    const redactedTexts = segments.filter(s => s.redacted).map(s => s.text)
    expect(redactedTexts).toContain('Al Vance')
    // "Alright" must not be partially redacted as "Al" + "right"
    expect(segments.map(s => s.text).join('')).toBe(agent.quote)
  })

  it('does not cross word boundaries (e.g. "Ann" inside "Anna")', () => {
    const agent = makeAgent({ name: 'Ann', quote: 'Anna is not the same as me.' })
    // "Ann" must not match inside "Anna" — nothing here should get redacted.
    expect(quoteHasGiveaway(agent)).toBe(false)
    expect(getQuoteSegments(agent)).toEqual([{ text: agent.quote, redacted: false }])
  })

  it('is case-insensitive', () => {
    const agent = makeAgent({ name: 'Jane Doe', quote: 'jane doe is who I am.' })
    expect(quoteHasGiveaway(agent)).toBe(true)
  })

  it('handles an empty quote', () => {
    const agent = makeAgent({ quote: '' })
    expect(getQuoteSegments(agent)).toEqual([{ text: '', redacted: false }])
    expect(quoteHasGiveaway(agent)).toBe(false)
  })

  it('preserves the full original text when segments are joined back together', () => {
    const agent = makeAgent({ name: 'Jane Doe', quote: 'Jane Doe, at your service. Doe by name, doe by nature.' })
    const segments = getQuoteSegments(agent)
    expect(segments.map(s => s.text).join('')).toBe(agent.quote)
  })
})
