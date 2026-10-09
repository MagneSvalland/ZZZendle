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
    expect(summarize({ '3': 1 }, 3)).toMatchObject({ average: 3, first: true })
  })

  it('compares against the first player from the second one on', () => {
    expect(summarize({ '3': 1, '2': 1 }, 2)).toEqual({ average: 2.5, topPercent: 50, first: false })
  })

  it('gives ties the best shared rank', () => {
    // 10 × 1, 20 × 3, 10 × 7 → avg 3.5
    const h = { '1': 10, '3': 20, '7': 10 }
    expect(summarize(h, 1)).toMatchObject({ average: 3.5, topPercent: 3 }) // 1/40 = 2.5%
    expect(summarize(h, 3)).toMatchObject({ average: 3.5, topPercent: 28 }) // 11/40 = 27.5%
    expect(summarize(h, 7)).toMatchObject({ average: 3.5, topPercent: 78 }) // 31/40 = 77.5%
  })

  it('makes a first-try solve top 1% even when most players got it first try', () => {
    expect(summarize({ '1': 89, '2': 12, '6': 1, '9': 1 }, 1)!.topPercent).toBe(1)
  })
})
