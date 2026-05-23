import type { LocationQuery, LocationQueryRaw } from 'vue-router'

export function readRouteQuery(value: unknown) {
  return Array.isArray(value) ? value[0] || '' : typeof value === 'string' ? value : ''
}

function flattenSearchValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(flattenSearchValues)
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(flattenSearchValues)
  }

  return [String(value ?? '')]
}

export function normalizeSearchTokens(query: string) {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

export function matchesSearchTokens(values: unknown[], query: string) {
  const tokens = normalizeSearchTokens(query)

  if (!tokens.length) {
    return true
  }

  const searchText = flattenSearchValues(values).join(' ').toLowerCase()
  return tokens.every((token) => searchText.includes(token))
}

export function withSearchQuery(
  currentQuery: LocationQuery,
  key: string,
  value: string,
  clearKeys: string[] = [],
): LocationQueryRaw {
  const nextQuery: LocationQueryRaw = { ...currentQuery }

  clearKeys.forEach((clearKey) => {
    delete nextQuery[clearKey]
  })

  const normalizedValue = value.trim()

  if (normalizedValue) {
    nextQuery[key] = normalizedValue
  } else {
    delete nextQuery[key]
  }

  return nextQuery
}
