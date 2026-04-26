import { createContext, useContext } from 'react'
import { useShelterConfig } from '../hooks/useShelterConfig'

// Exportamos el contexto para que ShelterLayout lo pueda proveer
export const ShelterConfigContext = createContext(null)

// El global provider proveera un context vacio o "generico de app" a futuro si se quita el hardcode,
// o simplemente `null` para que Home sepa que esta en scope global.
export function ShelterConfigProvider({ children }) {
  // Ya NO usamos el hook global que hardcodea "casa" para la app general, 
  // O podemos proveer null temporalmente, pero como MyShelter lo usa,
  // mantendremos el hook pero el backend sera neutro o dependera del usuario auth.
  // Por ahora lo dejamos igual pero ShelterLayout lo sobreescribira en /r/:slug
  const value = useShelterConfig()
  return <ShelterConfigContext.Provider value={value}>{children}</ShelterConfigContext.Provider>
}

export function useShelterConfigContext() {
  return useContext(ShelterConfigContext)
}
