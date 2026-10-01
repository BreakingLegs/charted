import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'
import './shepherd-theme.css'
import { TourContext } from './TourContext'
import { buildTourSteps } from './steps'
import WelcomeModal from './WelcomeModal'

export const TOUR_COMPLETED_KEY = 'charted_tour_completed'

interface TourProviderProps {
  children: ReactNode
}

// Mounted once above <Routes>, so the single Shepherd Tour instance it owns
// survives route changes — that's what lets a step on the homepage hand off
// to a step on the map page after `navigate()` rather than the tour ending
// the moment the page unmounts.
export default function TourProvider({ children }: TourProviderProps) {
  const navigate = useNavigate()
  const location = useLocation()

  // Built once via the lazy `useState` initializer, rather than a ref, so the
  // single Tour instance (and its steps) are created exactly once without
  // reading/writing a ref during render.
  const [tour] = useState(() => {
    const t = new Shepherd.Tour({
      useModalOverlay: true,
      exitOnEsc: true,
      keyboardNavigation: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: { behavior: 'smooth', block: 'center' },
        arrow: true,
        // Leaflet/react-leaflet mount their markers an effect-tick after the
        // page itself, so give every step's target a little grace before
        // falling back to a centered step (the map-page's first step, which
        // also has to wait out a route change, sets a longer value itself).
        waitForElement: 1500,
      },
    })
    t.addSteps(buildTourSteps(t, navigate))
    return t
  })

  // "First visit" is evaluated once, from the location the app actually
  // booted on — if that's the homepage and the tour has never been completed
  // or skipped before, offer it.
  const [showWelcome, setShowWelcome] = useState(
    () => location.pathname === '/' && !localStorage.getItem(TOUR_COMPLETED_KEY),
  )

  useEffect(() => {
    function markCompleted() {
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
    }
    tour.on('complete', markCompleted)
    tour.on('cancel', markCompleted)
    return () => {
      tour.off('complete', markCompleted)
      tour.off('cancel', markCompleted)
    }
  }, [tour])

  function startTour() {
    setShowWelcome(false)
    void tour.start()
  }

  function dismissWelcome() {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
    setShowWelcome(false)
  }

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
      {showWelcome && <WelcomeModal onTakeTour={startTour} onSkip={dismissWelcome} />}
    </TourContext.Provider>
  )
}
