interface Props {
  className?: string
  zSize?: string
  dleSize?: string
}

export default function ZZZdleLogo({
  zSize = 'text-4xl',
  dleSize = 'text-4xl',
}: Props) {
  // Rendered as the page's <h1> — it's the only heading at the top of each
  // game page (each page shows exactly one logo).
  return (
    <h1 className="flex items-end leading-none select-none">
      <span
        className={`font-black ${zSize} text-white tracking-tighter leading-none`}
        style={{ letterSpacing: '-0.06em', fontStyle: 'oblique 6deg' }}
      >
        ZZZ
      </span>
      <span
        className={`font-black ${dleSize} text-yellow-400 leading-none pb-0.5`}
        style={{ letterSpacing: '-0.01em' }}
      >
        endle
      </span>
    </h1>
  )
}
