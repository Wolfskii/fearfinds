'use client'

import { PlacesProvider } from '@/lib/store'

export function Providers({ children }: { children: React.ReactNode }) {
  return <PlacesProvider>{children}</PlacesProvider>
}
