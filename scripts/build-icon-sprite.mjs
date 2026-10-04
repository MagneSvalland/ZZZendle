// Packs every agent icon into one small sprite sheet so the search dropdown
// and guess rows can show icons instantly from a single cached image instead
// of one request per agent.
//
// Runs automatically before `npm run dev` and `npm run build` (so on every
// Vercel deploy). Can also be run by hand: npm run sprite
// Agents missing from the sprite still work — they fall back to loading
// their own icon file.

import sharp from 'sharp'
import { createHash } from 'crypto'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const ROOT = process.cwd()
const CELL = 80 // px per icon: 2x the largest sprite use (40px guess-row avatar)
const COLS = 10
const OUT_IMAGE = 'public/images/agent-icons.webp'
const OUT_MAP = 'data/agent-icon-sprite.json'

const agents = JSON.parse(await readFile(path.join(ROOT, 'data/agents.json'), 'utf-8'))
const withIcon = agents.filter(a => a.icon_image)

const tiles = await Promise.all(
  withIcon.map(a =>
    sharp(path.join(ROOT, 'public', a.icon_image))
      // Same crop as the <Image className="object-cover object-top"> it replaces
      .resize(CELL, CELL, { fit: 'cover', position: 'top' })
      .toBuffer(),
  ),
)

const rows = Math.ceil(tiles.length / COLS)
const image = await sharp({
  create: { width: COLS * CELL, height: rows * CELL, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite(tiles.map((input, i) => ({ input, left: (i % COLS) * CELL, top: Math.floor(i / COLS) * CELL })))
  .webp({ quality: 82 })
  .toBuffer()

await writeFile(path.join(ROOT, OUT_IMAGE), image)

// The hash goes into the URL so browsers holding last week's cached sprite
// fetch the new one as soon as it changes (see the /images Cache-Control
// header in next.config.ts).
const hash = createHash('sha256').update(image).digest('hex').slice(0, 10)
const map = {
  url: `/${OUT_IMAGE.replace(/^public\//, '')}?v=${hash}`,
  cols: COLS,
  rows,
  index: Object.fromEntries(withIcon.map((a, i) => [a.id, i])),
}
// Skip rewriting an unchanged map: on Windows git checks it out with CRLF,
// and rewriting it with LF would show it as modified after every build.
const mapPath = path.join(ROOT, OUT_MAP)
const mapJson = JSON.stringify(map, null, 2) + '\n'
const existing = await readFile(mapPath, 'utf-8').catch(() => '')
if (existing.replace(/\r\n/g, '\n') !== mapJson) await writeFile(mapPath, mapJson)

console.log(`${withIcon.length} icons → ${OUT_IMAGE} (${(image.length / 1024).toFixed(0)} KB, ${COLS}x${rows}), map → ${OUT_MAP}`)
