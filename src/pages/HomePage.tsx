import { useNavigate } from 'react-router-dom'
import TripCard from '../components/TripCard'
import { useTripStorage } from '../hooks/useTripStorage'
import { useTour } from '../tour/TourContext'

export default function HomePage() {
  const navigate = useNavigate()
  const { trips, deleteTrip } = useTripStorage()
  const { startTour } = useTour()

  function handleDeleteTrip(id: string) {
    if (!window.confirm('Are you sure you want to delete this trip?')) return
    deleteTrip(id)
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <header className="mb-12 flex items-end justify-between border-b border-[var(--color-border)] pb-8">
          <div>
            <h1 className="font-[family-name:var(--font-family-serif)] text-5xl font-bold tracking-tight text-[var(--color-ink)]">
              Charted.
            </h1>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Plan your journey.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startTour}
              aria-label="Take the guided tour"
              title="Take the guided tour"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              ?
            </button>
            <button
              data-tour="new-trip-button"
              onClick={() => void navigate('/trips/new')}
              className="flex cursor-pointer items-center gap-2 rounded-sm bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-paper)] transition-opacity duration-150 hover:opacity-80"
            >
              <span className="text-base leading-none">+</span>
              New Trip
            </button>
          </div>
        </header>

        {/* Trips section */}
        <section data-tour="your-trips">
          <h2 className="mb-6 text-xs font-medium uppercase tracking-widest text-[var(--color-ink-muted)]">
            Your Trips
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip, i) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onDelete={handleDeleteTrip}
                tourTarget={i === 0}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
