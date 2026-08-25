import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-[11px] uppercase tracking-[0.3em] text-fear-ember">404</p>
      <h1 className="mt-2 font-display text-4xl">Wrong turn in the fog</h1>
      <p className="mt-4 text-fear-mute">This path does not exist, or it existed and thought better of it.</p>
      <Link href="/" className="ff-btn mt-8 inline-flex">
        Return to the map
      </Link>
    </div>
  )
}
