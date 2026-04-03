import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { mockTrips } from '../data/mockTrips'

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

  const trip = mockTrips.find((t) => t.id === id)

  if (!trip) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-paper)]">
        <p className="text-[var(--color-ink-muted)]">Trip not found.</p>
      </div>
    )
  }

  const positions: [number, number][] = trip.destinations.map((d) => d.coords)

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
        <Polyline
          positions={positions}
          pathOptions={{
            color: '#dc2626',
            weight: 2.5,
            dashArray: '8 6',
            lineCap: 'round',
            lineJoin: 'round',
            className: 'animated-route',
          }}
        />
        {trip.destinations.map((dest, i) => (
          <Marker key={dest.name} position={dest.coords} icon={createStopIcon(i)} />
        ))}
        <FitBounds positions={positions} />
      </MapContainer>

      {/* Back button */}
      <button
        onClick={() => void navigate('/')}
        className="absolute left-5 top-5 z-[1000] flex cursor-pointer items-center gap-1.5 rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] shadow-sm transition-opacity duration-150 hover:opacity-75"
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
          {trip.destinations.map((dest, i) => (
            <li
              key={dest.name}
              className="flex items-center gap-2.5 text-sm text-[var(--color-ink-muted)]"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-[10px] font-semibold text-[var(--color-paper)]">
                {i + 1}
              </span>
              {dest.name}
            </li>
          ))}
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
      strokeLinejoin="round"
    >
      <path d="M10 13L5 8l5-5" />
    </svg>
  )
}
