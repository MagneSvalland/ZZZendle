import QuoteGame from '@/components/QuoteGame'

export const metadata = {
  title: 'ZZZendle - Quote Mode',
  description: 'Guess the daily ZZZ agent from their in-game quote.',
}

export default function QuotePage() {
  return (
    <main className="flex-1 flex flex-col">
      <QuoteGame />
    </main>
  )
}
