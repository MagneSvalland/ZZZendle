import { GITHUB_URL } from '@/lib/links'

export default function Footer() {
  return (
    <footer className="relative z-10 py-3 px-4 text-center">
      <p className="text-[10px] text-yellow-500/70">
        Fan-made project · Not affiliated with HoYoverse or Zenless Zone Zero · All game assets belong to their respective owners.
      </p>
      <p className="text-[10px] text-yellow-500/70 mt-1">
        ZZZendle is open source ·{' '}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-300 transition-colors">
          GitHub
        </a>{' '}
        · Suggest improvements!
      </p>
    </footer>
  )
}
