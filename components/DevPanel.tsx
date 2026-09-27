'use client'

import { useState, useEffect } from 'react'
import { useDevAuth } from '@/contexts/DevAuthContext'
import { getEffectiveDate, DEBUG_DATE_KEY } from '@/lib/date'
import { getAgentForMode } from '@/lib/getAgentOfTheDay'
import { SPLASH_SCHEDULE_EXT_KEY } from './SplashConfigurator'
import agentsData from '@/data/agents.json'
import type { Agent } from '@/lib/types'

const allAgents = agentsData as Agent[]
const MODES = ['classic', 'emoji', 'quote', 'splash'] as const

function getSplashAgent(date: string): Agent | null {
  try {
    const ext: Record<string, string> = JSON.parse(localStorage.getItem(SPLASH_SCHEDULE_EXT_KEY) ?? '{}')
    const extId = ext[date]
    if (extId) return allAgents.find(a => a.id === extId) ?? null
  } catch { /* ignore */ }
  return getAgentForMode('splash', date)
}

function stepDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

function clearGameStates(dateStr: string) {
  localStorage.removeItem(`zzzendle-game-${dateStr}`)
  for (const m of MODES) {
    localStorage.removeItem(`zzzendle-${m}-game-${dateStr}`)
    localStorage.removeItem(`zzzendle-debug-agent-${m}`)
  }
  // also clear old global key if it exists
  localStorage.removeItem('zzzendle-debug-agent')
}

export default function DevPanel() {
  const { isDevAuth, login, logout } = useDevAuth()
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)
  const [date, setDate] = useState('')

  useEffect(() => {
    setDate(getEffectiveDate())
    // Clean up legacy global debug key on mount
    localStorage.removeItem('zzzendle-debug-agent')
  }, [])

  // Keep date in sync when panel opens
  useEffect(() => {
    if (open) setDate(getEffectiveDate())
  }, [open])

  function applyDate(newDate: string) {
    localStorage.setItem(DEBUG_DATE_KEY, newDate)
    setDate(newDate)
    clearGameStates(newDate)
    window.location.reload()
  }

  function resetToReal() {
    localStorage.removeItem(DEBUG_DATE_KEY)
    clearGameStates(getEffectiveDate())
    window.location.reload()
  }

  async function handleLogin() {
    if (await login(pw)) { setPw(''); setPwError(false); setOpen(true) }
    else { setPwError(true); setPw('') }
  }

  const realDate = typeof window !== 'undefined'
    ? new Date().toLocaleDateString('en-CA')
    : ''
  const isOverride = date !== realDate && date !== ''

  // Per-mode agents for the selected date
  const modeAgents = MODES.map(m => ({
    mode: m,
    agent: m === 'splash' ? getSplashAgent(date) : getAgentForMode(m, date),
  }))

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">

      {/* Dev panel */}
      {isDevAuth && open && (
        <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/70 w-72 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Dev Panel</span>
            <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-300 text-sm">✕</button>
          </div>

          <div className="p-4 flex flex-col gap-4">

            {/* Date control */}
            <div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2">Active date</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => applyDate(stepDate(date, -1))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors text-sm"
                >
                  ←
                </button>
                <input
                  type="date"
                  value={date}
                  onChange={e => e.target.value && applyDate(e.target.value)}
                  className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs px-2 py-1.5 outline-none focus:border-yellow-500/60"
                />
                <button
                  onClick={() => applyDate(stepDate(date, 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors text-sm"
                >
                  →
                </button>
              </div>
              {isOverride && (
                <button
                  onClick={resetToReal}
                  className="mt-2 text-[10px] text-zinc-600 hover:text-yellow-400 transition-colors"
                >
                  ↩ Back to real date ({realDate})
                </button>
              )}
            </div>

            {/* Per-mode agents */}
            <div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2">Agents this date</div>
              <div className="flex flex-col gap-1.5">
                {modeAgents.map(({ mode, agent }) => (
                  <div key={mode} className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-600 w-12 uppercase">{mode}</span>
                    <span className="text-xs font-medium flex-1 truncate text-zinc-300">
                      {agent?.name ?? '—'}
                    </span>
                    {agent && (
                      <button
                        onClick={() => {
                          const key = mode === 'classic'
                            ? `zzzendle-game-${date}`
                            : `zzzendle-${mode}-game-${date}`
                          localStorage.removeItem(key)
                          if (mode === 'splash') {
                            try {
                              const ext = JSON.parse(localStorage.getItem(SPLASH_SCHEDULE_EXT_KEY) ?? '{}')
                              delete ext[date]
                              localStorage.setItem(SPLASH_SCHEDULE_EXT_KEY, JSON.stringify(ext))
                            } catch { /* ignore */ }
                          }
                          window.location.reload()
                        }}
                        className="text-[8px] text-zinc-700 hover:text-red-400 transition-colors"
                        title="Clear game state for this mode"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-zinc-800">
              <button
                onClick={() => { clearGameStates(date); window.location.reload() }}
                className="w-full py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs hover:bg-zinc-700 transition-colors"
              >
                Clear all game states → reload
              </button>
              <button
                onClick={logout}
                className="w-full py-1.5 rounded-lg text-zinc-700 text-xs hover:text-zinc-400 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login panel (not logged in) */}
      {!isDevAuth && open && (
        <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl p-5 w-64 flex flex-col gap-3 shadow-2xl shadow-black/70">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Developer Login</div>
          <input
            type="password"
            value={pw}
            autoFocus
            onChange={e => { setPw(e.target.value); setPwError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500/60 placeholder-zinc-600"
          />
          {pwError && <p className="text-red-400 text-xs -mt-1">Wrong password.</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setOpen(false); setPw(''); setPwError(false) }}
              className="flex-1 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-500 text-sm hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLogin}
              className="flex-1 py-2 rounded-xl bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`rounded-full w-7 h-7 flex items-center justify-center transition-all duration-200 ${
          isDevAuth
            ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/30'
            : 'bg-zinc-900/60 border border-zinc-800 text-zinc-700 hover:text-zinc-500 hover:border-zinc-700'
        }`}
        title={isDevAuth ? 'Dev panel' : 'Developer login'}
      >
        <span className="text-[11px]">{isDevAuth ? '⚙' : '🔒'}</span>
      </button>
    </div>
  )
}
