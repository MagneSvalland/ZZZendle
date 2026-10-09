import { describe, it, expect } from 'vitest'
import { parseHash, summarize } from './globalStats'

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
  it('returns null when there are no results', () => {
    expect(summarize({}, 4)).toBeNull()
  })

  it('flags the first solver of the day', () => {
    expect(summarize({ '3': 1 }, 3)).toEqual({ average: 3, topPercent: 50, first: true })
  })

  it('compares against the first player from the second one on', () => {
    expect(summarize({ '3': 1, '2': 1 }, 2)).toEqual({ average: 2.5, topPercent: 25, first: false })
  })

  it('computes the average and the top percentage with half-counted ties', () => {
    // 10 × 1, 20 × 3, 10 × 7 → avg 3.5
    const h = { '1': 10, '3': 20, '7': 10 }
    expect(summarize(h, 1)).toMatchObject({ average: 3.5, topPercent: 13 }) // 5/40 = 12.5%
    expect(summarize(h, 3)).toMatchObject({ average: 3.5, topPercent: 50 }) // (10+10)/40
    expect(summarize(h, 7)).toMatchObject({ average: 3.5, topPercent: 88 }) // (30+5)/40
  })

  it('never reports top 0%', () => {
    expect(summarize({ '1': 1, '5': 999 }, 1)!.topPercent).toBe(1)
  })
})
