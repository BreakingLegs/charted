// Central list of the `data-tour` selectors the guided tour attaches its steps to.
// Keeping them here means the step definitions and the pages that render the
// matching `data-tour` attributes can't drift out of sync on a typo.
export const TOUR_SELECTORS = {
  yourTrips: '[data-tour="your-trips"]',
  tripCard: '[data-tour="trip-card"]',
  newTripButton: '[data-tour="new-trip-button"]',
  routeMap: '[data-tour="route-map"]',
  destinationMarker: '[data-tour="destination-marker"]',
  tripSidebar: '[data-tour="trip-sidebar"]',
  mapBackButton: '[data-tour="map-back-button"]',
} as const
