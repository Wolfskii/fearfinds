'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CATEGORY_META } from '@/lib/categories'
import { SWEDEN_CENTER, SWEDEN_ZOOM } from '@/lib/geo'
import type { PlaceWithStats } from '@/lib/types'
import Link from 'next/link'

function pinIcon(color: string, selected: boolean) {
  return L.divIcon({
    className: 'ff-pin-wrap',
    iconSize: selected ? [34, 42] : [26, 34],
    iconAnchor: selected ? [17, 40] : [13, 32],
    popupAnchor: [0, -28],
    html: `<div class="ff-pin ${selected ? 'is-on' : ''}" style="--pin:${color}">
      <span class="ff-pin-glow"></span>
      <svg viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" d="M12 0C6 0 1.5 4.6 1.5 10.4 1.5 18.2 12 32 12 32s10.5-13.8 10.5-21.6C22.5 4.6 18 0 12 0z"/>
        <circle cx="12" cy="11" r="4.2" fill="#1a100c"/>
        <circle cx="12" cy="11" r="2.2" fill="#ead9c6"/>
      </svg>
    </div>`,
  })
}

function FlyTo({ target }: { target: { lat: number; lng: number; zoom?: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    map.flyTo([target.lat, target.lng], target.zoom ?? 12, { duration: 1.1 })
  }, [map, target])
  return null
}

function FitFiltered({
  points,
  token,
}: {
  points: [number, number][]
  token: string
}) {
  const map = useMap()
  useEffect(() => {
    if (!token || points.length === 0) return
    if (points.length === 1) {
      map.flyTo(points[0], 10, { duration: 0.8 })
      return
    }
    map.fitBounds(points, { padding: [48, 48], maxZoom: 10, animate: true })
  }, [map, token]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function ClickPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function HauntedMap({
  places,
  selectedId,
  onSelect,
  picker,
  picked,
  onPick,
  userLocation,
  flyTo,
  fitToken,
}: {
  places: PlaceWithStats[]
  selectedId: string | null
  onSelect: (id: string) => void
  picker?: boolean
  picked?: { lat: number; lng: number } | null
  onPick?: (lat: number, lng: number) => void
  userLocation?: { lat: number; lng: number } | null
  flyTo?: { lat: number; lng: number; zoom?: number } | null
  fitToken?: string
}) {
  const icons = useMemo(() => {
    const map: Record<string, { off: L.DivIcon; on: L.DivIcon }> = {}
    for (const place of places) {
      const color = CATEGORY_META[place.category].pin
      map[place.id] = { off: pinIcon(color, false), on: pinIcon(color, true) }
    }
    return map
  }, [places])

  const points = places.map((p) => [p.lat, p.lng] as [number, number])

  return (
    <MapContainer
      center={SWEDEN_CENTER}
      zoom={SWEDEN_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
      zoomControl={!picker}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={icons[place.id]?.[place.id === selectedId ? 'on' : 'off']}
          eventHandlers={{ click: () => onSelect(place.id) }}
          zIndexOffset={place.id === selectedId ? 1000 : 0}
        >
          <Popup>
            <div className="min-w-[160px]">
              <div className="font-display text-sm">{place.name}</div>
              <div className="mt-0.5 text-[11px] text-fear-ash">
                {place.locality} · scare {place.avgScare ? place.avgScare.toFixed(1) : '—'}
              </div>
              <Link href={`/places/${place.id}`} className="mt-2 inline-block text-[11px] uppercase tracking-wider text-fear-ember">
                Open story
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={9}
          pathOptions={{ color: '#ead9c6', fillColor: '#d45b1a', fillOpacity: 0.9, weight: 2 }}
        />
      )}
      {picked && (
        <Marker
          position={[picked.lat, picked.lng]}
          icon={pinIcon('#c23030', true)}
        />
      )}
      {picker && onPick && <ClickPick onPick={onPick} />}
      <FlyTo target={flyTo || null} />
      {fitToken ? <FitFiltered points={points} token={fitToken} /> : null}
    </MapContainer>
  )
}
