// Loads and searches the free OpenFlights airport dataset, used by
// AirportPicker to let a traveller pick a real departure/arrival airport for
// a flight leg instead of relying on a destination's city-center coordinates.

export interface AirportOption {
  name: string
  city: string
  country: string
  iata: string
  lat: number
  lng: number
}

export class AirportLoadError extends Error {}

const AIRPORTS_URL =
  'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat'
const UNREACHABLE_MESSAGE = 'Could not load the airport list. Check your connection and try again.'

// OpenFlights' airports.dat is CSV, but several fields (notably Name and
// City) can contain commas inside quotes, so a plain `split(',')` would
// misalign columns — this is a minimal RFC4180-style line parser.
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields
}

const IATA_PATTERN = /^[A-Z]{3}$/

// Columns, per OpenFlights' documented schema: id, name, city, country, iata,
// icao, lat, lng, altitude, timezone, dst, tz, type, source.
function parseAirportsDat(text: string): AirportOption[] {
  const airports: AirportOption[] = []

  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    const fields = parseCsvLine(line)
    const [, name, city, country, iata] = fields
    const lat = Number(fields[6])
    const lng = Number(fields[7])

    if (!name || !iata || !IATA_PATTERN.test(iata)) continue
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue

    airports.push({ name, city, country, iata, lat, lng })
  }

  return airports
}

let airportsPromise: Promise<AirportOption[]> | null = null

// Fetches (once per page load) and parses the OpenFlights dataset. Shared
// across every AirportPicker instance via the module-level promise, so
// opening a second picker doesn't re-fetch the ~7000-row file.
export function loadAirports(): Promise<AirportOption[]> {
  if (!airportsPromise) {
    airportsPromise = fetch(AIRPORTS_URL)
      .then((response) => {
        if (!response.ok) throw new AirportLoadError(UNREACHABLE_MESSAGE)
        return response.text()
      })
      .then(parseAirportsDat)
      .catch((err: unknown) => {
        // Let a later call retry instead of permanently caching a failure.
        airportsPromise = null
        throw err instanceof AirportLoadError ? err : new AirportLoadError(UNREACHABLE_MESSAGE)
      })
  }
  return airportsPromise
}

// OpenFlights carries no passenger/traffic figure, so there's no real "size"
// field to sort by. This is a hand-picked list of the world's busiest hubs,
// ordered roughly by passenger volume (busiest first) — an airport's index
// here doubles as its size rank, so search results can put large
// international airports first the way a traffic dataset would.
const MAJOR_AIRPORTS_BY_SIZE: string[] = [
  'ATL',
  'DXB',
  'DFW',
  'HND',
  'DEN',
  'ORD',
  'LAX',
  'LHR',
  'IST',
  'CDG',
  'AMS',
  'FRA',
  'PEK',
  'CAN',
  'JFK',
  'PVG',
  'CGK',
  'SIN',
  'MAD',
  'BCN',
  'MUC',
  'HKG',
  'ICN',
  'NRT',
  'SFO',
  'LAS',
  'MCO',
  'MIA',
  'PHX',
  'EWR',
  'YYZ',
  'MEX',
  'GRU',
  'BOG',
  'FCO',
  'MXP',
  'ZRH',
  'VIE',
  'BRU',
  'CPH',
  'ARN',
  'OSL',
  'HEL',
  'DUB',
  'LIS',
  'ATH',
  'WAW',
  'PRG',
  'BUD',
  'MAN',
  'LGW',
  'STN',
  'LTN',
  'EDI',
  'DOH',
  'AUH',
  'RUH',
  'JED',
  'CAI',
  'JNB',
  'CPT',
  'NBO',
  'LOS',
  'CMN',
  'DEL',
  'BOM',
  'BLR',
  'MAA',
  'CCU',
  'HYD',
  'BKK',
  'KUL',
  'MNL',
  'SGN',
  'HAN',
  'TPE',
  'KIX',
  'SYD',
  'MEL',
  'BNE',
  'AKL',
  'PER',
  'YVR',
  'YUL',
  'YYC',
  'MDW',
  'BOS',
  'IAD',
  'DCA',
  'IAH',
  'PHL',
  'DTW',
  'MSP',
  'CLT',
  'SLC',
  'PDX',
  'SAN',
  'AUS',
  'BNA',
  'MSY',
  'HNL',
  'ANC',
  'LGA',
  'BWI',
  'STL',
  'MCI',
  'PIT',
  'CVG',
  'CLE',
  'IND',
  'MKE',
  'CMH',
  'RDU',
  'SVO',
  'DME',
  'LED',
  'KBP',
  'DUS',
  'HAM',
  'STR',
  'CGN',
  'PMI',
  'VLC',
  'LYS',
  'NCE',
  'TLS',
  'BLQ',
  'VCE',
  'NAP',
  'OPO',
  'GIG',
  'BSB',
  'SCL',
  'LIM',
  'EZE',
  'UIO',
  'PTY',
  'SJO',
  'CUN',
]

const MAJOR_AIRPORT_RANK = new Map(MAJOR_AIRPORTS_BY_SIZE.map((iata, index) => [iata, index]))

function sizeRank(iata: string): number {
  return MAJOR_AIRPORT_RANK.get(iata) ?? Number.MAX_SAFE_INTEGER
}

// Matches by IATA code, airport name, or city name, then sorts the matches
// by size (large international hubs first via `sizeRank`), falling back to
// match quality (exact/prefix/substring) and then name to break ties between
// equally-ranked (i.e. equally "unranked") airports.
export function searchAirports(
  airports: AirportOption[],
  query: string,
  limit = 6,
): AirportOption[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return []

  const matches = airports
    .map((airport) => {
      const iata = airport.iata.toLowerCase()
      const name = airport.name.toLowerCase()
      const city = airport.city.toLowerCase()

      let relevance = -1
      if (iata === trimmed) relevance = 0
      else if (iata.startsWith(trimmed) || name.startsWith(trimmed) || city.startsWith(trimmed)) {
        relevance = 1
      } else if (name.includes(trimmed) || city.includes(trimmed) || iata.includes(trimmed)) {
        relevance = 2
      }

      return { airport, relevance, size: sizeRank(airport.iata) }
    })
    .filter((entry) => entry.relevance >= 0)
    .sort((a, b) => {
      if (a.size !== b.size) return a.size - b.size
      if (a.relevance !== b.relevance) return a.relevance - b.relevance
      return a.airport.name.localeCompare(b.airport.name)
    })

  return matches.slice(0, limit).map((entry) => entry.airport)
}
