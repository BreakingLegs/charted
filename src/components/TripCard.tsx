import { Link, useNavigate } from 'react-router-dom'
import type { Trip } from '../types/trip'

interface TripCardProps {
  trip: Trip
  onDelete: (id: string) => void
}

export default function TripCard({ trip, onDelete }: TripCardProps) {
  const navigate = useNavigate()

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group block rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] p-6 transition-shadow duration-200 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 className="font-[family-name:var(--font-family-serif)] text-xl font-semibold leading-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors duration-200">
          {trip.name}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-ink-muted)]">
            {trip.destinations.length} stops
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void navigate(`/trips/${trip.id}/edit`)
            }}
            aria-label="Edit trip"
            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(trip.id)
            }}
            aria-label="Delete trip"
            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-[var(--color-ink-muted)] transition-colors hover:text-red-500"
          >
            <TrashIcon />
          </button>
        </div>
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

function EditIcon() {
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
      <path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5z" />
    </svg>
  )
}

function TrashIcon() {
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
      <path d="M2.5 4h11M6 4V2.5h4V4M5 4v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4M6.5 7v4M9.5 7v4" />
    </svg>
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
