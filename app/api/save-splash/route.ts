import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { writeFile } from 'fs/promises'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  const { splashConfig, extSchedule } = await req.json()

  const root = path.join(process.cwd())
  const splashPath = path.join(root, 'data', 'splash-config.json')
  const schedulePath = path.join(root, 'data', 'schedule.json')

  try {
    await writeFile(splashPath, JSON.stringify(splashConfig, null, 2))

    if (extSchedule && Object.keys(extSchedule).length > 0) {
      const { readFile } = await import('fs/promises')
      const existing = JSON.parse(await readFile(schedulePath, 'utf-8'))
      const merged = Object.fromEntries(
        Object.entries({ ...existing, ...extSchedule }).sort(([a], [b]) => a.localeCompare(b))
      )
      await writeFile(schedulePath, JSON.stringify(merged, null, 2))
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

