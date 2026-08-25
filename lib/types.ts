export const CATEGORIES = [
  'haunted',
  'castle',
  'manor',
  'church',
  'cemetery',
  'ruin',
  'asylum',
  'prison',
  'abandoned',
  'legend',
] as const

export type Category = (typeof CATEGORIES)[number]

export interface Place {
  id: string
  name: string
  lat: number
  lng: number
  county: string
  locality: string
  category: Category
  tags: string[]
  summary: string
  description: string
  phenomena: string[]
  access: string
  photos: string[]
  createdAt: string
  createdBy: string
  archived?: boolean
}

export interface Rating {
  id: string
  placeId: string
  userId: string
  scare: number
  atmosphere: number
  credibility: number
  comment: string
  author: string
  createdAt: string
}

export interface Report {
  id: string
  placeId: string
  userId: string
  title: string
  body: string
  author: string
  visitedAt: string
  createdAt: string
}

export interface PlaceStats {
  avgScare: number
  avgAtmosphere: number
  avgCredibility: number
  ratingCount: number
  reportCount: number
}

export type PlaceWithStats = Place & PlaceStats
