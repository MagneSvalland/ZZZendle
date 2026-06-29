import EmojiGame from '@/components/EmojiGame'

export const metadata = {
  title: 'ZZZendle — Emoji Mode',
  description: 'Guess the daily ZZZ agent from their emoji representation.',
}

export default function EmojiPage() {
  return (
    <main className="min-h-screen">
      <EmojiGame />
    </main>
  )
}
