'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { SEED_PLACES, SEED_RATINGS, SEED_REPORTS } from './seed'
import type { Place, PlaceStats, PlaceWithStats, Rating, Report } from './types'
import { fallbackAlias, getAlias, getUserId, setAlias as persistAlias, uid } from './ids'

const KEYS = {
  places: 'fearfinds.places',
  ratings: 'fearfinds.ratings',
  reports: 'fearfinds.reports',
  saved: 'fearfinds.saved',
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function mean(nums: number[]) {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function statsFor(placeId: string, ratings: Rating[], reports: Report[]): PlaceStats {
  const rs = ratings.filter((r) => r.placeId === placeId)
  return {
    avgScare: mean(rs.map((r) => r.scare)),
    avgAtmosphere: mean(rs.map((r) => r.atmosphere)),
    avgCredibility: mean(rs.map((r) => r.credibility)),
    ratingCount: rs.length,
    reportCount: reports.filter((r) => r.placeId === placeId).length,
  }
}

type Ctx = {
  ready: boolean
  userId: string
  alias: string
  setAlias: (name: string) => void
  places: PlaceWithStats[]
  extraPlaces: Place[]
  ratings: Rating[]
  reports: Report[]
  savedIds: string[]
  getPlace: (id: string) => PlaceWithStats | undefined
  ratingsFor: (placeId: string) => Rating[]
  reportsFor: (placeId: string) => Report[]
  addPlace: (
    place: Omit<Place, 'id' | 'createdAt' | 'archived'> & { id?: string; createdBy?: string }
  ) => Place
  removePlace: (id: string) => void
  addRating: (input: { placeId: string; scare: number; atmosphere: number; credibility: number; comment: string; author: string }) => void
  addReport: (input: { placeId: string; title: string; body: string; author: string; visitedAt: string }) => void
  toggleSaved: (id: string) => void
}

const PlacesContext = createContext<Ctx | null>(null)

export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [userId, setUserId] = useState('server')
  const [alias, setAliasState] = useState('')
  const [extraPlaces, setExtraPlaces] = useState<Place[]>([])
  const [userRatings, setUserRatings] = useState<Rating[]>([])
  const [userReports, setUserReports] = useState<Report[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])

  useEffect(() => {
    setUserId(getUserId())
    setAliasState(getAlias())
    setExtraPlaces(readJson(KEYS.places, []))
    setUserRatings(readJson(KEYS.ratings, []))
    setUserReports(readJson(KEYS.reports, []))
    setSavedIds(readJson(KEYS.saved, []))
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(KEYS.places, JSON.stringify(extraPlaces))
  }, [extraPlaces, ready])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(KEYS.ratings, JSON.stringify(userRatings))
  }, [userRatings, ready])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(KEYS.reports, JSON.stringify(userReports))
  }, [userReports, ready])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(KEYS.saved, JSON.stringify(savedIds))
  }, [savedIds, ready])

  const ratings = useMemo(() => [...SEED_RATINGS, ...userRatings], [userRatings])
  const reports = useMemo(() => [...SEED_REPORTS, ...userReports], [userReports])

  const places = useMemo<PlaceWithStats[]>(() => {
    const merged = [...SEED_PLACES, ...extraPlaces].filter((p) => !p.archived)
    return merged.map((p) => ({ ...p, ...statsFor(p.id, ratings, reports) }))
  }, [extraPlaces, ratings, reports])

  const getPlace = useCallback((id: string) => places.find((p) => p.id === id), [places])

  const ratingsFor = useCallback((placeId: string) => ratings.filter((r) => r.placeId === placeId), [ratings])
  const reportsFor = useCallback((placeId: string) => reports.filter((r) => r.placeId === placeId), [reports])

  const addPlace = useCallback<Ctx['addPlace']>((input) => {
    const place: Place = {
      ...input,
      id: input.id || uid('place'),
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy || alias || fallbackAlias(),
    }
    setExtraPlaces((prev) => [place, ...prev])
    return place
  }, [alias])

  const removePlace = useCallback((id: string) => {
    setExtraPlaces((prev) => prev.filter((p) => p.id !== id))
    setSavedIds((prev) => prev.filter((s) => s !== id))
  }, [])

  const addRating = useCallback<Ctx['addRating']>((input) => {
    const uidNow = getUserId()
    setUserRatings((prev) => {
      const rest = prev.filter((r) => !(r.placeId === input.placeId && r.userId === uidNow))
      const next: Rating = {
        id: uid('rate'),
        userId: uidNow,
        createdAt: new Date().toISOString(),
        ...input,
      }
      return [next, ...rest]
    })
    if (input.author) persistAlias(input.author)
  }, [])

  const addReport = useCallback<Ctx['addReport']>((input) => {
    const next: Report = {
      id: uid('rep'),
      userId: getUserId(),
      createdAt: new Date().toISOString(),
      ...input,
    }
    setUserReports((prev) => [next, ...prev])
    if (input.author) persistAlias(input.author)
  }, [])

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const setAlias = useCallback((name: string) => {
    persistAlias(name)
    setAliasState(name)
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      ready,
      userId,
      alias,
      setAlias,
      places,
      extraPlaces,
      ratings,
      reports,
      savedIds,
      getPlace,
      ratingsFor,
      reportsFor,
      addPlace,
      removePlace,
      addRating,
      addReport,
      toggleSaved,
    }),
    [
      ready,
      userId,
      alias,
      setAlias,
      places,
      extraPlaces,
      ratings,
      reports,
      savedIds,
      getPlace,
      ratingsFor,
      reportsFor,
      addPlace,
      removePlace,
      addRating,
      addReport,
      toggleSaved,
    ]
  )

  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>
}

export function usePlaces() {
  const ctx = useContext(PlacesContext)
  if (!ctx) throw new Error('usePlaces must be used inside PlacesProvider')
  return ctx
}
