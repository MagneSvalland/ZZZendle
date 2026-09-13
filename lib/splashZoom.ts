// Zoom % per wrong guess in the live splash game (index 0 = first guess,
// the most zoomed-in and hardest to read). Shared between SplashGame.tsx
// (the actual gameplay crop) and SplashConfigurator.tsx (the /debug preview)
// so the preview always crops at the same starting zoom as real play — a
// focus point that looks right at a gentler zoom can crop down to a
// completely different, unrecognizable body part at the real starting zoom.
export const SPLASH_ZOOM_LEVELS = [520, 420, 340, 275, 220, 180, 155, 135]
