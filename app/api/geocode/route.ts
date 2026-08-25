import { NextRequest, NextResponse } from 'next/server'

const UA = 'Fearfinds/1.0 (haunted-places map; educational; https://localhost)'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  try {
    if (lat && lng) {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=jsonv2`
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, next: { revalidate: 3600 } })
      if (!res.ok) return NextResponse.json({ error: 'Reverse lookup failed' }, { status: 502 })
      const data = await res.json()
      return NextResponse.json({
        label: data.display_name as string,
        locality: data.address?.town || data.address?.city || data.address?.village || data.address?.hamlet || '',
        county: data.address?.county || data.address?.state || '',
      })
    }

    if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=6&addressdetails=1`
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, next: { revalidate: 600 } })
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
