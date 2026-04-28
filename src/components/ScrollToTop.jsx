import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Forzamos el scroll arriba de todo de forma inmediata
    window.scrollTo(0, 0)
    
    // Fallback por si hay algún layout con overflow o delays de renderizado
    document.documentElement.scrollTo(0, 0)
    document.body.scrollTo(0, 0)
  }, [pathname])

  return null
}
