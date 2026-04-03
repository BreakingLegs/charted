import { useState, useCallback } from 'react'
import type { Trip } from '../types/trip'
import { defaultTrips } from '../data/mockTrips'

const STORAGE_KEY = 'charted_trips'

function loadTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTrips))
      return defaultTrips
    }
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as Trip[]) : defaultTrips
  } catch {
    return defaultTrips
  }
}

export function useTripStorage() {
  const [trips, setTrips] = useState<Trip[]>(loadTrips)

  const persist = useCallback((updated: Trip[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setTrips(updated)
  }, [])

  const getTrips = useCallback(() => trips, [trips])

  const saveTrip = useCallback(
    (trip: Trip) => {
      persist([...trips, trip])
    },
    [persist, trips],
  )

  const updateTrip = useCallback(
    (trip: Trip) => {
      persist(trips.map((t) => (t.id === trip.id ? trip : t)))
    },
    [persist, trips],
  )

  const deleteTrip = useCallback(
    (id: string) => {
      persist(trips.filter((t) => t.id !== id))
    },
    [persist, trips],
  )

  return { trips, getTrips, saveTrip, updateTrip, deleteTrip }
}
