// src/hooks/usePets.js
// Wrapper sobre React Query + mutaciones. Listado del panel refugio vía fetchPets / listState.

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { uploadPetPhoto } from '../lib/supabase'
import { useAuthContext } from '../context/AuthContext'
import {
  dbToPet,
  dbToSighting,
  fetchPetsList,
} from '../lib/petsDb'
import {
  createPetsRealtimeChannel,
  removeRealtimeChannel,
  insertPetRow,
  updatePetPhotos,
  updatePetRow,
  deletePetRow,
  insertSightingRow,
  listPetsByShelterId,
  petFormToRow,
} from '../services/pets'

export { PETS_LIST_SELECT, dbToPet } from '../lib/petsDb'

export function usePets() {
  const queryClient = useQueryClient()
  const { session, isAdmin, isShelterStaff } = useAuthContext()
  const filtersRef = useRef({})
  const [listState, setListState] = useState(null)

  const fetchPets = useCallback((opts = {}) => {
    if (opts.resetFilters) filtersRef.current = {}
    if (opts.filters && typeof opts.filters === 'object') {
      filtersRef.current = { ...filtersRef.current, ...opts.filters }
    }
    const f = { ...filtersRef.current }
    const fetchAll = opts.fetchAll === true

    setListState(prev => {
      const p = opts.page !== undefined ? opts.page : (prev?.page ?? 1)
      const ps = opts.pageSize !== undefined ? opts.pageSize : (prev?.pageSize ?? 20)
      return { fetchAll, page: p, pageSize: ps, filters: f }
    })
  }, [])

  const queryKey = listState
    ? listState.fetchAll
      ? ['pets', { fetchAll: true, filters: listState.filters }]
      : ['pets', { page: listState.page, pageSize: listState.pageSize, filters: listState.filters }]
    : ['pets', 'panel-idle']

  const listQuery = useQuery({
    queryKey,
    queryFn: () => {
      if (!listState) return { pets: [], totalCount: 0 }
      return fetchPetsList({
        page: listState.page,
        pageSize: listState.pageSize,
        filters: listState.filters,
        fetchAll: listState.fetchAll,
      })
    },
    enabled: listState !== null,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  })

  const pets = listQuery.data?.pets ?? []
  const totalCount = listQuery.data?.totalCount ?? 0
  const page = listState?.page ?? 1
  const pageSize = listState?.pageSize ?? 20
  const loading = listQuery.isLoading || listQuery.isFetching
  const error = listQuery.error?.message ?? null

  useEffect(() => {
    if (!session?.user || (!isAdmin && !isShelterStaff)) return

    const invalidatePets = (payload) => {
      // Listados (paginados / fetchAll / shelter panel).
      queryClient.invalidateQueries({ queryKey: ['pets'] })

      // Detalle puntual si el payload trae id.
      const id = payload?.new?.id ?? payload?.old?.id
      if (id) queryClient.invalidateQueries({ queryKey: ['pet', id] })
    }
    const channel = createPetsRealtimeChannel()
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pets' }, invalidatePets)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pets' }, invalidatePets)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'pets' }, invalidatePets)
      .subscribe()

    return () => { removeRealtimeChannel(channel) }
  }, [session?.user, isAdmin, isShelterStaff, queryClient])

  const addPet = useCallback(async (formData, photoFiles = null) => {
    const dbPayload = petFormToRow(formData)

    const { data: inserted, error: insertErr } = await insertPetRow(dbPayload)
    if (insertErr) throw insertErr

    const files = photoFiles
      ? (Array.isArray(photoFiles) ? photoFiles : [photoFiles])
      : []

    if (files.length > 0) {
      const urls = await Promise.all(files.map(f => uploadPetPhoto(f, inserted.id)))
      const existing = inserted.photos ?? []
      const allPhotos = [...existing, ...urls]
      const { error: updateErr } = await updatePetPhotos(inserted.id, allPhotos)
      if (updateErr) throw updateErr
      inserted.photos = allPhotos
    }

    await queryClient.invalidateQueries({ queryKey: ['pets'] })
    await queryClient.invalidateQueries({ queryKey: ['pet', inserted.id] })
    return dbToPet(inserted)
  }, [queryClient])

  const updatePet = useCallback(async (id, changes, photoFiles = null) => {
    let extraChanges = {}

    const files = photoFiles
      ? (Array.isArray(photoFiles) ? photoFiles : [photoFiles])
      : []

    if (files.length > 0) {
      const urls = await Promise.all(files.map(f => uploadPetPhoto(f, id)))
      const existing = changes.photos ?? []
      extraChanges.photos = [...existing, ...urls]
    }

    const { data, error: err } = await updatePetRow(id, { ...petFormToRow(changes), ...extraChanges })
    if (err) throw err

    await queryClient.invalidateQueries({ queryKey: ['pets'] })
    await queryClient.invalidateQueries({ queryKey: ['pet', id] })
    return dbToPet(data)
  }, [queryClient])

  const deletePet = useCallback(async (id) => {
    const { error: err } = await deletePetRow(id)
    if (err) throw err
    await queryClient.invalidateQueries({ queryKey: ['pets'] })
    queryClient.removeQueries({ queryKey: ['pet', id] })
  }, [queryClient])

  const markLost = useCallback(async (id, lastSeenLocation) => {
    return updatePet(id, {
      status:            'lost',
      lostSince:         new Date().toISOString(),
      lastSeenLocation,
    })
  }, [updatePet])

  const markFound = useCallback(async (id) => {
    return updatePet(id, {
      status:           'home',
      lostSince:        null,
      lastSeenLocation: null,
      foundAt:          new Date().toISOString(),
    })
  }, [updatePet])

  const addSighting = useCallback(async (petId, sightingData) => {
    const { data, error: err } = await insertSightingRow({
      pet_id:        petId,
      description:   sightingData.text,
      location_text: sightingData.location ?? null,
      lat:           sightingData.lat ?? null,
      lng:           sightingData.lng ?? null,
    })
    if (err) throw err

    await queryClient.invalidateQueries({ queryKey: ['pet', petId] })
    return dbToSighting(data)
  }, [queryClient])

  return {
    pets,
    loading,
    error,
    totalCount,
    page,
    pageSize,
    fetchPets,
    addPet,
    updatePet,
    deletePet,
    markLost,
    markFound,
    addSighting,
  }
}

export function useShelterPets(shelterId) {
  const q = useQuery({
    queryKey: ['pets', 'shelter', shelterId],
    queryFn: async () => {
      const { data, error } = await listPetsByShelterId(shelterId)
      if (error) throw error
      return data
    },
    enabled: Boolean(shelterId),
    staleTime: 1000 * 60 * 2,
  })

  return { pets: q.data ?? [], loading: q.isLoading }
}
