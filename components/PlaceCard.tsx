'use client'

import Link from 'next/link'
import { CATEGORY_META } from '@/lib/categories'
import type { PlaceWithStats } from '@/lib/types'
import Stars from './Stars'

export default function PlaceCard({
  place,
  distanceKm,
  selected,
  onSelect,
  compact,
}: {
  place: PlaceWithStats
  distanceKm?: number
  selected?: boolean
  onSelect?: () => void
  compact?: boolean
}) {
  const meta = CATEGORY_META[place.category]
  const photo = place.photos[0]

  return (
    <article
      className={`overflow-hidden rounded-lg border bg-fear-panel/90 shadow-sm transition ${
        selected ? 'border-fear-ember shadow-ember' : 'border-fear-line hover:border-fear-ember/40'
      }`}
    >
      <button type="button" onClick={onSelect} className="flex w-full text-left">
        <div className={`relative shrink-0 overflow-hidden bg-fear-raised ${compact ? 'h-20 w-20' : 'h-24 w-28 sm:h-28 sm:w-32'}`}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover opacity-90" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-fear-line to-fear-bg" />
          )}
          <span className="absolute left-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-fear-bone">
            {meta.label}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between p-2.5 sm:p-3">
          <div>
            <h3 className="font-display text-sm text-fear-bone sm:text-base">{place.name}</h3>
            <p className="mt-0.5 truncate text-xs text-fear-ash">
              {place.locality}
              {place.locality ? ', ' : ''}
              {place.county}
              {distanceKm != null ? ` · ${distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}` : ''}
            </p>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <Stars value={place.avgScare} size="sm" label="Scare" />
            <span className="text-[10px] uppercase tracking-wider text-fear-mist">{place.ratingCount} rates</span>
          </div>
        </div>
      </button>
      {!compact && (
        <div className="flex items-center justify-between border-t border-fear-line/70 px-3 py-2">
          <p className="mr-2 line-clamp-1 text-xs italic text-fear-mute">{place.summary}</p>
          <Link href={`/places/${place.id}`} className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-fear-ember">
            Story →
          </Link>
        </div>
      )}
    </article>
  )
}
