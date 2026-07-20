'use client'

import { useState, useEffect } from 'react'
import { getEffectiveDate } from '@/lib/date'

const KOFI_URL = 'https://ko-fi.com/magnen'

export default function KofiBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const today = getEffectiveDate()
    if (localStorage.getItem(`zzzendle-kofi-shown-${today}`)) return
    const t = setTimeout(() => setVisible(true), 45000)
    return () => clearTimeout(t)
  }, [])

  function handleDismiss() {
    localStorage.setItem(`zzzendle-kofi-shown-${getEffectiveDate()}`, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-zinc-700/60 bg-zinc-900/95 backdrop-blur-sm px-4 py-3 shadow-xl">
        <span className="text-sm text-zinc-300 flex-1 leading-snug">
          Enjoying ZZZendle? Support the project ☕
        </span>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-1.5 rounded-lg bg-yellow-500 text-black text-xs font-bold hover:bg-yellow-400 transition-colors"
        >
          Ko-fi
        </a>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-zinc-500 hover:text-zinc-200 transition-colors text-sm leading-none"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
