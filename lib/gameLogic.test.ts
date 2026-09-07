import { describe, it, expect } from 'vitest'
import { compareAgents } from './gameLogic'
import type { Agent } from './types'

function makeAgent(overrides: Partial<Agent>): Agent {
  return {
    id: 'base',
    name: 'Base Agent',
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

describe('compareAgents', () => {
  it('marks isCorrect only when the ids match', () => {
    const target = makeAgent({ id: 'target' })
    expect(compareAgents(makeAgent({ id: 'target' }), target).isCorrect).toBe(true)
    expect(compareAgents(makeAgent({ id: 'other' }), target).isCorrect).toBe(false)
  })

  it('reports exact for every matching attribute', () => {
    const target = makeAgent({ id: 't', faction: 'Hollow', attribute: 'Ice', specialty: 'Stun', rank: 'S', gender: 'Male' })
    const guess = makeAgent({ id: 'g', faction: 'Hollow', attribute: 'Ice', specialty: 'Stun', rank: 'S', gender: 'Male' })
    const { results } = compareAgents(guess, target)
    expect(results.faction).toBe('exact')
    expect(results.attribute).toBe('exact')
    expect(results.specialty).toBe('exact')
    expect(results.rank).toBe('exact')
    expect(results.gender).toBe('exact')
  })

  it('reports none for every mismatching attribute', () => {
    const target = makeAgent({ id: 't', faction: 'Hollow', attribute: 'Ice', specialty: 'Stun', rank: 'S', gender: 'Male' })
    const guess = makeAgent({ id: 'g', faction: 'Victoria', attribute: 'Fire', specialty: 'Attack', rank: 'A', gender: 'Female' })
    const { results } = compareAgents(guess, target)
    expect(results.faction).toBe('none')
    expect(results.attribute).toBe('none')
    expect(results.specialty).toBe('none')
    expect(results.rank).toBe('none')
    expect(results.gender).toBe('none')
  })

  describe('release version comparison', () => {
    it('is exact when major and minor match', () => {
      const target = makeAgent({ release_version: '2.0' })
      const guess = makeAgent({ release_version: '2.0' })
      expect(compareAgents(guess, target).results.release).toBe('exact')
    })

    it('is earlier when the guess released before the target (arrow up)', () => {
      const target = makeAgent({ release_version: '2.0' })
      const guess = makeAgent({ release_version: '1.0' })
      expect(compareAgents(guess, target).results.release).toBe('earlier')
    })

    it('is later when the guess released after the target (arrow down)', () => {
      const target = makeAgent({ release_version: '1.0' })
      const guess = makeAgent({ release_version: '2.0' })
      expect(compareAgents(guess, target).results.release).toBe('later')
    })

    it('compares minor versions within the same major version', () => {
      const target = makeAgent({ release_version: '1.5' })
      expect(compareAgents(makeAgent({ release_version: '1.2' }), target).results.release).toBe('earlier')
      expect(compareAgents(makeAgent({ release_version: '1.8' }), target).results.release).toBe('later')
      expect(compareAgents(makeAgent({ release_version: '1.5' }), target).results.release).toBe('exact')
    })

    it('treats a bare major version as minor 0', () => {
      const target = makeAgent({ release_version: '2' })
      expect(compareAgents(makeAgent({ release_version: '2.0' }), target).results.release).toBe('exact')
      expect(compareAgents(makeAgent({ release_version: '2.1' }), target).results.release).toBe('later')
    })
  })
})
