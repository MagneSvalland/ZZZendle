import { describe, it, expect } from 'vitest'
import { parseHash, mergeHistograms, summarize, pickSummary, MIN_RESULTS } from './globalStats'

describe('parseHash', () => {
  it('turns a flat HGETALL reply into a histogram', () => {
    expect(parseHash(['3', '5', '1', '2'])).toEqual({ '3': 5, '1': 2 })
  })
  it('handles empty and malformed replies', () => {
    expect(parseHash(null)).toEqual({})
    expect(parseHash(['3', 'x'])).toEqual({})
  })
})

describe('summarize', () => {
  it('returns null below the minimum number of results', () => {
    expect(summarize({ '4': MIN_RESULTS - 1 }, 4)).toBeNull()
  })

  it('computes the average and the top percentage with half-counted ties', () => {
    // 10 × 1, 20 × 3, 10 × 7 → avg 3.5
    const h = { '1': 10, '3': 20, '7': 10 }
    expect(summarize(h, 1)).toEqual({ average: 3.5, topPercent: 13 }) // 5/40 = 12.5%
    expect(summarize(h, 3)).toEqual({ average: 3.5, topPercent: 50 }) // (10+10)/40
    expect(summarize(h, 7)).toEqual({ average: 3.5, topPercent: 88 }) // (30+5)/40
  })

  it('never reports top 0%', () => {
    expect(summarize({ '1': 1, '5': 999 }, 1)!.topPercent).toBe(1)
  })
})

describe('pickSummary', () => {
  it("uses today's results when there are enough", () => {
    expect(pickSummary({ '2': 20 }, [{ '6': 100 }], 2)?.scope).toBe('today')
  })

  it('falls back to the last week for early players', () => {
    const s = pickSummary({ '2': 3 }, [{ '4': 10 }, { '4': 10 }], 2)
    expect(s?.scope).toBe('week')
    expect(s?.average).toBe(3.7) // (6 + 80) / 23
  })

  it('returns null when even the week is too thin', () => {
    expect(pickSummary({ '2': 3 }, [{ '4': 5 }], 2)).toBeNull()
  })
})

describe('mergeHistograms', () => {
  it('adds counts per guess', () => {
    expect(mergeHistograms([{ '1': 1, '2': 2 }, { '2': 3 }])).toEqual({ '1': 1, '2': 5 })
  })
})
