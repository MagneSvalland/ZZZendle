import SplashGame from '@/components/SplashGame'
import AboutSection from '@/components/AboutSection'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/splash',
  title: 'Splash Art Mode – Guess the ZZZ Agent from a Portrait',
  description: 'Guess the daily Zenless Zone Zero agent from a zoomed-in crop of their splash art. Each wrong guess zooms out further.',
})

export default function SplashPage() {
  return (
    <main className="flex-1 flex flex-col">
      <SplashGame />
      <AboutSection mode="splash" />
    </main>
  )
}
