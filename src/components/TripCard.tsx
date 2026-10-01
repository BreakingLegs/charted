import { Link, useNavigate } from 'react-router-dom'
import type { Trip } from '../types/trip'

interface TripCardProps {
  trip: Trip
  onDelete: (id: string) => void
  /** Marks this card as the guided tour's "click a trip" target. */
  tourTarget?: boolean
}

export default function TripCard({ trip, onDelete, tourTarget = false }: TripCardProps) {
  const navigate = useNavigate()

  return (
    <Link
      to={`/trips/${trip.id}`}
      data-tour={tourTarget ? 'trip-card' : undefined}
      className="group block rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] p-6 transition-shadow duration-200 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 className="min-w-0 flex-1 truncate font-[family-name:var(--font-family-serif)] text-xl font-semibold leading-tight text-[var(--color-ink)] transition-colors duration-200 group-hover:text-[var(--color-accent)]">
          {trip.name}
        </h2>
        <span className="shrink-0 rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-ink-muted)]">
          {trip.destinations.length} stops
        </span>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
        {trip.destinations.map((d) => d.name).join(' → ')}
      </p>

      <div className="mb-5 flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
        <CalendarIcon />
        <span>
          {trip.startDate} — {trip.endDate}
        </span>
      </div>

      {/* Actions live in their own row so a long trip name can never push them out of view */}
      <div className="flex items-center gap-2 border-t border-[var(--color-border)] pt-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void navigate(`/trips/${trip.id}/edit`)
          }}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          <EditIcon />
          Edit
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete(trip.id)
          }}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:border-red-500 hover:text-red-500"
        >
          <TrashIcon />
          Delete
        </button>
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
