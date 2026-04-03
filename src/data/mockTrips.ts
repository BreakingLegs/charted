import type { Trip } from '../types/trip'

export const defaultTrips: Trip[] = [
  {
    id: '1',
    name: 'Alpine Circuit',
    destinations: [
      { name: 'Zurich', lat: 47.3769, lng: 8.5417, visited: true, transportToNext: 'train' },
      { name: 'Interlaken', lat: 46.6863, lng: 7.8632, visited: true, transportToNext: 'train' },
      { name: 'Zermatt', lat: 46.0207, lng: 7.7491, visited: false, transportToNext: 'train' },
      { name: 'Geneva', lat: 46.2044, lng: 6.1432, visited: false },
    ],
    startDate: 'Jun 12, 2025',
    endDate: 'Jun 24, 2025',
    createdAt: '2025-05-01T10:00:00.000Z',
  },
  {
    id: '2',
    name: 'Mediterranean Coast',
    destinations: [
      { name: 'Barcelona', lat: 41.3851, lng: 2.1734, visited: true, transportToNext: 'train' },
      { name: 'Valencia', lat: 39.4699, lng: -0.3763, visited: true, transportToNext: 'train' },
      { name: 'Alicante', lat: 38.3452, lng: -0.481, visited: true, transportToNext: 'bus' },
      { name: 'Málaga', lat: 36.7213, lng: -4.4213, visited: false },
    ],
    startDate: 'Sep 5, 2025',
    endDate: 'Sep 18, 2025',
    createdAt: '2025-06-15T09:00:00.000Z',
  },
  {
    id: '3',
    name: 'Balkan Overland',
    destinations: [
      { name: 'Ljubljana', lat: 46.0569, lng: 14.5058, visited: true, transportToNext: 'car' },
      { name: 'Zagreb', lat: 45.815, lng: 15.9819, visited: true, transportToNext: 'car' },
      { name: 'Sarajevo', lat: 43.8563, lng: 18.4131, visited: false, transportToNext: 'car' },
      { name: 'Kotor', lat: 42.4247, lng: 18.7712, visited: false },
    ],
    startDate: 'Oct 2, 2025',
    endDate: 'Oct 14, 2025',
    createdAt: '2025-07-20T14:00:00.000Z',
  },
]
