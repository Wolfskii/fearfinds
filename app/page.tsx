import { Suspense } from 'react'
import Explorer from '@/components/Explorer'

export default function Home() {
  return (
    <Suspense fallback={<p className="px-4 py-24 text-center text-sm tracking-[0.3em] text-fear-ash">RAISING THE FOG…</p>}>
      <Explorer />
    </Suspense>
  )
}
