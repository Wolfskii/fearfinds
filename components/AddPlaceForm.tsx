'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { CATEGORIES, CATEGORY_META, COUNTIES, PHENOMENA } from '@/lib/categories'
import { compressImage } from '@/lib/image'
import { fallbackAlias, getAlias } from '@/lib/ids'
import { usePlaces } from '@/lib/store'
import type { Category } from '@/lib/types'

const HauntedMap = dynamic(() => import('./HauntedMap'), { ssr: false })

type Hit = { lat: number; lng: number; label: string }

export default function AddPlaceForm() {
  const { addPlace, places } = usePlaces()
  const router = useRouter()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('haunted')
  const [county, setCounty] = useState('Stockholm')
  const [locality, setLocality] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [access, setAccess] = useState('Public viewing from roads / official sites only.')
  const [phenomena, setPhenomena] = useState<string[]>([])
  const [tags, setTags] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null)
  const [search, setSearch] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)

  const [author, setAuthor] = useState('Wanderer')

  useEffect(() => {
    setAuthor(getAlias() || fallbackAlias())
  }, [])

  async function lookup() {
    if (!search.trim()) return
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(search)}`)
    if (!res.ok) {
      setError('Could not search the map. Drop a pin instead.')
      return
    }
    const data = (await res.json()) as Hit[]
    setHits(data)
  }

  async function pick(lat: number, lng: number) {
    setPicked({ lat, lng })
    setFlyTo({ lat, lng, zoom: 13 })
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.locality && !locality) setLocality(data.locality)
      if (data.county) {
        const match = COUNTIES.find((c) => data.county.includes(c) || c.includes(String(data.county).replace('s län', '')))
        if (match) setCounty(match)
      }
    } catch {
      /* pin still counts */
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setError('')
    try {
      const next: string[] = []
      for (const file of Array.from(files).slice(0, 3 - photos.length)) {
        if (!file.type.startsWith('image/')) continue
        next.push(await compressImage(file))
      }
      setPhotos((prev) => [...prev, ...next].slice(0, 3))
    } catch {
      setError('Could not read that image.')
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
    const place = addPlace({
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
          <input className="ff-field" value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="Village, city, island…" />
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
        <Field label="Photos (up to 3, stored in this browser)">
          <input type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} className="text-sm text-fear-mute" />
          {photos.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="h-20 w-full rounded object-cover" />
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
            <button type="button" onClick={lookup} className="ff-btn-ghost shrink-0">
              Search
            </button>
          </div>
          {hits.length > 0 && (
            <ul className="mt-2 divide-y divide-fear-line rounded-md border border-fear-line">
              {hits.map((h) => (
                <li key={h.label}>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-fear-ash">{label}</span>
      {children}
    </div>
  )
}
