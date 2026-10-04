import EmojiGame from '@/components/EmojiGame'
import AboutSection from '@/components/AboutSection'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/emoji',
  title: 'Emoji Mode – Guess the ZZZ Agent from Emojis',
  description: 'Guess the daily Zenless Zone Zero agent from emoji clues. More emojis are revealed with every guess in this ZZZdle emoji mode.',
})

export default function EmojiPage() {
  return (
    <main className="flex-1 flex flex-col">
      <EmojiGame />
      <AboutSection mode="emoji" />
    </main>
  )
}
