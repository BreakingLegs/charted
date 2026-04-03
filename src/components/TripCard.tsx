import { Link } from 'react-router-dom'
import type { Trip } from '../types/trip'

interface TripCardProps {
  trip: Trip
}

export default function TripCard({ trip }: TripCardProps) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group block rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] p-6 transition-shadow duration-200 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 className="font-[family-name:var(--font-family-serif)] text-xl font-semibold leading-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors duration-200">
          {trip.name}
        </h2>
        <span className="shrink-0 rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-ink-muted)]">
          {trip.stops} stops
        </span>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
        {trip.destinations.map((d) => d.name).join(' → ')}
      </p>

      <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
        <CalendarIcon />
        <span>
          {trip.startDate} — {trip.endDate}
        </span>
      </div>
    </Link>
  )
}

function CalendarIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="3" width="14" height="12" rx="1.5" />
      <path d="M1 7h14M5 1v4M11 1v4" />
    </svg>
  )
}
