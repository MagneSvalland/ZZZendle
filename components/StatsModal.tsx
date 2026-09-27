'use client'

import type { StatsData } from '@/lib/stats'
import ShareButtons from './ShareButtons'
import type { StreakData } from '@/lib/types'

interface Props {
  mode: string
  stats: StatsData
  streakData: StreakData
  shareText?: string
  onClose: () => void
}

const DIST_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', 'X']

function StatBox({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="text-2xl font-black text-white tabular-nums">{value}</div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider text-center leading-tight">{label}</div>
    </div>
  )
}

export default function StatsModal({ mode, stats, streakData, shareText, onClose }: Props) {
  const winPct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0
  const maxCount = Math.max(1, ...Object.values(stats.distribution))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl w-full max-w-sm mx-4 shadow-2xl shadow-black/70 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Statistics</div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-6">

          {/* Top stats row */}
          <div className="grid grid-cols-4 gap-2">
            <StatBox value={stats.played} label="Played" />
            <StatBox value={`${winPct}%`} label="Won" />
            <StatBox value={streakData.streak} label="Streak" />
            <StatBox value={streakData.bestStreak} label="Best" />
          </div>

          {/* Distribution */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Guess Distribution</div>
            <div className="flex flex-col gap-1.5">
              {DIST_KEYS.map(k => {
                const count = stats.distribution[k] ?? 0
                const width = Math.max(8, Math.round((count / maxCount) * 100))
                const isX = k === 'X'
                return (
                  <div key={k} className="flex items-center gap-2">
                    <div className={`text-[11px] font-bold w-4 text-right shrink-0 ${isX ? 'text-red-400' : 'text-zinc-400'}`}>
                      {k}
                    </div>
                    <div className="flex-1 h-5 bg-zinc-800 rounded-sm overflow-hidden">
                      <div
                        className={`h-full rounded-sm flex items-center justify-end pr-1.5 transition-all duration-500 ${
                          isX ? 'bg-red-700/70' : 'bg-yellow-500/80'
                        }`}
                        style={{ width: `${width}%` }}
                      >
                        {count > 0 && (
                          <span className="text-[10px] font-bold text-black/80">{count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {shareText && (
            <div className="flex flex-col gap-2 pt-1 border-t border-zinc-800">
              <div className="text-[9px] text-zinc-700 font-mono whitespace-pre leading-relaxed">{shareText}</div>
              <div className="flex gap-2">
                <ShareButtons shareText={shareText} large />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
