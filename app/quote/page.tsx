import QuoteGame from '@/components/QuoteGame'
import AboutSection from '@/components/AboutSection'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/quote',
  title: 'Quote Mode – Guess the ZZZ Agent from a Voice Line',
  description: 'Guess the daily Zenless Zone Zero agent from one of their in-game quotes. A ZZZ Wordle quote mode with a new voice line every day.',
})

export default function QuotePage() {
  return (
    <main className="flex-1 flex flex-col">
      <QuoteGame />
      <AboutSection mode="quote" />
    </main>
  )
}
