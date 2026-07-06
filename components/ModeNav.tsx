'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MODES = [
  { label: 'Classic', icon: '🎮', href: '/' },
  { label: 'Quote',   icon: '💬', href: '/quote' },
  { label: 'Emoji',   icon: '😀', href: '/emoji' },
  { label: 'Splash',  icon: '🖼️', href: '/splash' },
  { label: 'Endless', icon: '♾️', href: '/endless' },
]

export default function ModeNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1.5 flex-wrap justify-center rounded-xl bg-zinc-900/70 border border-zinc-700/40 p-1.5 backdrop-blur-sm">
      {MODES.map(({ label, icon, href }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`
              flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold
              transition-all duration-200
              ${active
                ? 'bg-yellow-500/12 text-yellow-300 border border-yellow-400/35 shadow-[0_0_12px_rgba(250,204,21,0.15),inset_0_0_8px_rgba(250,204,21,0.04)]'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/50 border border-transparent hover:border-zinc-600/40 hover:shadow-[0_0_8px_rgba(250,204,21,0.06)]'
              }
            `}
          >
            <span className="text-base leading-none">{icon}</span>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
