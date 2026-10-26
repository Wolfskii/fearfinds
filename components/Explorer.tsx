'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, CATEGORY_META, COUNTIES } from '@/lib/categories'
import { formatDistance, haversineKm } from '@/lib/geo'
import { usePlaces } from '@/lib/store'
import type { Category, PlaceWithStats } from '@/lib/types'
import PlaceCard from './PlaceCard'
import Stars from './Stars'

const HauntedMap = dynamic(() => import('./HauntedMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

function MapSkeleton() {
  return (
    <div className="grid h-full place-items-center bg-fear-bg">
      <p className="animate-flicker font-display text-sm tracking-[0.3em] text-fear-ash">RAISING THE FOG…</p>
    </div>
  )
}

export default function Explorer() {
  const { places } = usePlaces()
  const router = useRouter()
  const params = useSearchParams()
  const listFirst = params.get('view') === 'list'
  const linkedId = params.get('p')

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [county, setCounty] = useState('all')
  const [minScare, setMinScare] = useState(0)
  const [sort, setSort] = useState<'scare' | 'new' | 'near' | 'az'>('scare')
  const [selectedId, setSelectedId] = useState<string | null>(params.get('p'))
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)
  const [locError, setLocError] = useState('')
  const [fitToken, setFitToken] = useState('')

  // Follow ?p=<id> links (shared links, or a card tapped in the mobile list)
  useEffect(() => {
    if (!linkedId) return
    const p = places.find((x) => x.id === linkedId)
    if (!p) return
    setSelectedId(p.id)
    setFlyTo({ lat: p.lat, lng: p.lng, zoom: 12 })
  }, [linkedId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = places.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      if (county !== 'all' && p.county !== county) return false
      if (minScare && p.avgScare < minScare) return false
      if (q) {
        const hay = `${p.name} ${p.locality} ${p.county} ${p.summary} ${p.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name)
      if (sort === 'new') return b.createdAt.localeCompare(a.createdAt)
      if (sort === 'near' && userLocation) {
        return haversineKm(userLocation, a) - haversineKm(userLocation, b)
      }
      return b.avgScare - a.avgScare || b.ratingCount - a.ratingCount
    })
    return list
  }, [places, query, category, county, minScare, sort, userLocation])

  const selected = filtered.find((p) => p.id === selectedId) || places.find((p) => p.id === selectedId) || null

  function locate() {
    setLocError('')
    if (!navigator.geolocation) {
      setLocError('Geolocation is not available in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setSort('near')
        setFlyTo({ ...loc, zoom: 9 })
      },
      () => setLocError('Location denied. Enable it to sort by nearest.'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  function dare() {
    const scary = filtered.filter((p) => p.avgScare >= 4)
    const pool = scary.length ? scary : filtered
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (pick) focus(pick)
  }

  function focus(place: PlaceWithStats) {
    // The mobile list hides the map, so jump to the map view with the pin selected
    if (listFirst && !window.matchMedia('(min-width: 1024px)').matches) {
      router.push(`/?p=${encodeURIComponent(place.id)}`)
      return
    }
    setSelectedId(place.id)
    setFlyTo({ lat: place.lat, lng: place.lng, zoom: 12 })
  }

  function applySort(next: typeof sort) {
    setSort(next)
    if (next === 'near' && !userLocation) locate()
  }

  const filtersOn = query.trim() !== '' || category !== 'all' || county !== 'all' || minScare > 0

  function resetFilters() {
    setQuery('')
    setMinScare(0)
    setCounty('all')
    setCategory('all')
    setFitToken(`reset-${Date.now()}`)
  }

  function applyCounty(next: string) {
    setCounty(next)
    setFitToken(`${next}-${category}-${Date.now()}`)
  }

  function applyCategory(next: Category | 'all') {
    setCategory(next)
    setFitToken(`${county}-${next}-${Date.now()}`)
  }

  const rated = filtered.filter((p) => p.ratingCount)
  const avg = rated.length ? rated.reduce((s, p) => s + p.avgScare, 0) / rated.length : 0

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col bg-fear-raised/95">
      <div className="border-b border-fear-line p-3 sm:p-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-fear-ember">Living atlas</p>
            <h1 className="font-display text-xl text-fear-bone sm:text-2xl">Haunted map</h1>
          </div>
          <p className="text-right text-[10px] uppercase tracking-wider text-fear-ash">
            {filtered.length} {filtered.length === 1 ? 'site' : 'sites'}
            <br />
            avg scare {Number.isFinite(avg) ? avg.toFixed(1) : '—'}
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search names, towns, tags…"
          aria-label="Search places"
          type="search"
          className="ff-field mt-3 text-sm"
        />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Chip on={category === 'all'} onClick={() => applyCategory('all')}>
            All
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} on={category === c} onClick={() => applyCategory(c)} color={CATEGORY_META[c].pin}>
              {CATEGORY_META[c].label}
            </Chip>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <select value={county} onChange={(e) => applyCounty(e.target.value)} className="ff-field text-sm" aria-label="County">
            <option value="all">All counties</option>
            {COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => applySort(e.target.value as typeof sort)} className="ff-field text-sm" aria-label="Sort">
            <option value="scare">Sort: scare</option>
            <option value="new">Sort: newest</option>
            <option value="az">Sort: name</option>
            <option value="near">Sort: nearest</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-fear-mute">
            Min scare
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={minScare}
              onChange={(e) => setMinScare(Number(e.target.value))}
              className="accent-fear-ember"
            />
            <span className="w-3">{minScare || '0'}</span>
          </label>
          <button type="button" onClick={locate} className="ff-btn-ghost px-3 py-1.5 text-xs">
            Near me
          </button>
          <button type="button" onClick={dare} className="ff-btn-ghost px-3 py-1.5 text-xs">
            Dare me
          </button>
          {filtersOn && (
            <button type="button" onClick={resetFilters} className="text-xs uppercase tracking-wider text-fear-ember">
              Clear filters
            </button>
          )}
        </div>
        {locError && <p className="mt-2 text-xs text-fear-blood">{locError}</p>}
      </div>

      <div className="ff-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {filtered.length === 0 && (
          <div className="px-2 py-8 text-center text-sm italic text-fear-ash">
            <p>Nothing in this fog. Loosen the filters or mark a new place.</p>
            {filtersOn && (
              <button type="button" onClick={resetFilters} className="ff-btn-ghost mt-3 px-3 py-1.5 text-xs not-italic">
                Clear filters
              </button>
            )}
          </div>
        )}
        {filtered.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            selected={place.id === selectedId}
            distanceKm={userLocation ? haversineKm(userLocation, place) : undefined}
            onSelect={() => focus(place)}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div className="ff-map-h grid lg:grid-cols-[minmax(280px,400px)_1fr]">
      <aside className={`${listFirst ? 'flex' : 'hidden'} relative z-20 min-h-0 lg:flex`}>{sidebar}</aside>

      <section className={`${listFirst ? 'hidden lg:block' : 'block'} relative z-0 min-h-0 overflow-hidden`}>
        <HauntedMap
          places={filtered}
          selectedId={selectedId}
          onSelect={(id) => {
            const p = places.find((x) => x.id === id)
            setSelectedId(id)
            if (p) setFlyTo({ lat: p.lat, lng: p.lng, zoom: 12 })
          }}
          userLocation={userLocation}
          flyTo={flyTo}
          fitToken={fitToken}
        />

        <div className="pointer-events-none absolute left-3 right-3 top-3 z-[500] flex flex-col items-stretch gap-2 lg:left-4">
          <div className="pointer-events-auto lg:hidden">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the fog…"
              aria-label="Search places"
              type="search"
              className="ff-field bg-fear-bg/90 text-sm backdrop-blur"
            />
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              <Chip on={category === 'all'} onClick={() => applyCategory('all')}>
                All
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip key={c} on={category === c} onClick={() => applyCategory(c)} color={CATEGORY_META[c].pin}>
                  {CATEGORY_META[c].label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex items-start justify-between gap-2">
            <div className="pointer-events-auto hidden max-w-sm rounded-md border border-fear-line/80 bg-fear-bg/80 px-3 py-2 text-xs text-fear-mute backdrop-blur md:block">
              Dark tiles by CARTO on OpenStreetMap. Pins are folklore, not a dare to trespass.
            </div>
            <div className="pointer-events-auto ml-auto flex gap-2">
              <button type="button" onClick={locate} className="ff-btn-ghost bg-fear-bg/85 px-3 py-2 text-xs backdrop-blur">
                Near me
              </button>
              <Link href="/add" className="ff-btn px-3 py-2 text-xs uppercase tracking-wider lg:hidden">
                Mark a place
              </Link>
            </div>
          </div>
        </div>

        {selected && (
          <div className="absolute bottom-3 left-3 right-3 z-[500] lg:bottom-6 lg:left-6 lg:right-auto lg:w-[380px]">
            <Peek place={selected} onClose={() => setSelectedId(null)} distanceKm={userLocation ? haversineKm(userLocation, selected) : undefined} />
          </div>
        )}

        <Legend />
      </section>
    </div>
  )
}

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-4 right-3 z-[400] hidden max-w-[160px] rounded-md border border-fear-line/80 bg-fear-bg/80 p-2 backdrop-blur lg:block">
      <p className="mb-1.5 text-[9px] uppercase tracking-[0.2em] text-fear-ash">Pin kinds</p>
      <ul className="space-y-1">
        {CATEGORIES.map((c) => (
          <li key={c} className="flex items-center gap-2 text-[10px] text-fear-mute">
            <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[c].pin, boxShadow: `0 0 8px ${CATEGORY_META[c].pin}` }} />
            {CATEGORY_META[c].label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Chip({
  children,
  on,
  onClick,
  color,
}: {
  children: React.ReactNode
  on?: boolean
  onClick?: () => void
  color?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!on}
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider ${
        on ? 'border-fear-ember bg-fear-ember/15 text-fear-bone' : 'border-fear-line bg-fear-bg/70 text-fear-ash'
      }`}
      style={on && color ? { borderColor: color, color } : undefined}
    >
      {children}
    </button>
  )
}

function Peek({ place, onClose, distanceKm }: { place: PlaceWithStats; onClose: () => void; distanceKm?: number }) {
  const meta = CATEGORY_META[place.category]
  return (
    <div className="overflow-hidden rounded-lg border border-fear-ember/40 bg-fear-bg/92 shadow-ember backdrop-blur">
      <div className="flex">
        <div className="h-28 w-24 shrink-0 sm:w-28">
          {place.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={place.photos[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-fear-panel" />
          )}
        </div>
        <div className="min-w-0 flex-1 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-fear-ember">{meta.label}</p>
              <h2 className="font-display text-lg leading-tight">{place.name}</h2>
              <p className="text-xs text-fear-ash">
                {place.locality}, {place.county}
                {distanceKm != null ? ` · ${formatDistance(distanceKm)}` : ''}
              </p>
            </div>
            <button type="button" onClick={onClose} className="text-fear-ash hover:text-fear-bone" aria-label="Close">
              ✕
            </button>
          </div>
          <div className="mt-1">
            <Stars value={place.avgScare} size="sm" />
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-fear-mute">{place.summary}</p>
          <Link href={`/places/${place.id}`} className="mt-2 inline-block text-xs uppercase tracking-[0.16em] text-fear-ember">
            Full story & rate →
          </Link>
        </div>
      </div>
    </div>
  )
}
