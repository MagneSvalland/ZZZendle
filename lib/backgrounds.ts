// Single source of truth for the selectable page backgrounds. Shared by the
// root layout (server-rendered initial background) and BackgroundManager
// (the picker), so the first paint already shows the default and visitors
// don't download a background that gets swapped out immediately.
//
// On each game update: add the new agent's background, then set DEFAULT_KEY
// and FORCE_VERSION (in BackgroundManager) to its key.

export type BackgroundOption = { key: string; label: string; url: string }

export const BACKGROUNDS: BackgroundOption[] = [
  { key: 'roxy', label: 'Roxy', url: '/roxy_background_2.jpeg' },
  { key: 'claret', label: 'Claret', url: '/claret_background.png' },
  { key: 'wise', label: 'Wise', url: '/wise_background.jpeg' },
  { key: 'remielle', label: 'Remielle', url: '/remielle_background.jpeg' },
  { key: 'original', label: 'Original', url: '/dhs8uis-2c9f5bda-287e-42a7-8d63-a51df778ead7.png' },
]

export const DEFAULT_KEY = 'roxy'

export const DEFAULT_BG_URL = (BACKGROUNDS.find(b => b.key === DEFAULT_KEY) ?? BACKGROUNDS[0]).url
