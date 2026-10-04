import { ImageResponse } from 'next/og'

// Link preview image (Discord, Reddit, X, Google). Generated once at build
// time — no request-time rendering.

export const alt = 'ZZZendle – Daily Zenless Zone Zero Wordle'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 60%, #422006 100%)',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', fontSize: 168, fontWeight: 900, letterSpacing: '-0.04em' }}>
          <span style={{ color: 'white' }}>ZZZ</span>
          <span style={{ color: '#facc15' }}>endle</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 48, color: '#e4e4e7' }}>Daily Zenless Zone Zero Wordle</div>
        <div style={{ marginTop: 28, fontSize: 30, color: '#a1a1aa' }}>
          Classic · Quote · Emoji · Splash · Endless
        </div>
      </div>
    ),
    size,
  )
}
