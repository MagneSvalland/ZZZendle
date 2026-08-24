'use client'

import { useState, useEffect, useRef } from 'react'

type BackgroundOption = { key: string; label: string; url: string }

const BACKGROUNDS: BackgroundOption[] = [
  { key: 'wise', label: 'Wise', url: '/wise_background.jpeg' },
  { key: 'remielle', label: 'Remielle', url: '/remielle_background.jpeg' },
  { key: 'original', label: 'Original', url: '/dhs8uis-2c9f5bda-287e-42a7-8d63-a51df778ead7.png' },
]
const DEFAULT_KEY = 'wise'
const LS_KEY = 'zzzendle-background'

function applyBg(key: string) {
  const bg = BACKGROUNDS.find(b => b.key === key) ?? BACKGROUNDS[0]
  const el = document.getElementById('zzz-bg-image')
  if (el) el.style.backgroundImage = `url("${bg.url}")`
}

export default function BackgroundManager() {
  const [activeKey, setActiveKey] = useState(DEFAULT_KEY)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY)
    const key = BACKGROUNDS.some(b => b.key === saved) ? saved! : DEFAULT_KEY
    setActiveKey(key)
    applyBg(key)
  }, [])

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  function select(key: string) {
    setActiveKey(key)
    applyBg(key)
    localStorage.setItem(LS_KEY, key)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="fixed bottom-4 left-4 z-50">
      {open && (
        <div className="absolute bottom-12 left-0 mb-2 flex gap-2 rounded-xl border border-zinc-800 bg-zinc-900/95 p-3 shadow-2xl backdrop-blur-sm">
          {BACKGROUNDS.map(bg => (
            <button
              key={bg.key}
              type="button"
              onClick={() => select(bg.key)}
              title={bg.label}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150 ${
                activeKey === bg.key
                  ? 'border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                  : 'border-zinc-700 opacity-80 hover:border-zinc-500 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bg.url} alt={bg.label} className="h-full w-full object-cover" />
              {activeKey === bg.key && (
                <div className="absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-yellow-400">
                  <span className="text-[6px] font-black text-black">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Change background"
        className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-[10px] text-zinc-600 backdrop-blur-sm transition-colors hover:text-zinc-300"
      >
        🖼 background
      </button>
    </div>
  )
}
