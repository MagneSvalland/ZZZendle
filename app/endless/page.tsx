import EndlessGame from '@/components/EndlessGame'

export const metadata = {
  title: 'ZZZendle — Endless Mode',
  description: 'Guess random Zenless Zone Zero agents back-to-back for as long as you like.',
}

export default function EndlessPage() {
  return (
    <main className="min-h-screen">
      <EndlessGame />
    </main>
  )
}
