import { readdirSync } from 'fs'
import path from 'path'
import Link from 'next/link'
import type { Metadata } from 'next'
import agentsData from '@/data/agents.json'
import type { Agent } from '@/lib/types'
import SplashConfigurator from '@/components/SplashConfigurator'
import DebugImageGrid from '@/components/DebugImageGrid'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const agents = agentsData as Agent[]

function getImageFiles() {
  try {
    const dir = path.join(process.cwd(), 'public', 'images', 'agents')
    return readdirSync(dir)
      .filter(f => f.endsWith('.png') && f !== 'zzzlogo.png')
      .sort()
  } catch {
    return []
  }
}

export default function DebugPage() {
  const allFiles = getImageFiles()
  const iconFiles = allFiles.filter(f => f.includes('_Icon'))
  const portraitFiles = allFiles.filter(f => f.includes('_Portrait'))

  const referencedIcons = [...new Set(agents.map(a => a.icon_image).filter((s): s is string => !!s))]
  const referencedPortraits = [...new Set(agents.map(a => a.splash_image).filter((s): s is string => !!s))]

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-14">

        {/* Header */}
        <div className="flex items-center gap-5">
          <Link href="/" className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors">← Back</Link>
          <h1 className="text-lg font-bold tracking-tight">Image Debug</h1>
          <span className="text-zinc-600 text-sm">{agents.length} agents · {allFiles.length} files</span>
        </div>

        {/* ── Splash configurator ── */}
        <SplashConfigurator />

        {/* ── Image galleries — gated behind dev auth, see DebugImageGrid ── */}
        <DebugImageGrid
          agents={agents}
          iconFiles={iconFiles}
          portraitFiles={portraitFiles}
          referencedIcons={referencedIcons}
          referencedPortraits={referencedPortraits}
        />

      </div>
    </div>
  )
}
