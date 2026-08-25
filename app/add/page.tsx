import AddPlaceForm from '@/components/AddPlaceForm'

export const metadata = {
  title: 'Mark a place — Fearfinds',
  description: 'Drop a pin on a haunted, creepy, or mysterious site and add it to the Fearfinds map.',
}

export default function AddPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28 lg:pb-12">
      <p className="text-[11px] uppercase tracking-[0.28em] text-fear-ember">Contribute</p>
      <h1 className="font-display text-3xl sm:text-4xl">Mark a restless place</h1>
      <p className="mt-2 max-w-2xl text-fear-mute">
        Houses, ruins, rest stops, churchyards — anything that feels wrong. Pin it on OpenStreetMap, add photos and the story, then let others rate the scare.
      </p>
      <div className="mt-8">
        <AddPlaceForm />
      </div>
    </div>
  )
}
