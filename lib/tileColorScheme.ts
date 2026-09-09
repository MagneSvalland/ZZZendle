// Two selectable presets for the guess-tile colors (GuessRow.tsx) — 'vivid'
// is the current flat green/amber/red look, 'classic' restores the original
// yellow/orange/gray-with-glow look for people who preferred it. Persisted
// per-visitor in localStorage; each mode page (Game.tsx, EndlessGame.tsx)
// reads it independently on mount, same pattern as everything else here.
export type TileColorScheme = 'vivid' | 'classic'

export const TILE_SCHEME_KEY = 'zzzendle-tile-color-scheme'
export const DEFAULT_TILE_SCHEME: TileColorScheme = 'vivid'

export function loadTileScheme(): TileColorScheme {
  try {
    const saved = localStorage.getItem(TILE_SCHEME_KEY)
    if (saved === 'vivid' || saved === 'classic') return saved
  } catch { /* ignore */ }
  return DEFAULT_TILE_SCHEME
}

export function saveTileScheme(scheme: TileColorScheme) {
  try {
    localStorage.setItem(TILE_SCHEME_KEY, scheme)
  } catch { /* ignore */ }
}

interface SchemePreset {
  exact: string
  partial: string
  none: string
  tileShadow: string // outer box shadow (or glow) on the tile itself
  textShadow: string // shadow behind the tile letters
  correctRow: string // GuessRow border+bg when that guess was the answer
  correctName: string // agent-name text color in that same row
  legendExact: string
  legendPartial: string
  legendNone: string
}

export const TILE_SCHEMES: Record<TileColorScheme, SchemePreset> = {
  vivid: {
    exact: 'bg-green-700 text-white',
    partial: 'bg-amber-600 text-white',
    none: 'bg-red-700 text-white',
    tileShadow: 'shadow-[3px_3px_6px_rgba(0,0,0,0.45)]',
    textShadow: '[text-shadow:1px_1px_2px_rgba(0,0,0,0.55)]',
    correctRow: 'border-green-500/40 bg-green-950/10',
    correctName: 'text-green-300',
    legendExact: 'bg-green-700',
    legendPartial: 'bg-amber-600',
    legendNone: 'bg-red-700',
  },
  classic: {
    exact: 'bg-yellow-500 text-black shadow-[0_0_14px_rgba(250,204,21,0.65)]',
    partial: 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.55)]',
    none: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50',
    tileShadow: '',
    textShadow: '',
    correctRow: 'border-yellow-500/40 bg-yellow-950/10 shadow-[0_0_20px_rgba(250,204,21,0.07)]',
    correctName: 'text-yellow-300',
    legendExact: 'bg-yellow-500 shadow-[0_0_6px_rgba(250,204,21,0.6)]',
    legendPartial: 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]',
    legendNone: 'bg-zinc-800 border border-zinc-700/50',
  },
}
