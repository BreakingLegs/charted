export interface Destination {
  name: string
  coords: [number, number] // [lat, lng]
}

export interface Trip {
  id: string
  name: string
  destinations: Destination[]
  startDate: string
  endDate: string
  stops: number
  /** Index of the destination the traveller is currently at (0 = not started) */
  currentStop: number
}
