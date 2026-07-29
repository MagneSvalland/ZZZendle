'use client'

import { useState, useEffect } from 'react'

const ORIGINAL_BG = '/dhs8uis-2c9f5bda-287e-42a7-8d63-a51df778ead7.png'
const REMIELLE_BG = '/remielle_background.jpeg'
const LS_KEY = 'zzzendle-background'

export default function BackgroundManager() {
  const [bg, setBg] = useState(ORIGINAL_BG)

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY)
    const active = saved === 'original' ? ORIGINAL_BG : REMIELLE_BG
    setBg(active)
    applyBg(active)
  }, [])

  function applyBg(url: string) {
    const el = document.getElementById('zzz-bg-image')
    if (el) el.style.backgroundImage = `url(${url})`
  }

  function toggle() {
    const isRemielle = bg === REMIELLE_BG
    const next = isRemielle ? ORIGINAL_BG : REMIELLE_BG
    const key = isRemielle ? 'original' : 'remielle'
    // 'remielle' is default — only store when switching away
    setBg(next)
    applyBg(next)
    localStorage.setItem(LS_KEY, key)
  }

  return (
    <button
      onClick={toggle}
      title={bg === REMIELLE_BG ? 'Switch to original background' : 'Switch to Remielle background'}
      className="fixed bottom-4 right-4 z-50 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors bg-zinc-900/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 backdrop-blur-sm"
    >
      {bg === REMIELLE_BG ? '← original bg' : 'Remielle bg →'}
    </button>
  )
}
