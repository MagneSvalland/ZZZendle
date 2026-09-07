import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { writeFile } from 'fs/promises'
import path from 'path'
import { promisify } from 'util'
import { compactFutureSchedule, remapDates } from '@/lib/scheduleLogic'
import { getEffectiveDate } from '@/lib/date'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  const { splashConfig, extSchedule, removeDates, agentOverride } = await req.json()
  const toRemove: string[] = Array.isArray(removeDates) ? removeDates : []
  const overrides: Record<string, string> = agentOverride ?? {}

  const root = path.join(process.cwd())
  const splashPath = path.join(root, 'data', 'splash-config.json')
  const schedulePath = path.join(root, 'data', 'schedule.json')

  try {
    const { readFile } = await import('fs/promises')

    // Merge with what's already on disk instead of replacing the file
    // wholesale — the browser's local `splashConfig` only reflects what that
    // session has loaded/edited, so a blind overwrite silently discards any
    // entries written by other sessions (or edited directly) since this page
    // was last loaded.
    const existingSplash = JSON.parse(await readFile(splashPath, 'utf-8').catch(() => '{}'))
    let mergedSplash = { ...existingSplash, ...splashConfig }
    for (const d of toRemove) delete mergedSplash[d]

    const hasExt = extSchedule && Object.keys(extSchedule).length > 0
    const hasOverrides = Object.keys(overrides).length > 0
    let compactedSchedule: Record<string, string> | null = null
    if (hasExt || toRemove.length > 0 || hasOverrides) {
      const existing = JSON.parse(await readFile(schedulePath, 'utf-8'))
      const merged = { ...existing, ...(extSchedule ?? {}) }
      // Reassign which agent sits on an already-scheduled date — e.g. from
      // the ◀ ▶ swap arrows. Applied after merging in new ext days, before
      // removals, so a removed date always ends up gone regardless of order.
      for (const [date, agentId] of Object.entries(overrides)) merged[date] = agentId
      for (const d of toRemove) delete merged[d]
      // Close whatever gap the removal (or anything else) left behind —
      // every day from today onward packs back-to-back, so e.g. removing a
      // middle day's agent shifts every later day up by one instead of
      // leaving that day blank. Per-day splash-config entries move with
      // their day so a shifted day keeps its saved zoom focus.
      const { schedule: compacted, dateMap } = compactFutureSchedule(merged, getEffectiveDate())
      compactedSchedule = compacted
      mergedSplash = remapDates(mergedSplash, dateMap)
    }

    const sortedSplash = Object.fromEntries(
      Object.entries(mergedSplash).sort(([a], [b]) => a.localeCompare(b))
    )
    await writeFile(splashPath, JSON.stringify(sortedSplash, null, 2))

    if (compactedSchedule) {
      const sorted = Object.fromEntries(
        Object.entries(compactedSchedule).sort(([a], [b]) => a.localeCompare(b))
      )
      await writeFile(schedulePath, JSON.stringify(sorted, null, 2))
    }

    await execAsync('git add data/splash-config.json data/schedule.json', { cwd: root })
    await execAsync('git commit -m "data: sync splash config from admin panel"', { cwd: root })
    await execAsync('git push', { cwd: root })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

