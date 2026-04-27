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

export async function fetchPetsList(args) {
  const { data, error } = await fetchPetsListSvc(args)
  if (error) throw error
  return data
}

export async function fetchPetDetail(id) {
  const { data, error } = await fetchPetDetailSvc(id)
  if (error) throw error
  return data
}
