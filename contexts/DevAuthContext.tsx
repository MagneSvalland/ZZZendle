'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { DEBUG_DATE_KEY } from '@/lib/date'

// The password check happens server-side in /api/dev-auth (see lib/devAuth.ts)
// so the password never ships in the client bundle. This context only mirrors
// whether the httpOnly session cookie is valid.

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
    fetch('/api/dev-auth', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setIsDevAuth(d.isDevAuth === true))
      .catch(() => {})
  }, [])

  async function login(pw: string): Promise<boolean> {
    const res = await fetch('/api/dev-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    }).catch(() => null)
    if (!res?.ok) return false
    setIsDevAuth(true)
    return true
  }

  async function logout() {
    await fetch('/api/dev-auth', { method: 'DELETE' }).catch(() => {})
    localStorage.removeItem(DEBUG_DATE_KEY)
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
