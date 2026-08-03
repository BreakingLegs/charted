import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextInput from '../components/ui/TextInput'
import DatePicker from '../components/ui/DatePicker'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import { useTripStorage } from '../hooks/useTripStorage'
import type { Destination, TransportType } from '../types/trip'

interface DestEntry {
  key: number
  name: string
  transport: TransportType | ''
}

interface FormErrors {
  name?: string
  destinations?: string
  destNames: Record<number, string>
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

export default function NewTripPage() {
  const navigate = useNavigate()
  const { saveTrip } = useTripStorage()

  const [tripName, setTripName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [destinations, setDestinations] = useState<DestEntry[]>([
    { key: 0, name: '', transport: '' },
    { key: 1, name: '', transport: '' },
  ])
  const [keyCounter, setKeyCounter] = useState(2)
  const [errors, setErrors] = useState<FormErrors>({ destNames: {} })

  function addDestination() {
    setDestinations((prev) => [...prev, { key: keyCounter, name: '', transport: '' }])
    setKeyCounter((k) => k + 1)
  }

  function removeDestination(key: number) {
    setDestinations((prev) => prev.filter((d) => d.key !== key))
  }

  function updateDestName(key: number, name: string) {
    setDestinations((prev) => prev.map((d) => (d.key === key ? { ...d, name } : d)))
  }

  function updateTransport(key: number, transport: TransportType | '') {
    setDestinations((prev) => prev.map((d) => (d.key === key ? { ...d, transport } : d)))
  }

  function validate(): boolean {
    const next: FormErrors = { destNames: {} }

    if (!tripName.trim()) next.name = 'Trip name is required'

    const named = destinations.filter((d) => d.name.trim())
    if (named.length < 2) next.destinations = 'Add at least 2 destinations'

    destinations.forEach((d) => {
      if (!d.name.trim()) next.destNames[d.key] = 'Required'
    })

    setErrors(next)
    return !next.name && !next.destinations && Object.keys(next.destNames).length === 0
  }

  function handleSubmit() {
    if (!validate()) return

    const tripDestinations: Destination[] = destinations.map((d, i): Destination => {
      const nextTransport = destinations[i + 1]?.transport
      return {
        name: d.name.trim(),
        lat: 0,
        lng: 0,
        visited: false,
        ...(nextTransport ? { transportToNext: nextTransport } : {}),
      }
    })

    saveTrip({
      id: crypto.randomUUID(),
      name: tripName.trim(),
      destinations: tripDestinations,
      startDate: startDate ? formatDisplayDate(startDate) : '',
      endDate: endDate ? formatDisplayDate(endDate) : '',
      createdAt: new Date().toISOString(),
    })

    void navigate('/')
  }

  const previewDests = destinations.filter((d) => d.name.trim())
  const showPreview = previewDests.length >= 2

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <header className="mb-10 flex items-end justify-between border-b border-[var(--color-border)] pb-8">
          <div>
            <h1 className="font-[family-name:var(--font-family-serif)] text-4xl font-bold tracking-tight text-[var(--color-ink)]">
              New Trip
            </h1>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Plan your next adventure.</p>
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

            <div className="space-y-3">
              {destinations.map((dest, i) => (
                <div key={dest.key} className="flex items-start gap-3">
                  {/* Stop number */}
                  <span className="mt-[30px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-[10px] font-semibold text-[var(--color-paper)]">
                    {i + 1}
                  </span>

                  {/* Name input */}
                  <div className="flex-1">
                    <TextInput
                      id={`dest-name-${String(dest.key)}`}
                      label={i === 0 ? 'Starting Point' : `Stop ${String(i + 1)}`}
                      value={dest.name}
                      onChange={(v) => {
                        updateDestName(dest.key, v)
                      }}
                      placeholder="City or place name"
                      error={errors.destNames[dest.key]}
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

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => {
                      removeDestination(dest.key)
                    }}
                    disabled={destinations.length <= 2}
                    aria-label="Remove destination"
                    className="mt-[30px] flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-[var(--color-ink-muted)] transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    <RemoveIcon />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button variant="secondary" onClick={addDestination}>
                + Add Stop
              </Button>
            </div>
          </section>

          {/* Route preview */}
          {showPreview && (
            <section>
              <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-[var(--color-ink-muted)]">
                Route Preview
              </h2>
              <div className="rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] px-5 py-4">
                <ol className="space-y-0">
                  {previewDests.map((dest, i) => (
                    <li key={dest.key}>
                      <div className="flex items-center gap-3 py-1.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-[10px] font-semibold text-[var(--color-paper)]">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-[var(--color-ink)]">
                          {dest.name}
                        </span>
                      </div>
                      {i < previewDests.length - 1 && (
                        <div className="ml-[9px] flex items-center gap-3 py-0.5">
                          <div className="w-px self-stretch border-l border-dashed border-[var(--color-border)]" />
                          <span className="text-xs text-[var(--color-ink-muted)]">
                            {previewDests[i + 1]?.transport
                              ? TRANSPORT_OPTIONS.find(
                                  (o) => o.value === previewDests[i + 1]?.transport,
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
            <Button variant="primary" onClick={handleSubmit}>
              Create Trip
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
