import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NewTripPage from './pages/NewTripPage'
import TripMapPage from './pages/TripMapPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/trips/new" element={<NewTripPage />} />
        <Route path="/trips/:id" element={<TripMapPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
