export type TransportType = 'plane' | 'car' | 'train' | 'boat' | 'bus'

export interface Destination {
  name: string
  lat: number
  lng: number
  visited: boolean
  transportToNext?: TransportType
}

export interface Trip {
  id: string
  name: string
  destinations: Destination[]
  startDate: string
  endDate: string
  createdAt: string
}
