import { useNavigate } from 'react-router-dom'
import TripCard from '../components/TripCard'
import { mockTrips } from '../data/mockTrips'

export default function HomePage() {
  const navigate = useNavigate()

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

          <button
            onClick={() => void navigate('/trips/new')}
            className="flex cursor-pointer items-center gap-2 rounded-sm bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-paper)] transition-opacity duration-150 hover:opacity-80"
          >
            <span className="text-base leading-none">+</span>
            New Trip
          </button>
        </header>

        {/* Trips section */}
        <section>
          <h2 className="mb-6 text-xs font-medium uppercase tracking-widest text-[var(--color-ink-muted)]">
            Your Trips
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
