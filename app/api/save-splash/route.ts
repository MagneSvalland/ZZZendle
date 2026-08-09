import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { writeFile } from 'fs/promises'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  const { splashConfig, extSchedule, removeDates } = await req.json()
  const toRemove: string[] = Array.isArray(removeDates) ? removeDates : []

  const root = path.join(process.cwd())
  const splashPath = path.join(root, 'data', 'splash-config.json')
  const schedulePath = path.join(root, 'data', 'schedule.json')

  try {
    const cleanedSplashConfig = { ...splashConfig }
    for (const d of toRemove) delete cleanedSplashConfig[d]
    await writeFile(splashPath, JSON.stringify(cleanedSplashConfig, null, 2))

    const hasExt = extSchedule && Object.keys(extSchedule).length > 0
    if (hasExt || toRemove.length > 0) {
      const { readFile } = await import('fs/promises')
      const existing = JSON.parse(await readFile(schedulePath, 'utf-8'))
      const merged = { ...existing, ...(extSchedule ?? {}) }
      for (const d of toRemove) delete merged[d]
      const sorted = Object.fromEntries(
        Object.entries(merged).sort(([a], [b]) => a.localeCompare(b))
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

