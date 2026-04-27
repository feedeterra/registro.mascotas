import { useState, useEffect, lazy, Suspense, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { ThemeProvider } from './theme'
import { AuthProvider } from './context/AuthContext'
import { PetsProvider } from './context/PetsContext'
import { ShelterConfigProvider } from './context/ShelterConfigContext'
import { ToastProvider } from './context/ToastContext'
import { PageLoader } from './components/ui'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Welcome from './components/Welcome'
import AnnouncementBar from './components/AnnouncementBar'

const Home = lazy(() => import('./pages/Home'))
const PetDetail = lazy(() => import('./pages/PetDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const Shelter = lazy(() => import('./pages/Shelter'))
const Login = lazy(() => import('./pages/Login'))
const Adopt = lazy(() => import('./pages/Adopt'))
const SuccessStories = lazy(() => import('./pages/SuccessStories'))
const MyShelter = lazy(() => import('./pages/MyShelter'))
const SheltersList = lazy(() => import('./pages/SheltersList'))
const DevSeed = import.meta.env.DEV ? lazy(() => import('./pages/DevSeed')) : null
const Sumarme = lazy(() => import('./pages/Sumarme'))
const Voluntario = lazy(() => import('./pages/Voluntario'))
const Sponsors = lazy(() => import('./pages/Sponsors'))
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'))
const NotFound = lazy(() => import('./pages/NotFound'))
const ShelterLayout = lazy(() => import('./components/ShelterLayout'))

const LS_WELCOMED = 'registro-mascotas-welcomed'

function lsLoad(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return null
}

function ShortShelterRedirect() {
  const { slug } = useParams()
  return <Navigate to={`/refugio/${slug}`} replace />
}

function PetDetailRedirect() {
  const { id } = useParams()
  const navigate = useNavigate()
  useEffect(() => {
    supabase.from('pets').select('id, shelters(slug)').eq('id', id).single()
      .then(({ data }) => {
        const slug = data?.shelters?.slug
        navigate(slug ? `/refugio/${slug}/adoptar/${id}` : '/adoptar', { replace: true })
      })
  }, [id])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/perro/:id" element={<PetDetailRedirect />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/adoptar" element={<Adopt />} />
        <Route path="/historias" element={<SuccessStories />} />
        <Route path="/refugios" element={<SheltersList />} />
        <Route path="/mi-refugio" element={<MyShelter />} />
        {import.meta.env.DEV && DevSeed && <Route path="/dev/seed" element={<DevSeed />} />}
        <Route path="/sumarme" element={<Sumarme />} />
        <Route path="/voluntario" element={<Voluntario />} />
        <Route path="/sponsors" element={<Sponsors />} />
        <Route path="/superadmin" element={<SuperAdmin />} />
        {/* Short URL redirect → canonical */}
        <Route path="/r/:slug" element={<ShortShelterRedirect />} />

        {/* Canonical multi-tenant routing */}
        <Route path="/refugio/:slug" element={<ShelterLayout />}>
          <Route index element={<Shelter />} />
          <Route path="gestion" element={<MyShelter />} />
          <Route path="adoptar" element={<Adopt />} />
          <Route path="adoptar/:id" element={<PetDetail />} />
          <Route path="historias" element={<SuccessStories />} />
          <Route path="sumarme" element={<Sumarme />} />
          <Route path="voluntario" element={<Voluntario />} />
          <Route path="sponsors" element={<Sponsors />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

function AppInner({ welcomed, setWelcomed, petCount }) {
  const navigate = useNavigate()
  const pendingPath = useRef(null)

  useEffect(() => {
    if (welcomed && pendingPath.current) {
      navigate(pendingPath.current)
      pendingPath.current = null
    }
  }, [welcomed, navigate])

  const handleWelcomeContinue = (path = '/') => {
    pendingPath.current = path === '/' ? null : path
    setWelcomed(true)
  }

  if (!welcomed) {
    return <Welcome onContinue={handleWelcomeContinue} petCount={petCount} />
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <AnnouncementBar />
      <ScrollToTop />
      <main style={{ flex: 1, maxWidth: 480, width: '100%', margin: '0 auto', padding: '0 14px 80px' }}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader message="Cargando página..." />}>
            <AnimatedRoutes />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  const [welcomed, setWelcomed] = useState(() => lsLoad(LS_WELCOMED, false))
  const [petCount, setPetCount] = useState(null)

  useEffect(() => {
    supabase.from('pets').select('id', { count: 'exact', head: true })
      .eq('type', 'stray').neq('adoption_status', 'adopted')
      .then(({ count }) => setPetCount(count ?? 0))
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <PetsProvider>
                <ShelterConfigProvider>
                  <AppInner welcomed={welcomed} setWelcomed={setWelcomed} petCount={petCount} />
                </ShelterConfigProvider>
              </PetsProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
