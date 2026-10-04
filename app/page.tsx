import Game from '@/components/Game'
import AboutSection from '@/components/AboutSection'
import { pageMetadata, DEFAULT_DESCRIPTION } from '@/lib/seo'

export const metadata = pageMetadata({ path: '/', description: DEFAULT_DESCRIPTION })

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <Game />
      <AboutSection mode="classic" />
    </main>
  )
}
