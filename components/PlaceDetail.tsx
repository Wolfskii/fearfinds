'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { CATEGORY_META } from '@/lib/categories'
import { formatDistance, haversineKm } from '@/lib/geo'
import { fallbackAlias, getAlias } from '@/lib/ids'
import { usePlaces } from '@/lib/store'
import { SEED_PLACES } from '@/lib/seed'
import Stars from './Stars'

const HauntedMap = dynamic(() => import('./HauntedMap'), { ssr: false })

export default function PlaceDetail({ id }: { id: string }) {
  const { ready, places, getPlace, ratingsFor, reportsFor, addRating, addReport, savedIds, toggleSaved, removePlace, userId } =
    usePlaces()
  const router = useRouter()
  const place = getPlace(id)
  const [photo, setPhoto] = useState(0)

  if (!ready) {
    return <p className="animate-flicker px-4 py-24 text-center text-sm tracking-[0.3em] text-fear-ash">RAISING THE FOG…</p>
  }

  if (!place) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">This pin has gone cold</h1>
        <p className="mt-3 text-fear-ash">No place with that id. It may have been cleared from this browser.</p>
        <Link href="/" className="ff-btn mt-6 inline-flex">
          Back to the map
        </Link>
      </div>
    )
  }

  const ratings = ratingsFor(place.id)
  const reports = reportsFor(place.id)
  const isSeed = SEED_PLACES.some((p) => p.id === place.id)
  const nearby = places
    .filter((p) => p.id !== place.id)
    .map((p) => ({ p, km: haversineKm(place, p) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 4)
  const saved = savedIds.includes(place.id)
  const meta = CATEGORY_META[place.category]
  const osm = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`

  return (
    <article className="pb-24 lg:pb-12">
      <div className="relative h-[42vw] min-h-[220px] max-h-[420px] overflow-hidden border-b border-fear-line">
        {place.photos[photo] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={place.photos[photo]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-fear-panel to-fear-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-fear-bg via-fear-bg/30 to-black/30" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-5xl px-4 pb-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-fear-ember">{meta.label} · {place.county}</p>
          <h1 className="font-display text-3xl text-fear-bone sm:text-5xl">{place.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-fear-mute sm:text-base">{place.summary}</p>
        </div>
      </div>

      {place.photos.length > 1 && (
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3">
          {place.photos.map((src, i) => (
            <button key={src + i} type="button" onClick={() => setPhoto(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded border ${i === photo ? 'border-fear-ember' : 'border-fear-line'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Stars value={place.avgScare} />
            <span className="text-xs text-fear-ash">{place.ratingCount} ratings · {place.reportCount} witness notes</span>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <Stat label="Scare" value={place.avgScare} />
            <Stat label="Atmosphere" value={place.avgAtmosphere} />
            <Stat label="Conviction" value={place.avgCredibility} />
          </dl>
          <p className="mt-6 whitespace-pre-wrap text-[17px] leading-relaxed text-fear-mute">{place.description}</p>

          {place.phenomena.length > 0 && (
            <div className="mt-6">
              <h2 className="font-display text-lg">Reported phenomena</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {place.phenomena.map((p) => (
                  <li key={p} className="ff-chip">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 rounded-lg border border-fear-line bg-fear-panel/60 p-4 text-sm text-fear-mute">
            <h2 className="font-display text-base text-fear-bone">Access</h2>
            <p className="mt-1">{place.access}</p>
            <p className="mt-2 text-xs text-fear-ash">Fearfinds is a map of stories. Private property stays private. No breaking in, no night raids on graves.</p>
          </div>

          <section className="mt-10">
            <h2 className="font-display text-2xl">Rate the dread</h2>
            <RatingBox
              onSubmit={(data) => addRating({ placeId: place.id, ...data })}
              existing={ratings.find((r) => r.userId === userId)}
            />
            <ul className="mt-4 space-y-3">
              {ratings.map((r) => (
                <li key={r.id} className="border-b border-fear-line/60 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-fear-bone">{r.author}</span>
                    <Stars value={r.scare} size="sm" />
                  </div>
                  {r.comment && <p className="mt-1 text-sm italic text-fear-mute">{r.comment}</p>}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl">Witness notes</h2>
            <ReportBox onSubmit={(data) => addReport({ placeId: place.id, ...data })} />
            <ul className="mt-4 space-y-4">
              {reports.map((r) => (
                <li key={r.id} className="rounded-md border border-fear-line bg-fear-raised/80 p-4">
                  <h3 className="font-display text-lg">{r.title}</h3>
                  <p className="text-[11px] uppercase tracking-wider text-fear-ash">
                    {r.author}
                    {r.visitedAt ? ` · visited ${r.visitedAt}` : ''}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-fear-mute">{r.body}</p>
                </li>
              ))}
              {reports.length === 0 && <p className="text-sm italic text-fear-ash">No notes yet. If you went, write what happened.</p>}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="h-56 overflow-hidden rounded-lg border border-fear-line">
            <HauntedMap
              places={places.filter((p) => nearby.some((n) => n.p.id === p.id) || p.id === place.id)}
              selectedId={place.id}
              onSelect={(pid) => router.push(`/places/${pid}`)}
              flyTo={{ lat: place.lat, lng: place.lng, zoom: 11 }}
            />
          </div>
          <p className="text-xs text-fear-ash">
            {place.lat.toFixed(4)}, {place.lng.toFixed(4)} · {place.locality}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => toggleSaved(place.id)} className="ff-btn-ghost flex-1">
              {saved ? 'Saved' : 'Save'}
            </button>
            <a href={osm} target="_blank" rel="noreferrer" className="ff-btn-ghost flex-1 text-center">
              OpenStreetMap
            </a>
            <ShareButton name={place.name} />
          </div>
          {!isSeed && (
            <button
              type="button"
              className="w-full text-xs uppercase tracking-wider text-fear-blood"
              onClick={() => {
                if (confirm('Remove this pin from this browser?')) {
                  removePlace(place.id)
                  router.push('/')
                }
              }}
            >
              Remove my pin
            </button>
          )}
          <p className="text-[11px] text-fear-mist">Pinned by {place.createdBy}</p>
          <div>
            <h2 className="font-display text-lg">Nearby unrest</h2>
            <ul className="mt-2 space-y-2">
              {nearby.map(({ p, km }) => (
                <li key={p.id}>
                  <Link href={`/places/${p.id}`} className="flex items-center justify-between rounded border border-fear-line px-3 py-2 text-sm hover:border-fear-ember/50">
                    <span>{p.name}</span>
                    <span className="text-xs text-fear-ash">{formatDistance(km)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-fear-line bg-fear-raised px-2 py-3">
      <div className="font-display text-xl text-fear-ember">{value ? value.toFixed(1) : '—'}</div>
      <div className="mt-1 uppercase tracking-wider text-fear-ash">{label}</div>
    </div>
  )
}

function ShareButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="ff-btn-ghost flex-1"
      onClick={async () => {
        const url = window.location.href
        try {
          if (navigator.share) await navigator.share({ title: name, url })
          else {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }
        } catch {
          await navigator.clipboard.writeText(url)
          setCopied(true)
        }
      }}
    >
      {copied ? 'Copied' : 'Share'}
    </button>
  )
}

function RatingBox({
  onSubmit,
  existing,
}: {
  existing?: { scare: number; atmosphere: number; credibility: number; comment: string }
  onSubmit: (data: { scare: number; atmosphere: number; credibility: number; comment: string; author: string }) => void
}) {
  const [scare, setScare] = useState(existing?.scare || 4)
  const [atmosphere, setAtmosphere] = useState(existing?.atmosphere || 4)
  const [credibility, setCredibility] = useState(existing?.credibility || 3)
  const [comment, setComment] = useState(existing?.comment || '')
  const [author, setAuthor] = useState('Wanderer')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setAuthor(getAlias() || fallbackAlias())
  }, [])

  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ scare, atmosphere, credibility, comment, author })
    setDone(true)
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-fear-line bg-fear-raised/70 p-4">
      <Row label="Scare">{<Stars value={scare} onChange={setScare} />}</Row>
      <Row label="Atmosphere">{<Stars value={atmosphere} onChange={setAtmosphere} />}</Row>
      <Row label="How convincing">{<Stars value={credibility} onChange={setCredibility} />}</Row>
      <input className="ff-field" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Name" />
      <textarea className="ff-field min-h-[80px]" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional note" />
      <button type="submit" className="ff-btn">
        {existing || done ? 'Update rating' : 'Leave rating'}
      </button>
    </form>
  )
}

function ReportBox({
  onSubmit,
}: {
  onSubmit: (data: { title: string; body: string; author: string; visitedAt: string }) => void
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [visitedAt, setVisitedAt] = useState('')
  const [author, setAuthor] = useState('Wanderer')

  useEffect(() => {
    setAuthor(getAlias() || fallbackAlias())
  }, [])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    onSubmit({ title: title.trim(), body: body.trim(), author, visitedAt })
    setTitle('')
    setBody('')
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-fear-line bg-fear-raised/70 p-4">
      <input className="ff-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
      <textarea className="ff-field min-h-[100px]" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What did you see, hear, or refuse to explain?" required />
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="ff-field" type="date" value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} />
        <input className="ff-field" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Name" />
      </div>
      <button type="submit" className="ff-btn-ghost">
        Add witness note
      </button>
    </form>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-wider text-fear-ash">{label}</span>
      {children}
    </div>
  )
}
