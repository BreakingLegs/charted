export interface GeocodeResult {
  displayName: string
  lat: number
  lng: number
}

export class GeocodeError extends Error {}

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'
// Nominatim's usage policy requires a way to identify the calling application.
const USER_AGENT = 'Charted/0.0.1 (travel route planner app; contact@charted.app)'
const UNREACHABLE_MESSAGE =
  'Could not reach the geocoding service. Check your connection and try again.'

interface NominatimSearchResult {
  display_name: string
  lat: string
  lon: string
}

function isNominatimSearchResultArray(value: unknown): value is NominatimSearchResult[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item): item is NominatimSearchResult =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).display_name === 'string' &&
        typeof (item as Record<string, unknown>).lat === 'string' &&
        typeof (item as Record<string, unknown>).lon === 'string',
    )
  )
}

// Looks up a place name via Nominatim and resolves to its first (best) match.
export async function geocodePlace(query: string): Promise<GeocodeResult> {
  const trimmed = query.trim()
  if (!trimmed) {
    throw new GeocodeError('Enter a place name to search.')
  }

  const url = new URL(NOMINATIM_SEARCH_URL)
  url.searchParams.set('q', trimmed)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    })
  } catch {
    throw new GeocodeError(UNREACHABLE_MESSAGE)
  }

  if (!response.ok) {
    throw new GeocodeError(UNREACHABLE_MESSAGE)
  }

  const data: unknown = await response.json()
  if (!isNominatimSearchResultArray(data)) {
    throw new GeocodeError(UNREACHABLE_MESSAGE)
  }

  if (data.length === 0) {
    throw new GeocodeError(`No place found matching "${trimmed}".`)
  }
  const match = data[0]

  const lat = Number(match.lat)
  const lng = Number(match.lon)
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new GeocodeError(`No place found matching "${trimmed}".`)
  }

  return { displayName: match.display_name, lat, lng }
}
