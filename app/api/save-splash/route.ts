import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { writeFile } from 'fs/promises'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  const { splashConfig, scheduleJson } = await req.json()

  const root = path.join(process.cwd())
  const splashPath = path.join(root, 'data', 'splash-config.json')
  const schedulePath = path.join(root, 'data', 'schedule.json')

  try {
    await writeFile(splashPath, JSON.stringify(splashConfig, null, 2))
    await writeFile(schedulePath, JSON.stringify(scheduleJson, null, 2))

    await execAsync('git add data/splash-config.json data/schedule.json', { cwd: root })
    await execAsync('git commit -m "data: sync splash config and schedule from admin panel"', { cwd: root })
    await execAsync('git push', { cwd: root })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
