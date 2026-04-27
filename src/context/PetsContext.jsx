import { createContext, useContext } from 'react'
import { usePets } from '../hooks/usePets'

/**
 * Estado global de mutaciones de mascotas (alta/edición/baja) + listado del panel refugio vía fetchPets.
 * Para listados públicos paginados usar usePetsListQuery en la ruta (p. ej. Adopt).
 * // TODO: migrar ShelterPetsPanel a useQuery dedicado y dejar aquí solo mutaciones si aplica.
 */
const PetsContext = createContext(null)

export function PetsProvider({ children }) {
  const value = usePets()
  return <PetsContext.Provider value={value}>{children}</PetsContext.Provider>
}

export function usePetsContext() {
  return useContext(PetsContext)
}
