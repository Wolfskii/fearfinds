'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { SEED_PLACES, SEED_RATINGS, SEED_REPORTS } from './seed'
import { CATEGORIES, type Place, type PlaceStats, type PlaceWithStats, type Rating, type Report } from './types'
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

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export class StorageFullError extends Error {
  constructor() {
    super('This browser is out of room for Fearfinds. Remove a photo or two, or clear old pins, and try again.')
  }
}

export type Backup = {
  app: 'fearfinds'
  version: 1
  exportedAt: string
  places: Place[]
  ratings: Rating[]
  reports: Report[]
  saved: string[]
}

function isPlace(x: unknown): x is Place {
  const p = x as Place
  return (
    !!p &&
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    (CATEGORIES as readonly string[]).includes(p.category) &&
    Array.isArray(p.tags) &&
    Array.isArray(p.phenomena) &&
    Array.isArray(p.photos)
  )
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const known = new Set(current.map((x) => x.id))
  const fresh = incoming.filter((x) => x && typeof x.id === 'string' && !known.has(x.id))
  return { merged: [...fresh, ...current], added: fresh.length }
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
  removeReport: (id: string) => void
  addRating: (input: { placeId: string; scare: number; atmosphere: number; credibility: number; comment: string; author: string }) => void
  addReport: (input: { placeId: string; title: string; body: string; author: string; visitedAt: string }) => void
  toggleSaved: (id: string) => void
  storageError: string
  exportBackup: () => Backup
  importBackup: (raw: string) => { places: number; ratings: number; reports: number }
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
  const [storageError, setStorageError] = useState('')
  const extraRef = useRef<Place[]>([])
  extraRef.current = extraPlaces

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
    setStorageError(writeJson(KEYS.places, extraPlaces) ? '' : new StorageFullError().message)
  }, [extraPlaces, ready])

  useEffect(() => {
    if (!ready) return
    setStorageError(writeJson(KEYS.ratings, userRatings) ? '' : new StorageFullError().message)
  }, [userRatings, ready])

  useEffect(() => {
    if (!ready) return
    setStorageError(writeJson(KEYS.reports, userReports) ? '' : new StorageFullError().message)
  }, [userReports, ready])

  useEffect(() => {
    if (!ready) return
    setStorageError(writeJson(KEYS.saved, savedIds) ? '' : new StorageFullError().message)
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
    // Write synchronously so a full quota surfaces to the form instead of failing silently
    const next = [place, ...extraRef.current]
    if (!writeJson(KEYS.places, next)) throw new StorageFullError()
    setExtraPlaces(next)
    return place
  }, [alias])

  const removePlace = useCallback((id: string) => {
    setExtraPlaces((prev) => prev.filter((p) => p.id !== id))
    setSavedIds((prev) => prev.filter((s) => s !== id))
  }, [])

  const removeReport = useCallback((id: string) => {
    setUserReports((prev) => prev.filter((r) => r.id !== id))
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

  const exportBackup = useCallback<Ctx['exportBackup']>(
    () => ({
      app: 'fearfinds',
      version: 1,
      exportedAt: new Date().toISOString(),
      places: extraPlaces,
      ratings: userRatings,
      reports: userReports,
      saved: savedIds,
    }),
    [extraPlaces, userRatings, userReports, savedIds]
  )

  const importBackup = useCallback<Ctx['importBackup']>(
    (raw) => {
      let data: Partial<Backup>
      try {
        data = JSON.parse(raw)
      } catch {
        throw new Error('That file is not valid JSON.')
      }
      if (data?.app !== 'fearfinds') throw new Error('That file is not a Fearfinds backup.')
      const p = mergeById(extraPlaces, Array.isArray(data.places) ? data.places.filter(isPlace) : [])
      const r = mergeById(userRatings, Array.isArray(data.ratings) ? data.ratings : [])
      const n = mergeById(userReports, Array.isArray(data.reports) ? data.reports : [])
      const saved = Array.from(new Set([...savedIds, ...(Array.isArray(data.saved) ? data.saved : [])]))
      if (!writeJson(KEYS.places, p.merged)) throw new StorageFullError()
      setExtraPlaces(p.merged)
      setUserRatings(r.merged)
      setUserReports(n.merged)
      setSavedIds(saved)
      return { places: p.added, ratings: r.added, reports: n.added }
    },
    [extraPlaces, userRatings, userReports, savedIds]
  )

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
      removeReport,
      addRating,
      addReport,
      toggleSaved,
      storageError,
      exportBackup,
      importBackup,
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
      removeReport,
      addRating,
      addReport,
      toggleSaved,
      storageError,
      exportBackup,
      importBackup,
    ]
  )

  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>
}

export function usePlaces() {
  const ctx = useContext(PlacesContext)
  if (!ctx) throw new Error('usePlaces must be used inside PlacesProvider')
  return ctx
}
