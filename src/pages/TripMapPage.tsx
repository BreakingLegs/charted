import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTripStorage } from '../hooks/useTripStorage'
import { useOsrmGeometry } from '../hooks/useOsrmGeometry'
import type { OsrmLegRequest } from '../hooks/useOsrmGeometry'
import { osrmCacheKey, transportToOsrmProfile } from '../utils/routing'
import type { LatLng } from '../utils/routing'
import { boatCurvePoints, flightArcPoints } from '../utils/curves'
import type { Destination, TransportType, Trip } from '../types/trip'

type LegStatus = 'completed' | 'current' | 'future'

const LEG_PATH_OPTIONS: Record<LegStatus, L.PathOptions> = {
  completed: {
    color: '#dc2626',
    weight: 4,
    opacity: 1,
    lineCap: 'round',
    lineJoin: 'round',
  },
  current: {
    color: '#dc2626',
    weight: 4,
    dashArray: '10 14',
    lineCap: 'round',
    lineJoin: 'round',
    className: 'animated-route',
  },
  future: {
    color: '#dc2626',
    weight: 4,
    opacity: 0.3,
    lineCap: 'round',
    lineJoin: 'round',
  },
}

// Boat legs get their own style (blue + dashed, to read as "over water")
// layered on top of the same visited-state opacity/animation rules as every
// other transport type.
function pathOptionsForLeg(
  transport: TransportType | undefined,
  legStatus: LegStatus,
): L.PathOptions {
  if (transport === 'boat') {
    return {
      color: '#2563eb',
      weight: 4,
      dashArray: '8 8',
      opacity: legStatus === 'future' ? 0.3 : 1,
      lineCap: 'round',
      lineJoin: 'round',
      ...(legStatus === 'current' ? { className: 'animated-route' } : {}),
    }
  }
  return LEG_PATH_OPTIONS[legStatus]
}

// Legs are classified relative to the furthest destination reached so far, not just
// their own two endpoints — reaching a later stop implies every leg leading up to it
// is done, even if an intermediate stop was never individually marked visited.
function getLegStatus(legIndex: number, furthestVisitedIndex: number): LegStatus {
  if (legIndex < furthestVisitedIndex) return 'completed'
  if (legIndex === furthestVisitedIndex) return 'current'
  return 'future'
}

// Resolves the geometry a leg should actually be drawn with: a flight arc
// between airports, a bezier curve over water for a boat, fetched road/path
// geometry for car/bus/walk (falling back to a straight line until it
// arrives, or forever if OSRM failed), or a plain straight line otherwise.
function legPoints(
  origin: Destination,
  destination: Destination,
  osrmGeometry: Record<string, LatLng[]>,
): LatLng[] {
  const straight: [LatLng, LatLng] = [
    [origin.lat, origin.lng],
    [destination.lat, destination.lng],
  ]

  const transport = origin.transportToNext
  if (!transport) return straight

  if (transport === 'plane') {
    const departure = origin.departureAirport
    const arrival = origin.arrivalAirport
    if (departure && arrival) {
      return flightArcPoints([departure.lat, departure.lng], [arrival.lat, arrival.lng])
    }
    // No airports chosen (e.g. older data) — still draw an arc, just between
    // the two destinations' own coordinates.
    return flightArcPoints(straight[0], straight[1])
  }

  if (transport === 'boat') {
    return boatCurvePoints(straight[0], straight[1])
  }

  const profile = transportToOsrmProfile(transport)
  if (profile) {
    const key = osrmCacheKey(profile, straight[0], straight[1])
    const hasGeometry = key in osrmGeometry
    console.log(
      `[legPoints] ${transport} leg ${key}:`,
      hasGeometry
        ? `using ${String(osrmGeometry[key].length)} OSRM points`
        : 'no geometry yet — straight line fallback',
    )
    return osrmGeometry[key] ?? straight
  }

  return straight
}

function midpointOf(points: LatLng[]): LatLng {
  if (points.length === 2) {
    return [(points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2]
  }
  return points[Math.floor(points.length / 2)]
}

// Builds the set of legs that need road/path geometry from OSRM (car, bus,
// walk) — called unconditionally on every render, including before `trip`
// is known to exist, since it feeds a hook that itself must run
// unconditionally.
function buildOsrmLegRequests(trip: Trip | undefined): OsrmLegRequest[] {
  if (!trip) return []

  const requests: OsrmLegRequest[] = []
  trip.destinations.slice(0, -1).forEach((origin, i) => {
    const destination = trip.destinations[i + 1]
    const profile = origin.transportToNext ? transportToOsrmProfile(origin.transportToNext) : null
    if (!profile) return

    const from: LatLng = [origin.lat, origin.lng]
    const to: LatLng = [destination.lat, destination.lng]
    requests.push({ key: osrmCacheKey(profile, from, to), profile, from, to })
  })
  console.log(
    `[buildOsrmLegRequests] trip "${trip.name}" needs OSRM for ${String(requests.length)} leg(s):`,
    requests.map((r) => r.key),
  )
  return requests
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [80, 80] })
    } else if (positions.length === 1) {
      map.setView(positions[0], 10)
    }
  }, [map, positions])
  return null
}

function createStopIcon(index: number, isTourTarget: boolean) {
  return L.divIcon({
    className: '',
    html: `<div class="marker-pin"${isTourTarget ? ' data-tour="destination-marker"' : ''}>${String(index + 1)}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

const TRANSPORT_ICON_SVG: Record<TransportType, string> = {
  plane:
    '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="14.7,1.3 10,14.7 7.3,8.7 1.3,6" /><line x1="14.7" y1="1.3" x2="7.3" y2="8.7" /></svg>',
  car: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 10V8.2a1 1 0 0 1 .6-.9L4.5 6.6 5.7 4h4.6l1.2 2.6 1.4.7a1 1 0 0 1 .6.9V10" /><path d="M1.5 10h13" /><circle cx="4.7" cy="10" r="1.2" /><circle cx="11.3" cy="10" r="1.2" /></svg>',
  train:
    '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="1.5" width="9" height="8.5" rx="2" /><path d="M3.5 6.3h9" /><circle cx="5.7" cy="12.3" r="1" /><circle cx="10.3" cy="12.3" r="1" /><path d="M5.7 10.2v1.1M10.3 10.2v1.1" /></svg>',
  boat: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10h12l-1.6 3.1a1 1 0 0 1-.9.6H4.5a1 1 0 0 1-.9-.6L2 10z" /><path d="M8 10V2" /><path d="M8 2.8l3.6 2.8H8z" /></svg>',
  bus: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2.5" width="12" height="8" rx="1.5" /><path d="M2 6.5h12" /><path d="M5 2.5v4M11 2.5v4" /><circle cx="5" cy="12.3" r="1.1" /><circle cx="11" cy="12.3" r="1.1" /></svg>',
  walk: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9.3" cy="2.3" r="1.2" fill="currentColor" stroke="none" /><path d="M8 4.2L6.7 8l2 1.3-.4 4.2" /><path d="M8 4.2l2.8.7-.6 2.9" /><path d="M6.7 8l-2.4 2" /><path d="M9.6 10.4l1.9 2.8" /></svg>',
}

function createTransportIcon(transport: TransportType, legStatus: LegStatus) {
  const fadedClass = legStatus === 'future' ? ' transport-icon-faded' : ''
  return L.divIcon({
    className: '',
    html: `<div class="transport-icon${fadedClass}">${TRANSPORT_ICON_SVG[transport]}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

export default function TripMapPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { trips, updateTrip } = useTripStorage()

  const trip = trips.find((t) => t.id === id)

  // Hooks must run unconditionally, before the `!trip` early return below —
  // `buildOsrmLegRequests` tolerates an undefined trip for exactly that
  // reason.
  const { geometry: osrmGeometry, loadingKeys: osrmLoadingKeys } = useOsrmGeometry(
    buildOsrmLegRequests(trip),
  )

  if (!trip) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-paper)]">
        <p className="text-[var(--color-ink-muted)]">Trip not found.</p>
      </div>
    )
  }

  // Marking a stop visited implies every stop before it was reached too;
  // unmarking it implies every stop after it hasn't been reached yet. This
  // keeps `visited` itself always forming a prefix of the route, rather than
  // relying on the sidebar's cascade display to paper over gaps — shared by
  // both the sidebar checkboxes and the map marker popups, since both call
  // this same function.
  function toggleVisited(index: number) {
    if (!trip) return
    const willBeVisited = !trip.destinations[index].visited
    const updatedDestinations = trip.destinations.map((d, i) => {
      if (willBeVisited && i <= index) return { ...d, visited: true }
      if (!willBeVisited && i >= index) return { ...d, visited: false }
      return d
    })
    updateTrip({ ...trip, destinations: updatedDestinations })
  }

  // The furthest destination the traveller has reached; -1 if none are visited yet
  const furthestVisitedIndex = trip.destinations.reduce<number>(
    (furthest, dest, i) => (dest.visited ? i : furthest),
    -1,
  )

  const positions: [number, number][] = trip.destinations.map((d): [number, number] => [
    d.lat,
    d.lng,
  ])

  const isFetchingRoutes = osrmLoadingKeys.size > 0

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map — wrapped in a full-bleed div so the guided tour has a stable
          element to attach its "this is your route" step to. */}
      <div data-tour="route-map" className="absolute inset-0">
        <MapContainer
          center={positions[0]}
          zoom={6}
          className="vintage-map h-full w-full"
          zoomControl
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* One Polyline per leg so each can have independent styling. The leg status is
              folded into the key so a status change remounts the Leaflet layer instead of
              mutating it in place — Leaflet's setStyle() merges options rather than
              replacing them, so properties like dashArray/className can otherwise linger
              from a previous status (e.g. a leg that was ever "current" staying dashed
              after it's un-marked). The geometry itself (straight/road/arc/curve) is kept
              out of the key, so an OSRM response arriving later updates the line's shape
              in place instead of remounting it. A transport-type badge is placed at each
              leg's midpoint when a transportToNext is set. */}
          {trip.destinations.slice(0, -1).flatMap((origin, i) => {
            const destination = trip.destinations[i + 1]
            const legStatus = getLegStatus(i, furthestVisitedIndex)
            const points = legPoints(origin, destination, osrmGeometry)

            const legElements = [
              <Polyline
                key={`leg-${String(i)}-${legStatus}`}
                positions={points}
                pathOptions={pathOptionsForLeg(origin.transportToNext, legStatus)}
              />,
            ]

            if (origin.transportToNext) {
              legElements.push(
                <Marker
                  key={`transport-${String(i)}-${legStatus}`}
                  position={midpointOf(points)}
                  icon={createTransportIcon(origin.transportToNext, legStatus)}
                  interactive={false}
                />,
              )
            }

            return legElements
          })}

          {trip.destinations.map((dest, i) => (
            <Marker
              key={dest.name}
              position={[dest.lat, dest.lng]}
              icon={createStopIcon(i, i === 0)}
            >
              <Popup minWidth={170}>
                <div className="px-0.5 py-0.5">
                  <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">{dest.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      toggleVisited(i)
                    }}
                    className="w-full cursor-pointer rounded-sm bg-[var(--color-ink)] px-3 py-1.5 text-xs font-medium text-[var(--color-paper)] transition-opacity duration-150 hover:opacity-80"
                  >
                    {dest.visited ? 'Mark as not visited' : 'Mark as visited'}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
          <FitBounds positions={positions} />
        </MapContainer>
      </div>

      {/* Back button — offset right of Leaflet's zoom controls (~36px wide at left:10px) */}
      <button
        data-tour="map-back-button"
        onClick={() => void navigate('/')}
        className="absolute left-14 top-[10px] z-[1000] flex cursor-pointer items-center gap-1.5 rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] shadow-sm transition-opacity duration-150 hover:opacity-75"
      >
        <BackArrowIcon />
        Back
      </button>

      {/* Loading indicator while OSRM road/path geometry is being fetched */}
      {isFetchingRoutes && (
        <div className="absolute right-4 top-[10px] z-[1000] flex items-center gap-2 rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] px-3 py-2 text-xs font-medium text-[var(--color-ink-muted)] shadow-sm">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-ink-muted)]" />
          Fetching routes…
        </div>
      )}

      {/* Trip info overlay — capped height (clearing the back button and
          Leaflet's zoom control up top, both anchored at top-left) with the
          destination list scrolling internally once it outgrows that cap,
          rather than the whole panel growing past the edge of the screen. */}
      <div
        data-tour="trip-sidebar"
        className="absolute bottom-8 left-5 z-[1000] flex max-h-[calc(100vh-8.5rem)] w-56 flex-col rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] p-5 shadow-lg"
      >
        <p className="mb-1 shrink-0 text-[10px] font-medium uppercase tracking-widest text-[var(--color-ink-muted)]">
          {trip.startDate} — {trip.endDate}
        </p>
        <h1 className="mb-4 shrink-0 font-[family-name:var(--font-family-serif)] text-lg font-semibold leading-tight text-[var(--color-ink)]">
          {trip.name}
        </h1>
        <ol className="min-h-0 space-y-2.5 overflow-y-auto pr-1">
          {trip.destinations.map((dest, i) => {
            // Mirrors the route-line cascade: a stop counts as visited once the
            // traveller has reached it or anything further along the route.
            // This only affects the name's text color — the checkbox below
            // reflects (and toggles) this specific stop's own visited flag,
            // same as the "Mark as visited" button in its map popup.
            const isVisited = i <= furthestVisitedIndex
            return (
              <li
                key={dest.name}
                className="flex items-center gap-2.5 text-sm text-[var(--color-ink-muted)]"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-[10px] font-semibold text-[var(--color-paper)]">
                  {i + 1}
                </span>
                <span className={`flex-1 truncate ${isVisited ? 'text-[var(--color-ink)]' : ''}`}>
                  {dest.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    toggleVisited(i)
                  }}
                  aria-pressed={dest.visited}
                  aria-label={
                    dest.visited
                      ? `Mark ${dest.name} as not visited`
                      : `Mark ${dest.name} as visited`
                  }
                  className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors ${
                    dest.visited
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)]'
                      : 'border-[var(--color-border)] text-transparent hover:border-[var(--color-ink-muted)]'
                  }`}
                >
                  <CheckIcon />
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

function BackArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
  )
}
