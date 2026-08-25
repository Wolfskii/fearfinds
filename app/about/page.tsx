'use client'

import Link from 'next/link'
import { CATEGORY_META } from '@/lib/categories'
import { usePlaces } from '@/lib/store'

export default function AboutPage() {
  const { places } = usePlaces()
  const counties = new Set(places.map((p) => p.county)).size

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-28">
      <p className="text-[11px] uppercase tracking-[0.28em] text-fear-ember">The atlas</p>
      <h1 className="font-display text-4xl">Fearfinds</h1>
      <p className="mt-4 text-lg leading-relaxed text-fear-mute">
        A dark map of haunted houses, ruins, asylums, churchyards, and urban legends. Anyone can drop a pin, add photographs, write the folklore, and rate how badly a place wants to be left alone.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md border border-fear-line bg-fear-raised py-4">
          <div className="font-display text-2xl text-fear-ember">{places.length}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-fear-ash">Places</div>
        </div>
        <div className="rounded-md border border-fear-line bg-fear-raised py-4">
          <div className="font-display text-2xl text-fear-ember">{counties}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-fear-ash">Counties</div>
        </div>
        <div className="rounded-md border border-fear-line bg-fear-raised py-4">
          <div className="font-display text-2xl text-fear-ember">{Object.keys(CATEGORY_META).length}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-fear-ash">Kinds of dread</div>
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl">The map</h2>
      <p className="mt-3 leading-relaxed text-fear-mute">
        Tiles are <a className="text-fear-ember underline-offset-2 hover:underline" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> rendered by{' '}
        <a className="text-fear-ember underline-offset-2 hover:underline" href="https://carto.com/attributions">CARTO Dark Matter</a>
        — no Google key, no paid map. Search uses Nominatim. Pins you add are stored in this browser for now.
      </p>

      <h2 className="mt-10 font-display text-2xl">Starting places</h2>
      <p className="mt-3 leading-relaxed text-fear-mute">
        The first pins are original write-ups of well-known Swedish folklore sites, inspired by public stories and by catalogues such as{' '}
        <a className="text-fear-ember underline-offset-2 hover:underline" href="https://spokhus.se/">spokhus.se</a>,{' '}
        <a className="text-fear-ember underline-offset-2 hover:underline" href="https://spokkartan.se">spokkartan.se</a>, and{' '}
        <a className="text-fear-ember underline-offset-2 hover:underline" href="https://hemsoktaplatser.se/">hemsoktaplatser.se</a>
        . Fearfinds is not affiliated with those sites. Descriptions here are not copied from them. Atmosphere photos are stock, not documentary shots of each house — add your own when you have been there.
      </p>

      <h2 className="mt-10 font-display text-2xl">House rules</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-fear-mute">
        <li>Do not trespass. A pin is not an invitation through a locked door.</li>
        <li>Cemeteries and churches are for the living and the dead, not for stunts.</li>
        <li>Private farms stay private. Mark them as view-from-the-road if at all.</li>
        <li>Rate honestly. A beautiful ruin can scare without a single ghost.</li>
      </ul>

      <Link href="/" className="ff-btn mt-10 inline-flex">
        Open the map
      </Link>
    </div>
  )
}
