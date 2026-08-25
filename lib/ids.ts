export function uid(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const USER_KEY = 'fearfinds.userId'
const ALIAS_KEY = 'fearfinds.alias'

export function getUserId() {
  if (typeof window === 'undefined') return 'server'
  let id = localStorage.getItem(USER_KEY)
  if (!id) {
    id = uid('wanderer')
    localStorage.setItem(USER_KEY, id)
  }
  return id
}

export function getAlias() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(ALIAS_KEY) || ''
}

export function setAlias(name: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ALIAS_KEY, name.trim())
}

export function fallbackAlias() {
  const id = getUserId().slice(-4).toUpperCase()
  return `Wanderer ${id}`
}
