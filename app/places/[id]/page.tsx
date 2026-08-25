import type { Metadata } from 'next'
import PlaceDetail from '@/components/PlaceDetail'
import { SEED_PLACES } from '@/lib/seed'

type Props = { params: { id: string } }

export function generateMetadata({ params }: Props): Metadata {
  const place = SEED_PLACES.find((p) => p.id === params.id)
  if (!place) return { title: 'Place — Fearfinds' }
  return {
    title: `${place.name} — Fearfinds`,
    description: place.summary,
  }
}

export default function PlacePage({ params }: Props) {
  return <PlaceDetail id={params.id} />
}
