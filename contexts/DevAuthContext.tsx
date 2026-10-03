'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { DEBUG_DATE_KEY } from '@/lib/date'

// The password check happens server-side in /api/dev-auth (see lib/devAuth.ts)
// so the password never ships in the client bundle. This context only mirrors
// whether the httpOnly session cookie is valid.
//
// The httpOnly cookie can't be read from JS, so a plain localStorage hint
// records "this browser has logged in before". Only browsers with the hint
// ask the server, which keeps regular players from triggering an
// /api/dev-auth call (edge request + function invocation) on every page
// load. The hint grants nothing — the server still verifies the cookie.
const DEV_HINT_KEY = 'zzzendle-dev-hint'

interface DevAuthCtx {
  isDevAuth: boolean
  login: (pw: string) => Promise<boolean>
  logout: () => void
}

const DevAuthContext = createContext<DevAuthCtx>({
  isDevAuth: false,
  login: async () => false,
  logout: () => {},
})

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [isDevAuth, setIsDevAuth] = useState(false)

  useEffect(() => {
    // Legacy client-side flag from the old hardcoded-password version
    localStorage.removeItem('zzzendle-dev-auth')
    if (localStorage.getItem(DEV_HINT_KEY) !== '1') return
    fetch('/api/dev-auth', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const ok = d.isDevAuth === true
        setIsDevAuth(ok)
        if (!ok) localStorage.removeItem(DEV_HINT_KEY)
      })
      .catch(() => {})
  }, [])

  async function login(pw: string): Promise<boolean> {
    const res = await fetch('/api/dev-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    }).catch(() => null)
    if (!res?.ok) return false
    localStorage.setItem(DEV_HINT_KEY, '1')
    setIsDevAuth(true)
    return true
  }

  async function logout() {
    await fetch('/api/dev-auth', { method: 'DELETE' }).catch(() => {})
    localStorage.removeItem(DEBUG_DATE_KEY)
    localStorage.removeItem(DEV_HINT_KEY)
    setIsDevAuth(false)
    window.location.reload()
  }

  return (
    <DevAuthContext.Provider value={{ isDevAuth, login, logout }}>
      {children}
    </DevAuthContext.Provider>
  )
}

export function useDevAuth() {
  return useContext(DevAuthContext)
}
