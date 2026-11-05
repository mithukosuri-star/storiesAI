import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import { ToastProvider } from './components/Overlays'
import Landing from './pages/Landing'
import Create from './pages/Create'
import StoryPage from './pages/StoryPage'
import Library from './pages/Library'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/create" element={<Create />} />
          <Route path="/story/:id" element={<StoryPage />} />
          <Route path="/library" element={<Library />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </ToastProvider>
    </StoreProvider>
  )
}
