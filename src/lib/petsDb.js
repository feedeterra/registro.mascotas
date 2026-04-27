/**
 * Compatibilidad: listados/detalle que lanzan en error (React Query / código legacy).
 * La implementación vive en `src/services/pets.js`.
 */
import {
  PETS_LIST_SELECT,
  PET_DETAIL_SELECT,
  dbToSighting,
  dbToPet,
  applyListFilters,
  petFormToRow,
  fetchPetsList as fetchPetsListSvc,
  fetchPetDetail as fetchPetDetailSvc,
} from '../services/pets'

export {
  PETS_LIST_SELECT,
  PET_DETAIL_SELECT,
  dbToSighting,
  dbToPet,
  applyListFilters,
  petFormToRow,
}

/**
 * @param {object} args
 * @returns {Promise<{ pets: object[], totalCount: number }>}
 */
export async function fetchPetsList(args) {
  const { data, error } = await fetchPetsListSvc(args)
  if (error) throw error
  return data
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function fetchPetDetail(id) {
  const { data, error } = await fetchPetDetailSvc(id)
  if (error) throw error
  return data
}
