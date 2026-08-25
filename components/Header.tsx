'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Map' },
  { href: '/add', label: 'Mark a place' },
  { href: '/saved', label: 'Saved' },
  { href: '/about', label: 'About' },
]

export default function Header() {
  const path = usePathname()

  return (
    <header className="sticky top-0 z-30 h-[var(--header-h)] border-b border-fear-line/80 bg-fear-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-3 px-3 sm:px-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-full border border-fear-ember/50 bg-fear-raised shadow-glow">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-fear-ember" fill="currentColor" aria-hidden>
              <path d="M12 2c.6 4 2 6.2 4.4 8.2C19 12.4 21 15 21 18.2 21 21 17.5 23 12 23S3 21 3 18.2C3 15 5 12.4 7.6 10.2 10 8.2 11.4 6 12 2z" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-logo text-lg tracking-[0.22em] text-fear-bone sm:text-xl">FEARFINDS</span>
            <span className="hidden text-[10px] uppercase tracking-[0.28em] text-fear-ash sm:block">Chart the restless</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const on = path === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.16em] transition ${
                  on ? 'bg-fear-ember/15 text-fear-ember' : 'text-fear-mute hover:text-fear-bone'
                }`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>

        <Link href="/add" className="ff-btn px-3 py-2 text-xs uppercase tracking-[0.16em] md:hidden">
          Mark
        </Link>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-fear-blood/70 to-transparent" />
    </header>
  )
}
