import { Outlet, useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ShelterConfigContext } from '../context/ShelterConfigContext'
import { useShelterPublicConfig } from '../hooks/useShelterConfig'
import { useT } from '../theme'

export default function ShelterLayout() {
  const { slug } = useParams()
  const T = useT()
  // Retrieve config specifically for this branch of the URL
  const configData = useShelterPublicConfig(slug)
  const { shelter, config, loading } = configData

  // SEO: Update dynamic title
  useEffect(() => {
    if (shelter?.name) {
      document.title = `${shelter.name} | Perritos y Refugios`
    }
  }, [shelter?.name])

  if (!loading && !shelter && !config) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <p style={{ fontSize: 20, fontWeight: 800 }}>Refugio no encontrado</p>
      <p style={{ color: T.muted, marginTop: 8 }}>Este refugio no existe o fue desactivado.</p>
      <Link to="/refugios" style={{ color: T.accent, fontWeight: 700, marginTop: 16, display: 'inline-block' }}>Ver todos los refugios →</Link>
    </div>
  )

  return (
    <ShelterConfigContext.Provider value={configData}>
      {/* Outlet renders /r/:slug/adoptar, /r/:slug/sponsors, etc. */}
      <Outlet />
    </ShelterConfigContext.Provider>
  )
}
