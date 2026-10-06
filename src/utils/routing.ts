// Fetches real road/path geometry from the free OSRM demo server, used to
// draw car/bus/walk legs along actual roads instead of a straight line.
import type { TransportType } from '../types/trip'

export type LatLng = [number, number]
export type OsrmProfile = 'driving' | 'foot'

interface OsrmRoute {
  geometry: {
    coordinates: [number, number][]
  }
}

interface OsrmResponse {
  code: string
  routes: OsrmRoute[]
}

function isOsrmResponse(value: unknown): value is OsrmResponse {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  if (typeof candidate.code !== 'string' || !Array.isArray(candidate.routes)) return false

  return candidate.routes.every((route): route is OsrmRoute => {
    if (typeof route !== 'object' || route === null) return false
    const geometry = (route as Record<string, unknown>).geometry
    if (typeof geometry !== 'object' || geometry === null) return false
    return Array.isArray((geometry as Record<string, unknown>).coordinates)
  })
}

// car/bus share OSRM's driving profile (bus has no dedicated profile on the
// public demo server); train has no road geometry to fetch at all.
export function transportToOsrmProfile(transport: TransportType): OsrmProfile | null {
  switch (transport) {
    case 'car':
    case 'bus':
      return 'driving'
    case 'walk':
      return 'foot'
    default:
      return null
  }
}

export function osrmCacheKey(profile: OsrmProfile, from: LatLng, to: LatLng): string {
  return `${profile}:${String(from[0])},${String(from[1])};${String(to[0])},${String(to[1])}`
}

// In-memory only (not localStorage) — OSRM geometry is cheap to re-fetch on a
// fresh page load, and caching it to disk would risk serving stale routes if
// the underlying road network data changes.
const osrmCache = new Map<string, LatLng[]>()
// Tracks keys that previously failed so a render loop doesn't hammer the
// public OSRM server retrying the same failing request every re-render.
const osrmFailures = new Set<string>()

// Resolves to the route's geometry as [lat, lng] pairs, or `null` on any
// failure (network error, non-OK response, no route found) so callers can
// fall back to a straight line without their own try/catch.
export async function fetchOsrmRoute(
  profile: OsrmProfile,
  from: LatLng,
  to: LatLng,
): Promise<LatLng[] | null> {
  const key = osrmCacheKey(profile, from, to)

  const cached = osrmCache.get(key)
  if (cached) {
    console.log(`[OSRM] cache hit for ${key} (${String(cached.length)} points)`)
    return cached
  }
  if (osrmFailures.has(key)) {
    console.log(`[OSRM] skipping ${key} — previously failed`)
    return null
  }

  const coordinates = `${String(from[1])},${String(from[0])};${String(to[1])},${String(to[0])}`
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson`
  console.log(`[OSRM] fetching ${key} →`, url)

  try {
    const response = await fetch(url)
    console.log(
      `[OSRM] response for ${key}: status=${String(response.status)} ok=${String(response.ok)}`,
    )
    if (!response.ok) {
      console.error(`[OSRM] request failed for ${key}: HTTP ${String(response.status)}`)
      osrmFailures.add(key)
      return null
    }

    const data: unknown = await response.json()
    console.log(`[OSRM] parsed response for ${key}:`, data)

    if (!isOsrmResponse(data)) {
      console.error(`[OSRM] response for ${key} did not match the expected OSRM shape`, data)
      osrmFailures.add(key)
      return null
    }
    if (data.routes.length === 0) {
      console.error(`[OSRM] no routes returned for ${key}`, data)
      osrmFailures.add(key)
      return null
    }

    const points: LatLng[] = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
    console.log(
      `[OSRM] resolved ${String(points.length)} points for ${key}. First:`,
      points[0],
      'last:',
      points[points.length - 1],
    )
    osrmCache.set(key, points)
    return points
  } catch (err) {
    console.error(`[OSRM] request threw for ${key}:`, err)
    osrmFailures.add(key)
    return null
  }
}
