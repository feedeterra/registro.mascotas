import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { ThemeProvider } from './theme'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Welcome from './components/Welcome'
import Home from './pages/Home'
import PetDetail from './pages/PetDetail'
import Profile from './pages/Profile'
import Shelter from './pages/Shelter'
import Login from './pages/Login'
import Adopt from './pages/Adopt'
import SuccessStories from './pages/SuccessStories'
import Admin from './pages/Admin'
import AnnouncementBar from './components/AnnouncementBar'
import DevSeed from './pages/DevSeed'

const LS_WELCOMED = 'registro-mascotas-welcomed'

function lsLoad(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/perro/:id" element={<PetDetail />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/refugio/:slug" element={<Shelter />} />
        <Route path="/login" element={<Login />} />
        <Route path="/adoptar" element={<Adopt />} />
        <Route path="/historias" element={<SuccessStories />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dev/seed" element={<DevSeed />} />
      </Routes>
    </div>
  )
}

export default function App() {
  const [welcomed, setWelcomed] = useState(() => lsLoad(LS_WELCOMED, false))
  const [petCount, setPetCount] = useState(null)

  useEffect(() => {
    supabase.from('pets').select('id', { count: 'exact', head: true })
      .eq('type', 'stray')
      .then(({ count }) => setPetCount(count ?? 0))
  }, [])

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {!welcomed ? (
            <Welcome onContinue={() => setWelcomed(true)} petCount={petCount} />
          ) : (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Navbar />
              <AnnouncementBar />
              <ScrollToTop />
              <main style={{ flex: 1, maxWidth: 480, width: '100%', margin: '0 auto', padding: '0 14px 80px' }}>
                <AnimatedRoutes />
              </main>
              <Footer />
            </div>
          )}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
