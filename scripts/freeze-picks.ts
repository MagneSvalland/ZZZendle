// Freezes classic/emoji/quote picks through tomorrow (ET) into
// data/daily-picks.json. Picks come from origin/main's data — what players
// are being served right now — not from this branch's possibly edited data,
// so freezing before a data change locks in today's puzzle as it is live.
// Existing entries are never overwritten.
//
//   npm run freeze-picks
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { computePickIds, type FrozenPicks } from '@/lib/getAgentOfTheDay'
import { getEffectiveDate } from '@/lib/date'

const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'data/daily-picks.json')
const REF = 'origin/main'

execSync('git fetch -q origin main', { cwd: ROOT, stdio: 'inherit' })
const fromMain = (file: string, fallback: string) => {
  try {
    return JSON.parse(execSync(`git show ${REF}:data/${file}`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))
  } catch {
    return JSON.parse(fallback)
  }
}

const tomorrow = new Date(getEffectiveDate() + 'T12:00:00')
tomorrow.setDate(tomorrow.getDate() + 1)
const through = tomorrow.toLocaleDateString('en-CA')

const existing: FrozenPicks = JSON.parse(fs.readFileSync(OUT, 'utf8'))
const live = computePickIds(through, {
  agents: fromMain('agents.json', '[]'),
  schedule: fromMain('schedule.json', '{}'),
  classicOverrides: fromMain('classic-overrides.json', '{}'),
  frozen: fromMain('daily-picks.json', '{}'),
})

const merged: FrozenPicks = { ...live, ...existing }
const dates = Object.keys(merged).sort()
// One line per day keeps the file (and its diffs) readable.
const lines = dates.map(d => `  ${JSON.stringify(d)}: ${JSON.stringify(merged[d])}`)
fs.writeFileSync(OUT, `{\n${lines.join(',\n')}\n}\n`)
console.log(`daily-picks.json: frozen through ${through} (${dates.length - Object.keys(existing).length} new days)`)
