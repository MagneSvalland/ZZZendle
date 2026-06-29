'use client'

import { useState, useEffect } from 'react'
import { advanceDebugDate } from '@/lib/date'

export const DEBUG_RESET_KEY = 'zzzendle-debug-reset-at'

function getNextReset(): Date {
  // Dev override: a custom timestamp set in localStorage
  try {
    const override = localStorage.getItem(DEBUG_RESET_KEY)
    if (override) {
      const t = parseInt(override)
      if (t > Date.now()) return new Date(t)
      localStorage.removeItem(DEBUG_RESET_KEY)
    }
  } catch { /* ignore */ }

  // Normal: next midnight Eastern Time
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const p: Record<string, number> = {}
  parts.forEach(pt => { if (pt.type !== 'literal') p[pt.type] = parseInt(pt.value) })
  const elapsed = ((p.hour * 60 + p.minute) * 60 + p.second) * 1000
  return new Date(now.getTime() - elapsed + 24 * 60 * 60 * 1000)
}

function fmt(ms: number) {
  if (ms <= 0) return '00:00:00'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':')
}

export default function DailyCountdown() {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    function tick() {
      const ms = getNextReset().getTime() - Date.now()
      if (ms <= 0) {
        // If using debug override, advance the date so the game shows next day's agent
        const isDebugReset = !!localStorage.getItem(DEBUG_RESET_KEY)
        if (isDebugReset) {
          advanceDebugDate()
          localStorage.removeItem(DEBUG_RESET_KEY)
          // Clear per-mode debug agents so they re-derive from the new date
          ;['classic', 'emoji', 'quote', 'splash'].forEach(m =>
            localStorage.removeItem(`zzzendle-debug-agent-${m}`)
          )
        }
        window.location.reload()
        return
      }
      setDisplay(fmt(ms))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!display) return null

  return (
    <div className="text-right">
      <div className="text-lg font-mono font-bold text-zinc-300 tabular-nums">{display}</div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Next reset · ET</div>
    </div>
  )
}
