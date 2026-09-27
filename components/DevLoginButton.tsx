'use client'

import { useState, useEffect } from 'react'
import { useDevAuth } from '@/contexts/DevAuthContext'
import { DEBUG_RESET_KEY } from './DailyCountdown'
import { DEBUG_DATE_KEY, getEffectiveDate, clearDebugDate } from '@/lib/date'

export default function DevLoginButton() {
  const { isDevAuth, login, logout } = useDevAuth()
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [debugDate, setDebugDate] = useState<string | null>(null)

  useEffect(() => {
    if (open && isDevAuth) {
      const override = localStorage.getItem(DEBUG_DATE_KEY)
      setDebugDate(override)
    }
  }, [open, isDevAuth])

  async function handleLogin() {
    if (await login(pw)) {
      setOpen(false)
      setPw('')
      setError(false)
    } else {
      setError(true)
      setPw('')
    }
  }

  function handleLogout() {
    logout()
    setOpen(false)
  }

  function handleTestReset() {
    localStorage.setItem(DEBUG_RESET_KEY, String(Date.now() + 60_000))
    setOpen(false)
  }

  function handleClearDate() {
    clearDebugDate()
    ;['classic', 'emoji', 'quote', 'splash'].forEach(m =>
      localStorage.removeItem(`zzzendle-debug-agent-${m}`)
    )
    setDebugDate(null)
    window.location.reload()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-4 right-4 z-50 rounded-full w-7 h-7 flex items-center justify-center transition-all duration-200 ${
          isDevAuth
            ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/30'
            : 'bg-zinc-900/60 border border-zinc-800 text-zinc-700 hover:text-zinc-500 hover:border-zinc-700'
        }`}
        title={isDevAuth ? 'Developer mode active' : 'Developer login'}
      >
        <span className="text-[11px]">{isDevAuth ? '⚙' : '🔒'}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl p-6 w-full max-w-xs flex flex-col gap-3 shadow-2xl shadow-black/60">
            {isDevAuth ? (
              <>
                <div>
                  <div className="text-yellow-400 text-xs font-semibold uppercase tracking-widest mb-1">Developer Mode</div>
                  {debugDate ? (
                    <p className="text-zinc-400 text-sm">
                      Date override: <span className="text-yellow-300 font-mono">{debugDate}</span>
                    </p>
                  ) : (
                    <p className="text-zinc-500 text-xs">Real date: <span className="font-mono">{getEffectiveDate()}</span></p>
                  )}
                </div>

                <button
                  onClick={handleTestReset}
                  className="w-full py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
                >
                  ⏱ Test reset (1 min)
                </button>

                {debugDate && (
                  <button
                    onClick={handleClearDate}
                    className="w-full py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors"
                  >
                    ✕ Clear date override → reload
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full py-2 rounded-xl bg-zinc-800/50 border border-zinc-800 text-zinc-600 text-sm hover:text-zinc-300 transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <div>
                  <div className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1">Developer Login</div>
                  <p className="text-zinc-500 text-xs mt-1">Enables debug tools and splash art config.</p>
                </div>
                <input
                  type="password"
                  value={pw}
                  autoFocus
                  onChange={e => { setPw(e.target.value); setError(false) }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Password"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-500/60 placeholder-zinc-600"
                />
                {error && <p className="text-red-400 text-xs -mt-2">Wrong password.</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setOpen(false); setPw(''); setError(false) }}
                    className="flex-1 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors"
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
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
