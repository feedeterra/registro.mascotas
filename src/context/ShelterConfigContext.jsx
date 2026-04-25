import { createContext, useContext } from 'react'
import { useShelterConfig } from '../hooks/useShelterConfig'

const ShelterConfigContext = createContext(null)

export function ShelterConfigProvider({ children }) {
  const value = useShelterConfig()
  return <ShelterConfigContext.Provider value={value}>{children}</ShelterConfigContext.Provider>
}

export function useShelterConfigContext() {
  return useContext(ShelterConfigContext)
}
