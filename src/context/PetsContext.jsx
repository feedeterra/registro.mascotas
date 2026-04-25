import { createContext, useContext } from 'react'
import { usePets } from '../hooks/usePets'

const PetsContext = createContext(null)

export function PetsProvider({ children }) {
  const value = usePets()
  return <PetsContext.Provider value={value}>{children}</PetsContext.Provider>
}

export function usePetsContext() {
  return useContext(PetsContext)
}
