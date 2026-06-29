interface Props {
  className?: string
  zSize?: string
  dleSize?: string
}

export default function ZZZdleLogo({
  zSize = 'text-4xl',
  dleSize = 'text-4xl',
}: Props) {
  return (
    <div className="flex items-end leading-none select-none">
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
    </div>
  )
}
