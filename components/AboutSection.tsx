import Link from 'next/link'

// Short, visible description below each game. The game itself renders almost
// no crawlable text, so this is what tells search engines what the page is
// (using the terms people actually search for — see lib/seo.ts).

export type AboutMode = 'classic' | 'quote' | 'emoji' | 'splash' | 'endless'

const MODES: { mode: AboutMode; href: string; label: string; blurb: string }[] = [
  { mode: 'classic', href: '/', label: 'Classic', blurb: 'compare faction, element, specialty, rarity, gender and release version until you find the agent.' },
  { mode: 'quote', href: '/quote', label: 'Quote', blurb: 'guess who said an in-game voice line.' },
  { mode: 'emoji', href: '/emoji', label: 'Emoji', blurb: 'guess the agent from a set of emoji clues.' },
  { mode: 'splash', href: '/splash', label: 'Splash', blurb: 'guess the agent from a zoomed-in crop of their splash art.' },
  { mode: 'endless', href: '/endless', label: 'Endless', blurb: 'unlimited rounds with a random agent each time.' },
]

const INTRO: Record<AboutMode, { heading: string; text: string }> = {
  classic: {
    heading: 'Daily Zenless Zone Zero Wordle',
    text: 'ZZZendle is a free daily guessing game for Zenless Zone Zero fans: a ZZZ Wordle, or ZZZdle, where everyone gets the same mystery agent each day. Every guess shows which traits match, so you can narrow it down in as few tries as possible.',
  },
  quote: {
    heading: 'ZZZ Quote Mode',
    text: 'Read a voice line from Zenless Zone Zero and guess which agent said it. A new quote every day, the same for every player, like a Wordle for ZZZ quotes.',
  },
  emoji: {
    heading: 'ZZZ Emoji Mode',
    text: 'Work out which Zenless Zone Zero agent the emojis describe. More emoji hints unlock with each wrong guess, and there is a new agent every day.',
  },
  splash: {
    heading: 'ZZZ Splash Art Mode',
    text: 'Start from a tight crop of an agent’s splash art and guess who it is. Each wrong guess zooms out a little more. A new Zenless Zone Zero portrait every day.',
  },
  endless: {
    heading: 'Endless Zenless Zone Zero Wordle',
    text: 'No daily limit: guess random Zenless Zone Zero agents back-to-back for as long as you like. Perfect for practising before the daily ZZZdle.',
  },
}

export default function AboutSection({ mode }: { mode: AboutMode }) {
  const intro = INTRO[mode]
  return (
    <section className="relative z-10 mx-4 sm:mx-auto mt-6 mb-2 sm:w-full max-w-2xl rounded-xl border border-zinc-800/60 bg-zinc-950/70 px-4 py-3.5 text-xs leading-relaxed text-zinc-400 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-zinc-300">{intro.heading}</h2>
      <p className="mt-1.5">{intro.text}</p>
      <h3 className="mt-4 font-semibold text-zinc-300">Game modes</h3>
      <ul className="mt-1.5 space-y-1">
        {MODES.map((m) => (
          <li key={m.mode}>
            <Link href={m.href} prefetch={false} className="text-yellow-500/80 hover:text-yellow-300 transition-colors">
              {m.label}
            </Link>
            {' – '}
            {m.blurb}
          </li>
        ))}
      </ul>
    </section>
  )
}
