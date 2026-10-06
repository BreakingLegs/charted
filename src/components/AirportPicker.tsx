import { useEffect, useState } from 'react'
import type { Airport } from '../types/trip'
import { loadAirports, searchAirports } from '../utils/airports'
import type { AirportOption } from '../utils/airports'

interface AirportPickerProps {
  id: string
  label: string
  value: Airport | null
  onChange: (airport: Airport | null) => void
  error?: string
}

const LABEL_CLASSES =
  'mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]'

export default function AirportPicker({ id, label, value, onChange, error }: AirportPickerProps) {
  const [query, setQuery] = useState('')
  const [allAirports, setAllAirports] = useState<AirportOption[] | null>(null)
  const [loadError, setLoadError] = useState<string | undefined>()
  const [isOpen, setIsOpen] = useState(false)

  // Derived rather than its own state: until either the list or an error
  // arrives, we're still loading — no need for a third flag to keep in sync.
  const isLoading = allAirports === null && !loadError

  useEffect(() => {
    let cancelled = false
    void loadAirports()
      .then((airports) => {
        if (!cancelled) setAllAirports(airports)
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load the airport list. Try again later.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const results = allAirports ? searchAirports(allAirports, query) : []

  function handleSelect(option: AirportOption) {
    onChange({ name: option.name, iata: option.iata, lat: option.lat, lng: option.lng })
    setQuery('')
    setIsOpen(false)
  }

  function handleClear() {
    onChange(null)
    setQuery('')
  }

  // Once an airport is picked, show it as a pill instead of the search
  // input — searching again means clearing it first.
  if (value) {
    return (
      <div>
        <span className={LABEL_CLASSES}>{label}</span>
        <div className="flex items-center justify-between gap-2 rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] px-3 py-2">
          <span className="truncate text-sm text-[var(--color-ink)]">
            {value.name} ({value.iata})
          </span>
          <button
            type="button"
            onClick={handleClear}
            aria-label={`Clear ${label}`}
            className="shrink-0 cursor-pointer text-[var(--color-ink-muted)] transition-colors hover:text-red-500"
          >
            <ClearIcon />
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="relative">
      <label htmlFor={id} className={LABEL_CLASSES}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        onFocus={() => {
          setIsOpen(true)
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onBlur={() => {
          setIsOpen(false)
        }}
        placeholder="Search city or airport name"
        className="w-full rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/40 focus:border-[var(--color-ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink-muted)]/30"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {isOpen && (query.trim() || isLoading || loadError) && (
        <div className="absolute z-10 mt-1 w-full rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] shadow-lg">
          {isLoading && (
            <p className="px-3 py-2 text-xs text-[var(--color-ink-muted)]">Loading airports…</p>
          )}
          {!isLoading && loadError && <p className="px-3 py-2 text-xs text-red-600">{loadError}</p>}
          {!isLoading && !loadError && query.trim() && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-[var(--color-ink-muted)]">No airports found.</p>
          )}
          {!isLoading && !loadError && results.length > 0 && (
            <ul className="max-h-56 overflow-y-auto py-1">
              {results.map((option) => (
                <li key={option.iata}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                    }}
                    onClick={() => {
                      handleSelect(option)
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-[var(--color-ink)] hover:bg-[var(--color-paper)]"
                  >
                    {option.name} ({option.iata}) - {option.city}, {option.country}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function ClearIcon() {
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
