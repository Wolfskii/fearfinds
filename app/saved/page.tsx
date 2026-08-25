'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PlaceCard from '@/components/PlaceCard'
import { usePlaces } from '@/lib/store'

export default function SavedPage() {
  const { places, savedIds, ready } = usePlaces()
  const router = useRouter()
  const saved = places.filter((p) => savedIds.includes(p.id))

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-28">
      <p className="text-[11px] uppercase tracking-[0.28em] text-fear-ember">Field notes</p>
      <h1 className="font-display text-3xl sm:text-4xl">Saved places</h1>
      <p className="mt-2 text-fear-mute">Kept in this browser. Hearts do not travel with you unless you bring the device.</p>

      {!ready && <p className="mt-10 text-sm tracking-[0.2em] text-fear-ash">LOADING…</p>}

      {ready && saved.length === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-fear-line p-8 text-center">
          <p className="text-fear-mute">Nothing pocketed yet. Open a story and tap Save.</p>
          <Link href="/" className="ff-btn mt-4 inline-flex">
            Back to the map
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {saved.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onSelect={() => router.push(`/places/${place.id}`)}
            />
        ))}
      </div>
    </div>
  )
}
