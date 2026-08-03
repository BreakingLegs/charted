import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTripStorage } from '../hooks/useTripStorage'

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

// Legs are classified relative to the furthest destination reached so far, not just
// their own two endpoints — reaching a later stop implies every leg leading up to it
// is done, even if an intermediate stop was never individually marked visited.
function getLegStatus(legIndex: number, furthestVisitedIndex: number): LegStatus {
  if (legIndex < furthestVisitedIndex) return 'completed'
  if (legIndex === furthestVisitedIndex) return 'current'
  return 'future'
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

function createStopIcon(index: number) {
  return L.divIcon({
    className: '',
    html: `<div class="marker-pin">${String(index + 1)}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

export default function TripMapPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { trips, updateTrip } = useTripStorage()

  const trip = trips.find((t) => t.id === id)

  if (!trip) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-paper)]">
        <p className="text-[var(--color-ink-muted)]">Trip not found.</p>
      </div>
    )
  }

  function toggleVisited(index: number) {
    if (!trip) return
    const updatedDestinations = trip.destinations.map((d, i) =>
      i === index ? { ...d, visited: !d.visited } : d,
    )
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

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map */}
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
            after it's un-marked). */}
        {trip.destinations.slice(0, -1).map((_, i) => {
          const legStatus = getLegStatus(i, furthestVisitedIndex)
          return (
            <Polyline
              key={`${String(i)}-${legStatus}`}
              positions={[
                [trip.destinations[i].lat, trip.destinations[i].lng] as [number, number],
                [trip.destinations[i + 1].lat, trip.destinations[i + 1].lng] as [number, number],
              ]}
              pathOptions={LEG_PATH_OPTIONS[legStatus]}
            />
          )
        })}

        {trip.destinations.map((dest, i) => (
          <Marker key={dest.name} position={[dest.lat, dest.lng]} icon={createStopIcon(i)}>
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

      {/* Back button — offset right of Leaflet's zoom controls (~36px wide at left:10px) */}
      <button
        onClick={() => void navigate('/')}
        className="absolute left-14 top-[10px] z-[1000] flex cursor-pointer items-center gap-1.5 rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] shadow-sm transition-opacity duration-150 hover:opacity-75"
      >
        <BackArrowIcon />
        Back
      </button>

      {/* Trip info overlay */}
      <div className="absolute bottom-8 left-5 z-[1000] w-56 rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] p-5 shadow-lg">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-[var(--color-ink-muted)]">
          {trip.startDate} — {trip.endDate}
        </p>
        <h1 className="mb-4 font-[family-name:var(--font-family-serif)] text-lg font-semibold leading-tight text-[var(--color-ink)]">
          {trip.name}
        </h1>
        <ol className="space-y-2.5">
          {trip.destinations.map((dest, i) => {
            // Mirrors the route-line cascade: a stop counts as visited once the
            // traveller has reached it or anything further along the route.
            const isVisited = i <= furthestVisitedIndex
            return (
              <li
                key={dest.name}
                className="flex items-center gap-2.5 text-sm text-[var(--color-ink-muted)]"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-[10px] font-semibold text-[var(--color-paper)]">
                  {i + 1}
                </span>
                <span className={isVisited ? 'text-[var(--color-ink)]' : undefined}>
                  {dest.name}
                </span>
                {isVisited && <CheckIcon />}
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
      className="shrink-0 text-[var(--color-accent)]"
    >
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
  )
}
