'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import PlaceCard from '@/components/PlaceCard'
import { usePlaces } from '@/lib/store'

export default function SavedPage() {
  const { places, savedIds, ready, extraPlaces, exportBackup, importBackup } = usePlaces()
  const router = useRouter()
  const saved = places.filter((p) => savedIds.includes(p.id))

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-28">
      <p className="text-[11px] uppercase tracking-[0.28em] text-fear-ember">Field notes</p>
      <h1 className="font-display text-3xl sm:text-4xl">Saved places</h1>
      <p className="mt-2 text-fear-mute">Kept in this browser. Hearts do not travel with you unless you bring the device — or a backup.</p>

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
          <PlaceCard key={place.id} place={place} onSelect={() => router.push(`/places/${place.id}`)} />
        ))}
      </div>

      {ready && <Backup pinCount={extraPlaces.length} exportBackup={exportBackup} importBackup={importBackup} />}
    </div>
  )
}

function Backup({
  pinCount,
  exportBackup,
  importBackup,
}: {
  pinCount: number
  exportBackup: ReturnType<typeof usePlaces>['exportBackup']
  importBackup: ReturnType<typeof usePlaces>['importBackup']
}) {
  const input = useRef<HTMLInputElement>(null)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)

  function download() {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fearfinds-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function restore(file: File | undefined) {
    if (!file) return
    try {
      const added = importBackup(await file.text())
      setNote({
        ok: true,
        text: `Restored ${added.places} pins, ${added.ratings} ratings, and ${added.reports} witness notes. Anything already here was kept.`,
      })
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : 'Could not read that backup.' })
    } finally {
      if (input.current) input.current.value = ''
    }
  }

  return (
    <section className="mt-12 rounded-lg border border-fear-line bg-fear-raised/70 p-5">
      <h2 className="font-display text-xl">Carry your notes</h2>
      <p className="mt-1 text-sm text-fear-mute">
        Download your {pinCount} {pinCount === 1 ? 'pin' : 'pins'}, ratings, witness notes, and saved places as a file, then restore it in another browser.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={download} className="ff-btn-ghost">
          Download backup
        </button>
        <button type="button" onClick={() => input.current?.click()} className="ff-btn-ghost">
          Restore from file
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => restore(e.target.files?.[0])}
        />
      </div>
      {note && (
        <p role="status" className={`mt-3 text-sm ${note.ok ? 'text-fear-ember' : 'text-fear-blood'}`}>
          {note.text}
        </p>
      )}
    </section>
  )
}
