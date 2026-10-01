import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NewTripPage from './pages/NewTripPage'
import TripMapPage from './pages/TripMapPage'
import TourProvider from './tour/TourProvider'

function App() {
  return (
    <BrowserRouter>
      {/* Mounted above <Routes> so its Shepherd tour instance survives the
          navigation from the homepage to a trip's map page mid-tour. */}
      <TourProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trips/new" element={<NewTripPage />} />
          <Route path="/trips/:id/edit" element={<NewTripPage />} />
          <Route path="/trips/:id" element={<TripMapPage />} />
        </Routes>
      </TourProvider>
    </BrowserRouter>
  )
}

export default App
