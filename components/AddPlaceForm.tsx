'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { CATEGORIES, CATEGORY_META, COUNTIES, PHENOMENA } from '@/lib/categories'
import { compressImage } from '@/lib/image'
import { fallbackAlias, getAlias } from '@/lib/ids'
import { StorageFullError, usePlaces } from '@/lib/store'
import type { Category } from '@/lib/types'

const HauntedMap = dynamic(() => import('./HauntedMap'), { ssr: false })

type Hit = { lat: number; lng: number; label: string }

const MAX_PHOTOS = 3

export default function AddPlaceForm() {
  const { addPlace, places } = usePlaces()
  const router = useRouter()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('haunted')
  const [county, setCounty] = useState('Stockholm')
  const [locality, setLocality] = useState('')
  const [localityTouched, setLocalityTouched] = useState(false)
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [access, setAccess] = useState('Public viewing from roads / official sites only.')
  const [phenomena, setPhenomena] = useState<string[]>([])
  const [tags, setTags] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null)
  const [search, setSearch] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [searching, setSearching] = useState(false)
  const [searchNote, setSearchNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)

  const [author, setAuthor] = useState('Wanderer')
  const pickSeq = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setAuthor(getAlias() || fallbackAlias())
  }, [])

  async function lookup() {
    if (!search.trim() || searching) return
    setSearching(true)
    setSearchNote('')
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(search.trim())}`)
      if (!res.ok) throw new Error()
      const data = (await res.json()) as Hit[]
      setHits(data)
      if (data.length === 0) setSearchNote('No match. Try a town name, or click the map to drop the pin by hand.')
    } catch {
      setHits([])
      setSearchNote('Could not search the map right now. Drop a pin by clicking instead.')
    } finally {
      setSearching(false)
    }
  }

  async function pick(lat: number, lng: number) {
    const seq = ++pickSeq.current
    setPicked({ lat, lng })
    setFlyTo({ lat, lng, zoom: 13 })
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
      if (!res.ok || seq !== pickSeq.current) return
      const data = (await res.json()) as { locality?: string; county?: string; countryCode?: string }
      if (seq !== pickSeq.current) return
      if (data.locality && !localityTouched) setLocality(data.locality)
      const match = matchCounty(data.county, data.countryCode)
      if (match) setCounty(match)
    } catch {
      /* pin still counts */
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setError('')
    const room = MAX_PHOTOS - photos.length
    if (files.length > room) setError(`Only ${MAX_PHOTOS} photos per place — kept the first ${room}.`)
    try {
      const next: string[] = []
      for (const file of Array.from(files).slice(0, room)) {
        if (!file.type.startsWith('image/')) continue
        next.push(await compressImage(file))
      }
      setPhotos((prev) => [...prev, ...next].slice(0, MAX_PHOTOS))
    } catch {
      setError('Could not read that image.')
    } finally {
      // Let the same file be picked again after removing it
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !description.trim()) {
      setError('Name and description are required.')
      return
    }
    if (!picked) {
      setError('Drop a pin on the map or search an address.')
      return
    }
    setBusy(true)
    let place
    try {
      place = addPlace({
        name: name.trim(),
        lat: picked.lat,
        lng: picked.lng,
        county,
        locality: locality.trim(),
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        summary: summary.trim() || description.trim().slice(0, 140),
        description: description.trim(),
        phenomena,
        access: access.trim(),
        photos,
        createdBy: author.trim() || fallbackAlias(),
      })
    } catch (err) {
      setBusy(false)
      setError(err instanceof StorageFullError ? err.message : 'Could not save this place.')
      return
    }
    router.push(`/places/${place.id}`)
  }

  function togglePhenom(p: string) {
    setPhenomena((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <Field label="Name of the place">
          <input className="ff-field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. The grey mill" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category">
            <select className="ff-field" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="County">
            <select className="ff-field" value={county} onChange={(e) => setCounty(e.target.value)}>
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Town / locality">
          <input
            className="ff-field"
            value={locality}
            onChange={(e) => {
              setLocality(e.target.value)
              setLocalityTouched(true)
            }}
            placeholder="Village, city, island…"
          />
        </Field>
        <Field label="Short hook">
          <input className="ff-field" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={160} placeholder="One line of dread" />
        </Field>
        <Field label="The story">
          <textarea
            className="ff-field min-h-[140px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="History, folklore, what people report. Keep it yours — don’t paste other sites."
          />
        </Field>
        <Field label="How to visit (access)">
          <input className="ff-field" value={access} onChange={(e) => setAccess(e.target.value)} />
        </Field>
        <Field label="Reported phenomena">
          <div className="flex flex-wrap gap-2">
            {PHENOMENA.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePhenom(p)}
                className={`rounded-full border px-3 py-1 text-xs ${phenomena.includes(p) ? 'border-fear-ember bg-fear-ember/15 text-fear-bone' : 'border-fear-line text-fear-ash'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Tags (comma separated)">
          <input className="ff-field" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="overnight, grey lady, cellar" />
        </Field>
        <Field label={`Photos (up to ${MAX_PHOTOS}, stored in this browser)`}>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            disabled={photos.length >= MAX_PHOTOS}
            onChange={(e) => onFiles(e.target.files)}
            className="text-sm text-fear-mute disabled:opacity-50"
          />
          {photos.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {photos.map((src, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo ${i + 1}`} className="h-20 w-full rounded object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-xs text-fear-bone hover:text-fear-blood"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>
        <Field label="Your name on the pin">
          <input className="ff-field" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </Field>
      </div>

      <div className="space-y-3">
        <Field label="Find a location">
          <div className="flex gap-2">
            <input
              className="ff-field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Address or place name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  lookup()
                }
              }}
            />
            <button type="button" onClick={lookup} disabled={searching} className="ff-btn-ghost shrink-0">
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>
          {searchNote && <p className="mt-2 text-xs text-fear-ash">{searchNote}</p>}
          {hits.length > 0 && (
            <ul className="mt-2 divide-y divide-fear-line rounded-md border border-fear-line">
              {hits.map((h, i) => (
                <li key={`${h.lat},${h.lng},${i}`}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-fear-mute hover:bg-fear-panel hover:text-fear-bone"
                    onClick={() => {
                      pick(h.lat, h.lng)
                      setHits([])
                      setSearch(h.label)
                    }}
                  >
                    {h.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Field>
        <p className="text-xs text-fear-ash">Click the map to drop a pin. OpenStreetMap / Nominatim, no API key.</p>
        <div className="h-[320px] overflow-hidden rounded-lg border border-fear-line sm:h-[420px] lg:h-[560px]">
          <HauntedMap
            places={places}
            selectedId={null}
            onSelect={() => {}}
            picker
            picked={picked}
            onPick={pick}
            flyTo={flyTo}
          />
        </div>
        {picked && (
          <p className="text-xs text-fear-mute">
            Pin: {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
          </p>
        )}
        {error && <p className="text-sm text-fear-blood">{error}</p>}
        <div className="sticky bottom-[calc(var(--nav-h)+0.5rem)] z-20 flex gap-2 bg-fear-bg/90 py-2 backdrop-blur lg:static">
          <button type="submit" disabled={busy} className="ff-btn flex-1 uppercase tracking-[0.16em]">
            {busy ? 'Binding the pin…' : 'Add to the map'}
          </button>
        </div>
        <p className="text-xs italic text-fear-mist">
          Pins live in your browser for now. Do not mark private homes as tourist spots. Never trespass.
        </p>
      </div>
    </form>
  )
}

function matchCounty(raw?: string, countryCode?: string): string | undefined {
  if (countryCode && countryCode !== 'se') return 'Other'
  if (!raw) return undefined
  // Nominatim returns e.g. "Stockholms län" or "Västra Götalands län"
  const name = raw.replace(/\s+län$/i, '').replace(/s$/, '')
  return COUNTIES.find((c) => c === name || c === raw || raw.startsWith(c))
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-fear-ash">{label}</span>
      {children}
    </div>
  )
}
