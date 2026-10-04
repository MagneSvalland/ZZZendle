import EndlessGame from '@/components/EndlessGame'
import AboutSection from '@/components/AboutSection'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/endless',
  title: 'Endless Mode – Unlimited Zenless Zone Zero Wordle',
  description: 'Play unlimited rounds of the Zenless Zone Zero guessing game with a random agent every time. No daily limit.',
})

export default function EndlessPage() {
  return (
    <main className="flex-1 flex flex-col">
      <EndlessGame />
      <AboutSection mode="endless" />
    </main>
  )
}
