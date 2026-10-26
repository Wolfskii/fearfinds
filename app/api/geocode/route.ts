import { NextRequest, NextResponse } from 'next/server'

const UA = 'Fearfinds/1.0 (haunted-places map; educational; https://localhost)'

type Address = {
  town?: string
  city?: string
  village?: string
  hamlet?: string
  municipality?: string
  county?: string
  state?: string
  country_code?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim().slice(0, 200)
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))
  const headers = {
    'User-Agent': UA,
    Accept: 'application/json',
    'Accept-Language': req.headers.get('accept-language') || 'en',
  }

  try {
    if (searchParams.has('lat') || searchParams.has('lng')) {
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
      }
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=14`
      const res = await fetch(url, { headers, next: { revalidate: 3600 } })
      if (!res.ok) return NextResponse.json({ error: 'Reverse lookup failed' }, { status: 502 })
      const data = (await res.json()) as { display_name?: string; address?: Address }
      const a = data.address || {}
      return NextResponse.json({
        label: data.display_name || '',
        locality: a.town || a.city || a.village || a.hamlet || a.municipality || '',
        county: a.county || a.state || '',
        countryCode: a.country_code || '',
      })
    }

    if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=6&addressdetails=1`
    const res = await fetch(url, { headers, next: { revalidate: 600 } })
    if (!res.ok) return NextResponse.json({ error: 'Search failed' }, { status: 502 })
    const data = await res.json()
    return NextResponse.json(
      (Array.isArray(data) ? data : []).map((hit: { lat: string; lon: string; display_name: string }) => ({
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        label: hit.display_name,
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Geocoder unavailable' }, { status: 502 })
  }
}
