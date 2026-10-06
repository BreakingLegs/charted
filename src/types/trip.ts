export type TransportType = 'plane' | 'car' | 'train' | 'boat' | 'bus' | 'walk'

export interface Airport {
  name: string
  iata: string
  lat: number
  lng: number
}

export interface Destination {
  name: string
  lat: number
  lng: number
  visited: boolean
  transportToNext?: TransportType
  // Only meaningful when transportToNext is 'plane' — the flight's route is
  // drawn between these airports rather than the two destinations' own
  // coordinates (city center vs. the actual airport can differ a lot).
  departureAirport?: Airport
  arrivalAirport?: Airport
}

export interface Trip {
  id: string
  name: string
  destinations: Destination[]
  startDate: string
  endDate: string
  createdAt: string
}
