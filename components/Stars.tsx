'use client'

export default function Stars({
  value,
  onChange,
  size = 'md',
  label,
}: {
  value: number
  onChange?: (n: number) => void
  size?: 'sm' | 'md'
  label?: string
}) {
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
  const rounded = Math.round(value)

  return (
    <div className="inline-flex items-center gap-0.5" role={onChange ? 'radiogroup' : 'img'} aria-label={label || `Rating ${value.toFixed(1)} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = onChange ? n <= value : n <= rounded
        const star = (
          <svg viewBox="0 0 20 20" className={`${dim} ${filled ? 'text-fear-ember' : 'text-fear-line'}`} fill="currentColor">
            <path d="M10 1.5 12.4 7l6 .5-4.6 4 1.4 5.8L10 14.6 4.8 17.3 6.2 11.5 1.6 7.5 7.6 7 10 1.5z" />
          </svg>
        )
        if (!onChange) return <span key={n}>{star}</span>
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            className="rounded p-0.5 transition hover:scale-110"
            onClick={() => onChange(n)}
          >
            {star}
          </button>
        )
      })}
      {!onChange && <span className="ml-1 text-xs text-fear-ash">{value ? value.toFixed(1) : '—'}</span>}
    </div>
  )
}
