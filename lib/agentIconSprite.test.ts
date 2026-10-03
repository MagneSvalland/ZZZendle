import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import path from 'path'
import agents from '@/data/agents.json'
import sprite from '@/data/agent-icon-sprite.json'

// Agents missing from the sprite still show (they load their own icon file),
// just not instantly. If this fails after adding agents: npm run sprite
describe('agent icon sprite', () => {
  it('contains every agent that has an icon', () => {
    const index = sprite.index as Record<string, number>
    const missing = agents.filter(a => a.icon_image && index[a.id] === undefined).map(a => a.id)
    expect(missing).toEqual([])
  })

  it('points at an existing image file', () => {
    const file = sprite.url.split('?')[0]
    expect(existsSync(path.join(process.cwd(), 'public', file))).toBe(true)
  })
})
