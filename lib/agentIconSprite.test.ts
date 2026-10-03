import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import path from 'path'
import sprite from '@/data/agent-icon-sprite.json'

// The sprite is regenerated before every dev/build (npm run sprite), so it
// may lag behind agents.json in git; agents missing from it fall back to
// their own icon file. This only guards that the map points at a real file.
describe('agent icon sprite', () => {
  it('points at an existing image file', () => {
    const file = sprite.url.split('?')[0]
    expect(existsSync(path.join(process.cwd(), 'public', file))).toBe(true)
  })
})
