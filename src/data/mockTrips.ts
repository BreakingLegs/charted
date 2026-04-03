import type { Trip } from '../types/trip'

export const mockTrips: Trip[] = [
  {
    id: '1',
    name: 'Alpine Circuit',
    destinations: [
      { name: 'Zurich', coords: [47.3769, 8.5417] },
      { name: 'Interlaken', coords: [46.6863, 7.8632] },
      { name: 'Zermatt', coords: [46.0207, 7.7491] },
      { name: 'Geneva', coords: [46.2044, 6.1432] },
    ],
    startDate: 'Jun 12, 2025',
    endDate: 'Jun 24, 2025',
    stops: 4,
    currentStop: 1, // Zurich visited, currently in Interlaken
  },
  {
    id: '2',
    name: 'Mediterranean Coast',
    destinations: [
      { name: 'Barcelona', coords: [41.3851, 2.1734] },
      { name: 'Valencia', coords: [39.4699, -0.3763] },
      { name: 'Alicante', coords: [38.3452, -0.481] },
      { name: 'Málaga', coords: [36.7213, -4.4213] },
    ],
    startDate: 'Sep 5, 2025',
    endDate: 'Sep 18, 2025',
    stops: 4,
    currentStop: 2, // Barcelona + Valencia visited, currently in Alicante
  },
  {
    id: '3',
    name: 'Balkan Overland',
    destinations: [
      { name: 'Ljubljana', coords: [46.0569, 14.5058] },
      { name: 'Zagreb', coords: [45.815, 15.9819] },
      { name: 'Sarajevo', coords: [43.8563, 18.4131] },
      { name: 'Kotor', coords: [42.4247, 18.7712] },
    ],
    startDate: 'Oct 2, 2025',
    endDate: 'Oct 14, 2025',
    stops: 4,
    currentStop: 1, // Ljubljana visited, currently in Zagreb
  },
]
