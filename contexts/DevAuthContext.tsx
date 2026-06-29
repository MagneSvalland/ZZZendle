'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const PASSWORD = 'magnexc'
const STORAGE_KEY = 'zzzendle-dev-auth'

interface DevAuthCtx {
  isDevAuth: boolean
  login: (pw: string) => boolean
  logout: () => void
}

const DevAuthContext = createContext<DevAuthCtx>({
  isDevAuth: false,
  login: () => false,
  logout: () => {},
})

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [isDevAuth, setIsDevAuth] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === '1') setIsDevAuth(true)
  }, [])

  function login(pw: string): boolean {
    if (pw !== PASSWORD) return false
    localStorage.setItem(STORAGE_KEY, '1')
    setIsDevAuth(true)
    return true
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setIsDevAuth(false)
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
