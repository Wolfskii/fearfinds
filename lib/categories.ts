import { CATEGORIES, type Category } from './types'

export { CATEGORIES }

export const CATEGORY_META: Record<
  Category,
  { label: string; pin: string; hint: string }
> = {
  haunted: { label: 'Haunted house', pin: '#c23030', hint: 'Homes and lodgings that will not stay quiet' },
  castle: { label: 'Castle', pin: '#d45b1a', hint: 'Keeps, palaces, and stone that remembers' },
  manor: { label: 'Manor', pin: '#c9a227', hint: 'Country houses, rectories, and old estates' },
  church: { label: 'Church', pin: '#7a8aa0', hint: 'Chapels, parish churches, and holy ground' },
  cemetery: { label: 'Cemetery', pin: '#6f8f72', hint: 'Graveyards, burial grounds, and cairns' },
  ruin: { label: 'Ruin', pin: '#a09078', hint: 'Collapsed walls and open sky' },
  asylum: { label: 'Asylum', pin: '#b56b2a', hint: 'Hospitals, sanatoriums, and locked wards' },
  prison: { label: 'Prison', pin: '#8a6a55', hint: 'Cells, yards, and the echo of keys' },
  abandoned: { label: 'Abandoned', pin: '#8d8078', hint: 'Left behind, boarded, or half-forgotten' },
  legend: { label: 'Urban legend', pin: '#8b3d6b', hint: 'Stories that move — trains, graves, roads' },
}

export const COUNTIES = [
  'Blekinge',
  'Dalarna',
  'Gotland',
  'Gävleborg',
  'Halland',
  'Jämtland',
  'Jönköping',
  'Kalmar',
  'Kronoberg',
  'Norrbotten',
  'Skåne',
  'Stockholm',
  'Södermanland',
  'Uppsala',
  'Värmland',
  'Västerbotten',
  'Västernorrland',
  'Västmanland',
  'Västra Götaland',
  'Örebro',
  'Östergötland',
  'Other',
] as const

export const PHENOMENA = [
  'Apparitions',
  'Footsteps',
  'Voices',
  'Knocking',
  'Cold spots',
  'Moving objects',
  'Lights',
  'Odors',
  'Shadow figures',
  'Crying',
  'Animals reacting',
] as const
