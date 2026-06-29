'use client'

import { useState } from 'react'

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

function KofiIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.073-.408-.342-.407-.342-.709-.633-3.979-3.292-4.011-3.81C2.596 11.243 2.13 9.252 2.802 7.503c.982-2.463 3.689-2.534 4.784-1.416.144.151.236.259.236.259.132-.17.236-.259.334-.374 1.257-1.296 3.98-1.045 4.794.731.852 1.879.128 4.226-1.131 5.756z"/>
    </svg>
  )
}

export default function Footer() {
  const [copied, setCopied] = useState(false)

  function copyDiscord() {
    navigator.clipboard.writeText('magne4204').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed top-3 right-4 z-40 flex items-center gap-2">
      <button
        onClick={copyDiscord}
        title="Copy Discord username: magne4204"
        className="flex items-center gap-1.5 bg-zinc-900/70 border border-zinc-800 hover:border-indigo-500/50 hover:text-indigo-400 text-zinc-500 transition-all rounded-lg px-2.5 py-1.5 text-[11px] backdrop-blur-sm"
      >
        <DiscordIcon />
        <span>{copied ? '✓ Copied!' : 'magne4204'}</span>
      </button>

      <a
        href="https://ko-fi.com/magnen"
        target="_blank"
        rel="noopener noreferrer"
        title="Support on Ko-fi"
        className="flex items-center gap-1.5 bg-zinc-900/70 border border-zinc-800 hover:border-yellow-500/50 hover:text-yellow-400 text-zinc-500 transition-all rounded-lg px-2.5 py-1.5 text-[11px] backdrop-blur-sm"
      >
        <KofiIcon />
        <span>Ko-fi</span>
      </a>
    </div>
  )
}
