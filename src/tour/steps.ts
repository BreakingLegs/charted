import type { NavigateFunction } from 'react-router-dom'
import type { StepOptions, Tour } from 'shepherd.js'
import { loadTrips } from '../hooks/useTripStorage'
import type { Trip } from '../types/trip'
import { TOUR_SELECTORS } from './selectors'

// Extra class added to every step so shepherd-theme.css can restyle the
// generic Shepherd markup to match Charted's vintage/paper aesthetic without
// touching shepherd.js's own stylesheet.
const STEP_CLASS = 'charted-tour'

/**
 * Builds the full set of tour steps. The homepage and map-page steps live in
 * one Shepherd Tour instance (rather than two separate tours) so the "Next"
 * button on the last homepage step can carry the user across the route change
 * to `/trips/:id` and land directly on the first map-page step.
 *
 * `navigate` and `tour` are passed in so the cross-page steps can drive
 * react-router and Shepherd directly from a button's `action`.
 */
export function buildTourSteps(tour: Tour, navigate: NavigateFunction): StepOptions[] {
  // Reads localStorage directly (rather than a `useTripStorage` hook instance)
  // so this always reflects the current trips, even if the user added or
  // deleted trips after the tour provider first mounted.
  function goToFirstTripMap() {
    const trips = loadTrips()
    // `trips[0]` is genuinely `Trip | undefined` at runtime (an empty trip
    // list), but the project doesn't enable `noUncheckedIndexedAccess`, so
    // the type checker — and this rule — can't see that.
    const firstTrip: Trip | undefined = trips[0]
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!firstTrip) {
      // Nothing to show on a map — end the tour gracefully instead of
      // navigating to a trip that doesn't exist.
      tour.complete()
      return
    }
    void navigate(`/trips/${firstTrip.id}`)
    void tour.show('route-map')
  }

  function backToHomeSteps() {
    void navigate('/')
    void tour.show('new-trip-button')
  }

  // Plain `(this: Tour) => void` functions, passed by reference to `action`
  // below — this sidesteps the lint noise of wrapping each of
  // tour.next()/back()/show()'s `void | Promise<void>` returns at every call
  // site inside an inline arrow function.
  function goNext() {
    void tour.next()
  }
  function goBack() {
    void tour.back()
  }
  function finishTour() {
    tour.complete()
  }

  return [
    {
      id: 'your-trips',
      classes: STEP_CLASS,
      title: 'Your Trips',
      text: 'Your saved trips appear here. Each card shows your route and travel dates.',
      attachTo: { element: TOUR_SELECTORS.yourTrips, on: 'bottom' },
      buttons: [{ text: 'Next', action: goNext }],
    },
    {
      id: 'trip-card',
      classes: STEP_CLASS,
      text: 'Click a trip to explore it on the map.',
      attachTo: { element: TOUR_SELECTORS.tripCard, on: 'right' },
      buttons: [
        { text: 'Back', secondary: true, action: goBack },
        { text: 'Next', action: goNext },
      ],
    },
    {
      id: 'new-trip-button',
      classes: STEP_CLASS,
      text: 'Ready to plan? Create a new trip here.',
      attachTo: { element: TOUR_SELECTORS.newTripButton, on: 'bottom' },
      buttons: [
        { text: 'Back', secondary: true, action: goBack },
        // Instead of advancing to a step on this page, this carries the user
        // into the first mock trip's map view and resumes the tour there.
        { text: 'Next', action: goToFirstTripMap },
      ],
    },
    {
      id: 'route-map',
      classes: STEP_CLASS,
      text: 'This is your route. Each stop is marked on the map.',
      attachTo: { element: TOUR_SELECTORS.routeMap, on: 'bottom' },
      // The map page has only just mounted (and Leaflet renders its tiles and
      // markers asynchronously), so give the target up to a few seconds to
      // show up before falling back to a centered step.
      waitForElement: 4000,
      buttons: [
        { text: 'Back', secondary: true, action: backToHomeSteps },
        { text: 'Next', action: goNext },
      ],
    },
    {
      id: 'destination-marker',
      classes: STEP_CLASS,
      text: 'Click any destination to mark it as visited.',
      attachTo: { element: TOUR_SELECTORS.destinationMarker, on: 'right' },
      buttons: [
        { text: 'Back', secondary: true, action: goBack },
        { text: 'Next', action: goNext },
      ],
    },
    {
      id: 'trip-sidebar',
      classes: STEP_CLASS,
      text: 'Your destinations are listed here with progress tracking.',
      attachTo: { element: TOUR_SELECTORS.tripSidebar, on: 'right' },
      buttons: [
        { text: 'Back', secondary: true, action: goBack },
        { text: 'Next', action: goNext },
      ],
    },
    {
      id: 'map-back-button',
      classes: STEP_CLASS,
      text: 'Return to your trips list here.',
      attachTo: { element: TOUR_SELECTORS.mapBackButton, on: 'bottom' },
      buttons: [
        { text: 'Back', secondary: true, action: goBack },
        { text: 'Next', action: goNext },
      ],
    },
    {
      id: 'final',
      classes: STEP_CLASS,
      text: "You're all set! Happy travels. ✈",
      buttons: [{ text: "Let's go!", action: finishTour }],
    },
  ]
}
