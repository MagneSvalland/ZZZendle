import SplashGame from '@/components/SplashGame'

export const metadata = {
  title: 'ZZZendle - Splash Mode',
  description: 'Guess the daily ZZZ agent from their zoomed-in splash art.',
}

export default function SplashPage() {
  return (
    <main className="flex-1 flex flex-col">
      <SplashGame />
    </main>
  )
}
