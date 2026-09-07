// @vitest-environment jsdom
//
// jsdom is needed here because getEffectiveDate branches on `typeof window`
// and reads localStorage for the debug-date override — under the default
// node environment `window` is always undefined and that branch is dead.
import { describe, it, expect, beforeEach } from 'vitest'
import { getEffectiveDate, advanceDebugDate, clearDebugDate, DEBUG_DATE_KEY } from './date'
import { addDays } from './scheduleLogic'

beforeEach(() => {
  localStorage.clear()
})

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

describe('getEffectiveDate', () => {
  it('returns a plain YYYY-MM-DD string when there is no override', () => {
    expect(isIsoDate(getEffectiveDate())).toBe(true)
  })

  it('returns the localStorage override when one is set', () => {
    localStorage.setItem(DEBUG_DATE_KEY, '2026-01-15')
    expect(getEffectiveDate()).toBe('2026-01-15')
  })

  it('ignores an empty override and falls back to the real date', () => {
    localStorage.setItem(DEBUG_DATE_KEY, '')
    expect(isIsoDate(getEffectiveDate())).toBe(true)
  })
})

describe('advanceDebugDate', () => {
  it('advances the real date by exactly one day when there is no prior override', () => {
    const before = getEffectiveDate() // no override set yet, so this is today's real ET date
    const next = advanceDebugDate()
    expect(next).toBe(addDays(before, 1))
    expect(getEffectiveDate()).toBe(next) // the override now sticks
  })

  it('advances an existing override by one more day', () => {
    localStorage.setItem(DEBUG_DATE_KEY, '2026-02-28')
    expect(advanceDebugDate()).toBe('2026-03-01')
    expect(getEffectiveDate()).toBe('2026-03-01')
  })

  it('rolls over a year boundary', () => {
    localStorage.setItem(DEBUG_DATE_KEY, '2026-12-31')
    expect(advanceDebugDate()).toBe('2027-01-01')
  })
})

describe('clearDebugDate', () => {
  it('removes the override so getEffectiveDate falls back to the real date', () => {
    localStorage.setItem(DEBUG_DATE_KEY, '2026-01-15')
    clearDebugDate()
    expect(getEffectiveDate()).not.toBe('2026-01-15')
    expect(isIsoDate(getEffectiveDate())).toBe(true)
  })
})
