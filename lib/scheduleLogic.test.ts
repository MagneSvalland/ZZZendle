import { describe, it, expect } from 'vitest'
import { addDays, contiguousExt, compactFutureSchedule, remapDates, type SplashConfig } from './scheduleLogic'

describe('addDays', () => {
  it('advances by the given number of days', () => {
    expect(addDays('2026-09-20', 1)).toBe('2026-09-21')
    expect(addDays('2026-09-20', 5)).toBe('2026-09-25')
  })

  it('is a no-op for n = 0', () => {
    expect(addDays('2026-09-20', 0)).toBe('2026-09-20')
  })

  it('rolls over month and year boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('supports negative offsets', () => {
    expect(addDays('2026-09-01', -1)).toBe('2026-08-31')
  })
})

describe('compactFutureSchedule — the "delete agent b" bug', () => {
  const today = '2026-09-20'

  it('shifts every later day back by one when a middle day is removed', () => {
    // a=day20, b=day21 (removed), c=day22 — this is exactly the report:
    // deleting agent b should make c take day21, not leave day21 empty.
    const schedule = { '2026-09-20': 'a', '2026-09-22': 'c' } // b already deleted by caller
    const { schedule: result, dateMap } = compactFutureSchedule(schedule, today)
    expect(result).toEqual({ '2026-09-20': 'a', '2026-09-21': 'c' })
    expect(dateMap['2026-09-22']).toBe('2026-09-21')
    expect(dateMap['2026-09-20']).toBe('2026-09-20')
  })

  it('is a no-op when the schedule is already gapless', () => {
    const schedule = { '2026-09-20': 'a', '2026-09-21': 'b', '2026-09-22': 'c' }
    const { schedule: result } = compactFutureSchedule(schedule, today)
    expect(result).toEqual(schedule)
  })

  it('pulls a later day up to today when the earliest scheduled day is removed', () => {
    const schedule = { '2026-09-21': 'b', '2026-09-22': 'c' } // day20 (today) already deleted
    const { schedule: result, dateMap } = compactFutureSchedule(schedule, today)
    expect(result).toEqual({ '2026-09-20': 'b', '2026-09-21': 'c' })
    expect(dateMap['2026-09-21']).toBe('2026-09-20')
    expect(dateMap['2026-09-22']).toBe('2026-09-21')
  })

  it('closes multiple independent gaps at once', () => {
    const schedule = { '2026-09-20': 'a', '2026-09-23': 'd', '2026-09-25': 'f' }
    const { schedule: result } = compactFutureSchedule(schedule, today)
    expect(result).toEqual({ '2026-09-20': 'a', '2026-09-21': 'd', '2026-09-22': 'f' })
  })

  it('leaves days before today completely untouched', () => {
    const schedule = { '2026-09-18': 'x', '2026-09-19': 'y', '2026-09-22': 'c' }
    const { schedule: result, dateMap } = compactFutureSchedule(schedule, today)
    expect(result['2026-09-18']).toBe('x')
    expect(result['2026-09-19']).toBe('y')
    expect(dateMap['2026-09-18']).toBe('2026-09-18')
    expect(dateMap['2026-09-19']).toBe('2026-09-19')
    // only the future portion (>= today) gets packed
    expect(result['2026-09-20']).toBe('c')
  })

  it('removing the very last scheduled day just shrinks the schedule', () => {
    const schedule = { '2026-09-20': 'a', '2026-09-21': 'b' } // c (day22) already deleted
    const { schedule: result } = compactFutureSchedule(schedule, today)
    expect(result).toEqual({ '2026-09-20': 'a', '2026-09-21': 'b' })
  })

  it('handles an empty schedule', () => {
    const { schedule: result, dateMap } = compactFutureSchedule({}, today)
    expect(result).toEqual({})
    expect(dateMap).toEqual({})
  })

  it('handles a schedule with only past days', () => {
    const schedule = { '2026-09-18': 'x', '2026-09-19': 'y' }
    const { schedule: result } = compactFutureSchedule(schedule, today)
    expect(result).toEqual(schedule)
  })
})

describe('remapDates', () => {
  it('moves a value to its mapped date', () => {
    const map = { '2026-09-22': { portrait: 'p.png', focus: 65 } }
    const dateMap = { '2026-09-22': '2026-09-21' }
    expect(remapDates(map, dateMap)).toEqual({ '2026-09-21': { portrait: 'p.png', focus: 65 } })
  })

  it('keeps a key unchanged when the date map has no entry for it', () => {
    const map = { '2026-01-01': 'v' }
    expect(remapDates(map, {})).toEqual({ '2026-01-01': 'v' })
  })

  it('round-trips with compactFutureSchedule so per-day config follows its shifted day', () => {
    const schedule = { '2026-09-20': 'a', '2026-09-22': 'c' }
    const splashConfig: SplashConfig = { '2026-09-22': { portrait: 'c-portrait.png', focus: 70 } }
    const { dateMap } = compactFutureSchedule(schedule, '2026-09-20')
    expect(remapDates(splashConfig, dateMap)).toEqual({
      '2026-09-21': { portrait: 'c-portrait.png', focus: 70 },
    })
  })
})

describe('contiguousExt', () => {
  const today = '2026-09-20'

  it('assigns the first ext day to tomorrow when nothing is scheduled', () => {
    const { ext } = contiguousExt({ x: 'agentA' }, {}, {}, today)
    expect(ext).toEqual({ '2026-09-21': 'agentA' })
  })

  it('skips real scheduled days when picking an open date', () => {
    const schedule = { '2026-09-21': 'someone' }
    const { ext } = contiguousExt({ x: 'agentA' }, {}, schedule, today)
    expect(ext).toEqual({ '2026-09-22': 'agentA' })
  })

  it('keeps multiple ext days in their original relative order', () => {
    const { ext } = contiguousExt({ first: 'a', second: 'b' }, {}, {}, today)
    expect(ext).toEqual({ '2026-09-21': 'a', '2026-09-22': 'b' })
  })

  it('closes the gap after one ext day is removed from the map', () => {
    // Simulates removeExtDay: caller deletes the entry, then re-normalizes.
    const before = contiguousExt({ first: 'a', second: 'b', third: 'c' }, {}, {}, today)
    expect(before.ext).toEqual({ '2026-09-21': 'a', '2026-09-22': 'b', '2026-09-23': 'c' })

    const middleDate = Object.keys(before.ext)[1] // '2026-09-22' -> b
    const afterRemoval = { ...before.ext }
    delete afterRemoval[middleDate]

    const { ext: closed } = contiguousExt(afterRemoval, {}, {}, today)
    expect(closed).toEqual({ '2026-09-21': 'a', '2026-09-22': 'c' })
  })

  it('carries each day\'s config along when re-indexed', () => {
    const configMap: SplashConfig = { first: { portrait: 'a.png', focus: 60 } }
    const { ext, config } = contiguousExt({ first: 'agentA' }, configMap, {}, today)
    const newDate = Object.keys(ext)[0]
    expect(config[newDate]).toEqual({ portrait: 'a.png', focus: 60 })
  })

  it('leaves config for non-extended (scheduled) days untouched', () => {
    const configMap: SplashConfig = { '2026-09-21': { portrait: 'scheduled.png', focus: 50 } }
    const { config } = contiguousExt({}, configMap, {}, today)
    expect(config).toEqual(configMap)
  })
})
