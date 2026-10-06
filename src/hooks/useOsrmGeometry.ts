import { useEffect, useRef, useState } from 'react'
import { fetchOsrmRoute } from '../utils/routing'
import type { LatLng, OsrmProfile } from '../utils/routing'

export interface OsrmLegRequest {
  /** Must match the key the caller will look the result up by later. */
  key: string
  profile: OsrmProfile
  from: LatLng
  to: LatLng
}

interface OsrmGeometryState {
  geometry: Record<string, LatLng[]>
  loadingKeys: Set<string>
}

// Resolves road/path geometry for a set of legs from OSRM. Each `key` is only
// ever requested once for the lifetime of the component (OSRM responses are
// also cached in `routing.ts` itself, but that only avoids the network
// round-trip — this ref is what stops a re-render from re-triggering the
// fetch and loading-state churn in the first place). That matters here
// because toggling a destination's visited state produces a new `legs` array
// every render with the same keys, and that shouldn't cause any refetching.
export function useOsrmGeometry(legs: OsrmLegRequest[]): OsrmGeometryState {
  const [geometry, setGeometry] = useState<Record<string, LatLng[]>>({})
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set())
  const requestedKeys = useRef<Set<string>>(new Set())

  useEffect(() => {
    console.log(
      `[useOsrmGeometry] effect ran with ${String(legs.length)} leg(s):`,
      legs.map((l) => l.key),
    )
    for (const leg of legs) {
      if (requestedKeys.current.has(leg.key)) {
        console.log(`[useOsrmGeometry] already requested, skipping: ${leg.key}`)
        continue
      }
      requestedKeys.current.add(leg.key)

      console.log(`[useOsrmGeometry] requesting ${leg.profile} route for ${leg.key}`)
      setLoadingKeys((prev) => new Set(prev).add(leg.key))
      void fetchOsrmRoute(leg.profile, leg.from, leg.to)
        .then((points) => {
          if (!points) {
            console.warn(
              `[useOsrmGeometry] no geometry returned for ${leg.key} — keeping straight line`,
            )
            return
          }
          console.log(
            `[useOsrmGeometry] got ${String(points.length)} points for ${leg.key}, updating state`,
          )
          setGeometry((prev) => ({ ...prev, [leg.key]: points }))
        })
        .finally(() => {
          setLoadingKeys((prev) => {
            const next = new Set(prev)
            next.delete(leg.key)
            return next
          })
        })
    }
  }, [legs])

  return { geometry, loadingKeys }
}
