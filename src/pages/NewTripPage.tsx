import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TextInput from '../components/ui/TextInput'
import DatePicker from '../components/ui/DatePicker'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import { useTripStorage } from '../hooks/useTripStorage'
import { geocodePlace, GeocodeError } from '../utils/geocoding'
import type { Destination, TransportType, Trip } from '../types/trip'

interface DestEntry {
  key: number
  name: string
  draftName: string
  lat: number
  lng: number
  visited: boolean
  isSearching: boolean
  searchError?: string
  transport: TransportType | ''
}

interface FormErrors {
  name?: string
  destinations?: string
}

const TRANSPORT_OPTIONS: Array<{ value: TransportType; label: string }> = [
  { value: 'plane', label: 'Plane' },
  { value: 'car', label: 'Car' },
  { value: 'train', label: 'Train' },
  { value: 'boat', label: 'Boat' },
  { value: 'bus', label: 'Bus' },
]

function formatDisplayDate(isoDate: string): string {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Inverse of formatDisplayDate, for pre-filling <input type="date"> when editing.
function parseDisplayDate(display: string): string {
  if (!display) return ''
  const parsed = new Date(display)
  if (Number.isNaN(parsed.getTime())) return ''
  const yyyy = String(parsed.getFullYear())
  const mm = String(parsed.getMonth() + 1).padStart(2, '0')
  const dd = String(parsed.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// A destination's "Via" transport is stored as transportToNext on the *previous*
// destination, so it shifts by one when converting back into editable entries.
function tripToDestEntries(trip: Trip): DestEntry[] {
  return trip.destinations.map((d, i) => ({
    key: i,
    name: d.name,
    draftName: d.name,
    lat: d.lat,
    lng: d.lng,
    visited: d.visited,
    isSearching: false,
    transport: i > 0 ? (trip.destinations[i - 1].transportToNext ?? '') : '',
  }))
}

export default function NewTripPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { trips, saveTrip, updateTrip } = useTripStorage()

  const existingTrip = id ? trips.find((t) => t.id === id) : undefined

  const [tripName, setTripName] = useState(existingTrip?.name ?? '')
  const [startDate, setStartDate] = useState(
    existingTrip ? parseDisplayDate(existingTrip.startDate) : '',
  )
  const [endDate, setEndDate] = useState(existingTrip ? parseDisplayDate(existingTrip.endDate) : '')
  const [destinations, setDestinations] = useState<DestEntry[]>(
    existingTrip ? tripToDestEntries(existingTrip) : [],
  )
  const [keyCounter, setKeyCounter] = useState(existingTrip?.destinations.length ?? 0)
  const [errors, setErrors] = useState<FormErrors>({})

  const [query, setQuery] = useState('')
  const [pendingTransport, setPendingTransport] = useState<TransportType | ''>('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | undefined>()

  function removeDestination(key: number) {
    setDestinations((prev) => prev.filter((d) => d.key !== key))
  }

  function updateTransport(key: number, transport: TransportType | '') {
    setDestinations((prev) => prev.map((d) => (d.key === key ? { ...d, transport } : d)))
  }

  function updateDraftName(key: number, draftName: string) {
    setDestinations((prev) => prev.map((d) => (d.key === key ? { ...d, draftName } : d)))
  }

  async function handleAddDestination(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isSearching) return

    const trimmed = query.trim()
    if (!trimmed) {
      setSearchError('Enter a place name.')
      return
    }

    setIsSearching(true)
    setSearchError(undefined)

    try {
      const result = await geocodePlace(trimmed)
      setDestinations((prev) => [
        ...prev,
        {
          key: keyCounter,
          name: result.displayName,
          draftName: result.displayName,
          lat: result.lat,
          lng: result.lng,
          visited: false,
          isSearching: false,
          transport: pendingTransport,
        },
      ])
      setKeyCounter((k) => k + 1)
      setQuery('')
      setPendingTransport('')
    } catch (err) {
      setSearchError(err instanceof GeocodeError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Re-geocodes an existing destination only if its name actually changed.
  async function handleUpdateDestinationName(e: SubmitEvent<HTMLFormElement>, key: number) {
    e.preventDefault()

    const current = destinations.find((d) => d.key === key)
    if (!current || current.isSearching) return

    const trimmed = current.draftName.trim()
    if (trimmed === current.name) return

    setDestinations((prev) =>
      prev.map((d) => (d.key === key ? { ...d, isSearching: true, searchError: undefined } : d)),
    )

    try {
      const result = await geocodePlace(trimmed)
      setDestinations((prev) =>
        prev.map((d) =>
          d.key === key
            ? {
                ...d,
                name: result.displayName,
                draftName: result.displayName,
                lat: result.lat,
                lng: result.lng,
                visited: false,
                isSearching: false,
              }
            : d,
        ),
      )
    } catch (err) {
      setDestinations((prev) =>
        prev.map((d) =>
          d.key === key
            ? {
                ...d,
                isSearching: false,
                searchError:
                  err instanceof GeocodeError ? err.message : 'Something went wrong. Try again.',
              }
            : d,
        ),
      )
    }
  }

  function validate(): boolean {
    const next: FormErrors = {}

    if (!tripName.trim()) next.name = 'Trip name is required'
    if (destinations.length < 2) next.destinations = 'Add at least 2 destinations'

    setErrors(next)
    return !next.name && !next.destinations
  }

  function handleSubmit() {
    if (!validate()) return

    const tripDestinations: Destination[] = destinations.map((d, i): Destination => {
      const nextTransport = destinations[i + 1]?.transport
      return {
        name: d.name,
        lat: d.lat,
        lng: d.lng,
        visited: d.visited,
        ...(nextTransport ? { transportToNext: nextTransport } : {}),
      }
    })

    const fields = {
      name: tripName.trim(),
      destinations: tripDestinations,
      startDate: startDate ? formatDisplayDate(startDate) : '',
      endDate: endDate ? formatDisplayDate(endDate) : '',
    }

    if (existingTrip) {
      updateTrip({ ...existingTrip, ...fields })
    } else {
      saveTrip({
        id: crypto.randomUUID(),
        ...fields,
        createdAt: new Date().toISOString(),
      })
    }

    void navigate('/')
  }

  if (id && !existingTrip) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-paper)]">
        <p className="text-[var(--color-ink-muted)]">Trip not found.</p>
      </div>
    )
  }

  const showPreview = destinations.length >= 2
  const isBusy = isSearching || destinations.some((d) => d.isSearching)

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <header className="mb-10 flex items-end justify-between border-b border-[var(--color-border)] pb-8">
          <div>
            <h1 className="font-[family-name:var(--font-family-serif)] text-4xl font-bold tracking-tight text-[var(--color-ink)]">
              {existingTrip ? 'Edit Trip' : 'New Trip'}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              {existingTrip ? 'Update your itinerary.' : 'Plan your next adventure.'}
            </p>
          </div>
          <Button variant="secondary" onClick={() => void navigate('/')}>
            Back
          </Button>
        </header>

        <div className="space-y-8">
          {/* Trip details */}
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-[var(--color-ink-muted)]">
              Trip Details
            </h2>
            <div className="space-y-4">
              <TextInput
                id="trip-name"
                label="Trip Name"
                value={tripName}
                onChange={setTripName}
                placeholder="e.g. Alpine Circuit"
                error={errors.name}
              />
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  id="start-date"
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  max={endDate || undefined}
                />
                <DatePicker
                  id="end-date"
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  min={startDate || undefined}
                />
              </div>
            </div>
          </section>

          {/* Destinations */}
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-[var(--color-ink-muted)]">
              Destinations
            </h2>

            {errors.destinations && (
              <p className="mb-3 text-xs text-red-600">{errors.destinations}</p>
            )}

            {destinations.length > 0 && (
              <div className="mb-3 space-y-3">
                {destinations.map((dest, i) => (
                  <form
                    key={dest.key}
                    onSubmit={(e) => void handleUpdateDestinationName(e, dest.key)}
                    className="flex items-start gap-3"
                  >
                    {/* Stop number */}
                    <span className="mt-[30px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-[10px] font-semibold text-[var(--color-paper)]">
                      {i + 1}
                    </span>

                    {/* Name input — editing and re-submitting re-geocodes only if changed */}
                    <div className="flex-1">
                      <TextInput
                        id={`dest-name-${String(dest.key)}`}
                        label={i === 0 ? 'Starting Point' : `Stop ${String(i + 1)}`}
                        value={dest.draftName}
                        onChange={(v) => {
                          updateDraftName(dest.key, v)
                        }}
                        placeholder="City or place name"
                        error={dest.searchError}
                      />
                    </div>

                    {/* Transport (shown on all stops except the first) */}
                    {i > 0 ? (
                      <div className="w-36 shrink-0">
                        <Select<TransportType>
                          id={`dest-transport-${String(dest.key)}`}
                          label="Via"
                          value={dest.transport}
                          onChange={(v) => {
                            updateTransport(dest.key, v)
                          }}
                          options={TRANSPORT_OPTIONS}
                          placeholder="Transport"
                        />
                      </div>
                    ) : (
                      // Spacer to keep the first row aligned
                      <div className="w-36 shrink-0" />
                    )}

                    {/* Update button — enabled only when the name has actually changed */}
                    <div className="mt-[22px] shrink-0">
                      <Button
                        type="submit"
                        variant="secondary"
                        disabled={dest.isSearching || dest.draftName.trim() === dest.name}
                      >
                        {dest.isSearching ? 'Searching…' : 'Update'}
                      </Button>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => {
                        removeDestination(dest.key)
                      }}
                      aria-label="Remove destination"
                      className="mt-[30px] flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-[var(--color-ink-muted)] transition-colors hover:text-red-500"
                    >
                      <RemoveIcon />
                    </button>
                  </form>
                ))}
              </div>
            )}

            {/* Add destination: looks the place up via Nominatim before adding it */}
            <form onSubmit={(e) => void handleAddDestination(e)} className="flex items-start gap-3">
              <span className="mt-[30px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--color-border)] text-[10px] font-semibold text-[var(--color-ink-muted)]">
                {destinations.length + 1}
              </span>

              <div className="flex-1">
                <TextInput
                  id="dest-query"
                  label={
                    destinations.length === 0
                      ? 'Starting Point'
                      : `Stop ${String(destinations.length + 1)}`
                  }
                  value={query}
                  onChange={setQuery}
                  placeholder="City or place name"
                  error={searchError}
                />
              </div>

              {destinations.length > 0 ? (
                <div className="w-36 shrink-0">
                  <Select<TransportType>
                    id="dest-transport-pending"
                    label="Via"
                    value={pendingTransport}
                    onChange={setPendingTransport}
                    options={TRANSPORT_OPTIONS}
                    placeholder="Transport"
                  />
                </div>
              ) : (
                <div className="w-36 shrink-0" />
              )}

              <div className="mt-[22px] shrink-0">
                <Button type="submit" variant="secondary" disabled={isSearching}>
                  {isSearching ? 'Searching…' : '+ Add'}
                </Button>
              </div>
            </form>
          </section>

          {/* Route preview */}
          {showPreview && (
            <section>
              <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-[var(--color-ink-muted)]">
                Route Preview
              </h2>
              <div className="rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] px-5 py-4">
                <ol className="space-y-0">
                  {destinations.map((dest, i) => (
                    <li key={dest.key}>
                      <div className="flex items-center gap-3 py-1.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-[10px] font-semibold text-[var(--color-paper)]">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-[var(--color-ink)]">
                          {dest.name}
                        </span>
                      </div>
                      {i < destinations.length - 1 && (
                        <div className="ml-[9px] flex items-center gap-3 py-0.5">
                          <div className="w-px self-stretch border-l border-dashed border-[var(--color-border)]" />
                          <span className="text-xs text-[var(--color-ink-muted)]">
                            {destinations[i + 1]?.transport
                              ? TRANSPORT_OPTIONS.find(
                                  (o) => o.value === destinations[i + 1]?.transport,
                                )?.label
                              : '—'}
                          </span>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          )}

          {/* Submit */}
          <div className="border-t border-[var(--color-border)] pt-6">
            <Button variant="primary" onClick={handleSubmit} disabled={isBusy}>
              {existingTrip ? 'Save Changes' : 'Create Trip'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RemoveIcon() {
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
