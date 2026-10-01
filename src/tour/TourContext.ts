import { createContext, useContext } from 'react'

export interface TourContextValue {
  /** Starts (or restarts) the guided tour from the first step. */
  startTour: () => void
}

export const TourContext = createContext<TourContextValue | null>(null)

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within a TourProvider')
  return ctx
}
