'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Something in the walls gave way</h1>
      <p className="mt-3 text-fear-mute">The page failed to load. Try again, or return to the map.</p>
      <button type="button" onClick={reset} className="ff-btn mt-6">
        Try again
      </button>
    </div>
  )
}
