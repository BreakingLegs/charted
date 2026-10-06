// Pure geometry helpers for the two route shapes that don't come from a
// routing API: flight arcs and boat curves. Both are quadratic Bezier curves
// bowed perpendicular to the direct line between the two points — only the
// amount of bow (and, at render time, the line style) differs.

export type LatLng = [number, number]

function quadraticBezierPoints(p0: LatLng, p1: LatLng, p2: LatLng, segments: number): LatLng[] {
  const points: LatLng[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const mt = 1 - t
    const lat = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0]
    const lng = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1]
    points.push([lat, lng])
  }
  return points
}

// Returns the control point for a quadratic Bezier that bows away from the
// direct line between `from` and `to` by `bowFraction` of the line's length,
// offset perpendicular to it.
function bowedControlPoint(from: LatLng, to: LatLng, bowFraction: number, maxBow?: number): LatLng {
  const midLat = (from[0] + to[0]) / 2
  const midLng = (from[1] + to[1]) / 2

  const dLat = to[0] - from[0]
  const dLng = to[1] - from[1]
  const distance = Math.hypot(dLat, dLng)

  const perpLat = -dLng
  const perpLng = dLat
  const perpLength = Math.hypot(perpLat, perpLng) || 1

  const bow =
    maxBow === undefined ? distance * bowFraction : Math.min(distance * bowFraction, maxBow)

  return [midLat + (perpLat / perpLength) * bow, midLng + (perpLng / perpLength) * bow]
}

// A smooth, consistently-proportioned arc between two airports — pronounced
// enough to read as a flight path at any distance.
export function flightArcPoints(from: LatLng, to: LatLng, segments = 64): LatLng[] {
  const control = bowedControlPoint(from, to, 0.15)
  return quadraticBezierPoints(from, control, to, segments)
}

// A gentler curve meant to suggest a ship's path over water rather than a
// flight path — bows more for longer crossings, but capped so a long leg
// doesn't produce an absurd loop.
export function boatCurvePoints(from: LatLng, to: LatLng, segments = 48): LatLng[] {
  const control = bowedControlPoint(from, to, 0.12, 1.5)
  return quadraticBezierPoints(from, control, to, segments)
}
