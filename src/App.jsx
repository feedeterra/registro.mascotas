import { useState, useEffect, lazy, Suspense, useRef } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { supabase } from './lib/supabase'
import { ThemeProvider } from './theme'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import { PetsProvider } from './context/PetsContext'
import { ShelterConfigProvider } from './context/ShelterConfigContext'
import { ToastProvider } from './context/ToastContext'
import { PageLoader } from './components/ui'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Welcome from './components/Welcome'
import AnnouncementBar from './components/AnnouncementBar'
import { ProtectedRoute } from './components/ProtectedRoute'

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
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTo(0, 0)
    document.body.scrollTo(0, 0)
  }, [pathname])
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
        <Route path="/refugio" element={<Navigate to="/refugios" replace />} />
        <Route path="/mi-refugio" element={<ProtectedRoute staffOnly><MyShelter /></ProtectedRoute>} />
        {import.meta.env.DEV && DevSeed && <Route path="/dev/seed" element={<DevSeed />} />}
        <Route path="/sumarme" element={<Sumarme />} />
        <Route path="/voluntario" element={<Voluntario />} />
        <Route path="/sponsors" element={<Sponsors />} />
        <Route path="/superadmin" element={<ProtectedRoute adminOnly><SuperAdmin /></ProtectedRoute>} />
        {/* Short URL redirect → canonical */}
        <Route path="/r/:slug" element={<ShortShelterRedirect />} />

        {/* Canonical multi-tenant routing */}
        <Route path="/refugio/:slug" element={<ShelterLayout />}>
          <Route index element={<Shelter />} />
          <Route path="gestion" element={<ProtectedRoute staffOnly><MyShelter /></ProtectedRoute>} />
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

function AppInner({ welcomed, setWelcomed, stats }) {
  const { profile, isLogged, loading: authLoading } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()
  const initialPath = window.location.pathname + window.location.search
  const pendingPath = useRef(!welcomed && initialPath !== '/' ? initialPath : null)

  useEffect(() => {
    if (welcomed && pendingPath.current) {
      navigate(pendingPath.current, { replace: true })
      pendingPath.current = null
    }
  }, [welcomed, navigate])

  // Onboarding Redirection
  useEffect(() => {
    if (authLoading) return
    if (isLogged && !profile?.phone && location.pathname !== '/perfil' && location.pathname !== '/login') {
      navigate('/perfil?onboarding=true', { replace: true })
    }
  }, [isLogged, profile?.phone, location.pathname, authLoading, navigate])

  const handleWelcomeContinue = () => {
    setWelcomed(true)
  }

  // UX Improvement: Skip welcome screen if visiting a direct link
  const isDirectLink = initialPath !== '/' && initialPath !== ''
  const shouldShowWelcome = !welcomed && !isDirectLink

  if (shouldShowWelcome) {
    return <Welcome onContinue={handleWelcomeContinue} stats={stats} />
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <AnnouncementBar />
      <ScrollToTop />
      <main className="app-main">
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
  const [welcomed, setWelcomed] = useState(() => lsLoad(LS_WELCOMED, true))
  const [stats, setStats] = useState({ pets: null, adopted: 0, volunteers: 0 })

  useEffect(() => {
    Promise.all([
      supabase.from('pets').select('id', { count: 'exact', head: true }).eq('type', 'stray').neq('adoption_status', 'adopted'),
      supabase.from('pets').select('id', { count: 'exact', head: true }).eq('adoption_status', 'adopted'),
      supabase.from('volunteer_subscriptions').select('id', { count: 'exact', head: true })
    ]).then(([petsRes, adoptedRes, volRes]) => {
      setStats({
        pets: petsRes.count ?? 0,
        adopted: adoptedRes.count ?? 0,
        volunteers: volRes.count ?? 0
      })
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <PetsProvider>
                <ShelterConfigProvider>
                  <AppInner welcomed={welcomed} setWelcomed={setWelcomed} stats={stats} />
                </ShelterConfigProvider>
              </PetsProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
