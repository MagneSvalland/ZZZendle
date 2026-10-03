'use client'

import { useState, useRef, useEffect } from 'react'
import AgentIcon from './AgentIcon'
import type { Agent } from '@/lib/types'

interface Props {
  agents: Agent[]
  guessedIds: string[]
  disabled: boolean
  onGuess: (agentId: string) => void
}

// Matches agents whose name, or any word in it, starts with the query —
// "a" lists the A-names rather than every name containing an "a", while
// "anby" still finds "Soldier 0 - Anby". Names that start with the query
// sort first. Prefix matching keeps even a single letter to about ten
// results, so every match is shown (and only that many icons load) without
// needing a result cap.
function matchRank(name: string, query: string): number {
  const n = name.toLowerCase()
  if (n.startsWith(query)) return 0
  return n.split(/[\s-]+/).some(word => word.startsWith(query)) ? 1 : -1
}

export default function SearchInput({ agents, guessedIds, disabled, onGuess }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const q = query.trim().toLowerCase()
  const displayed = !q ? [] : agents
    .filter((agent) => !guessedIds.includes(agent.id))
    .map((agent) => ({ agent, rank: matchRank(agent.name, q) }))
    .filter((m) => m.rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .map((m) => m.agent)

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function select(agent: Agent) {
    onGuess(agent.id)
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || displayed.length === 0) {
      if (e.key === 'Enter' && displayed.length === 1) {
        select(displayed[0])
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, displayed.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (displayed[highlighted]) select(displayed[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="text"
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Game over' : 'Search for an agent…'}
        className="
          w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-4 py-3
          text-white placeholder-zinc-600 outline-none backdrop-blur-sm
          transition-all duration-200
          focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/15
          focus:shadow-[0_0_20px_rgba(250,204,21,0.10)]
          disabled:cursor-not-allowed disabled:opacity-40
        "
      />

      {open && query.length > 0 && displayed.length > 0 && !disabled && (
        <ul className="absolute z-50 mt-1.5 w-full rounded-xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl shadow-black/60 max-h-64 overflow-y-auto backdrop-blur-md">
          {displayed.map((agent, i) => (
            <li key={agent.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  select(agent)
                }}
                onMouseEnter={() => setHighlighted(i)}
                className={`
                  flex w-full items-center gap-3 px-4 py-2.5 text-left transition-all duration-150
                  ${i === highlighted
                    ? 'bg-yellow-500/10 text-white border-l-2 border-yellow-500/60'
                    : 'text-zinc-300 hover:bg-zinc-800/60 border-l-2 border-transparent'
                  }
                `}
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/50">
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                    {agent.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <AgentIcon agent={agent} sizes="32px" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{agent.name}</div>
                  <div className="text-[11px] text-zinc-500">
                    {agent.attribute} · {agent.faction}
                  </div>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    agent.rank === 'S'
                      ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                      : agent.rank === 'I'
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {agent.rank}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
