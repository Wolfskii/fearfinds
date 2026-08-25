'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NavInner() {
  const path = usePathname()
  const params = useSearchParams()
  const listOn = path === '/' && params.get('view') === 'list'

  const items = [
    { href: '/', label: 'Map', icon: pin, active: path === '/' && !listOn },
    { href: '/?view=list', label: 'List', icon: list, active: listOn },
    { href: '/add', label: 'Mark', icon: plus, active: path === '/add' },
    { href: '/saved', label: 'Saved', icon: heart, active: path === '/saved' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-fear-line bg-fear-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid h-[var(--nav-h)] grid-cols-4">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className={`flex h-full flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.16em] ${
                item.active ? 'text-fear-ember' : 'text-fear-ash'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function MobileNav() {
  return (
    <Suspense fallback={null}>
      <NavInner />
    </Suspense>
  )
}

const pin = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
    <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
  </svg>
)

const list = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
  </svg>
)

const plus = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
    <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
  </svg>
)

const heart = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
    <path d="M12 21s-7.2-4.4-9.3-8.2C1 9.6 2.4 6 6.2 6c2 0 3.3 1 3.8 2 .5-1 1.8-2 3.8-2 3.8 0 5.2 3.6 3.5 6.8C19.2 16.6 12 21 12 21z" />
  </svg>
)
