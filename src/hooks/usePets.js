// src/hooks/usePets.js
// ─── Hook: usePets ────────────────────────────────────────────────
// Reemplaza la lógica de useState/localStorage del App.jsx monolítico.
// El componente solo llama a estas funciones; no sabe nada de Supabase.

import { useState, useEffect, useCallback } from 'react'
import { supabase, uploadPetPhoto } from '../lib/supabase'

// ─── Helpers de mapeo ─────────────────────────────────────────────
// Supabase usa snake_case; el frontend usa camelCase.
// Centralizar la conversión acá evita bugs dispersos.

function dbToPet(row) {
  if (!row) return null
  return {
    id:                row.id,
    shelterId:         row.shelter_id ?? null,
    ownerId:           row.owner_id,
    name:              row.name,
    species:           row.species,
    breed:             row.breed,
    color:             row.color,
    size:              row.size,
    sex:               row.sex,
    neutered:          row.neutered,
    photos:            row.photos ?? [],
    primaryPhotoIdx:   row.primary_photo_idx ?? 0,
    type:              row.type,
    status:            row.status,
    adoptionStatus:    row.adoption_status,
    hasCollar:         row.has_collar,
    collarColor:       row.collar_color,
    hasChip:           row.has_chip,
    neighborhood:      row.neighborhood,
    lostSince:         row.lost_since,
    lastSeenLocation:  row.last_seen_location,
    foundAt:           row.found_at,
    notes:             row.notes,
    createdAt:         row.created_at,
    adoptedAt:         row.adopted_at ?? null,
    adopterName:       row.adopter_name ?? null,
    adopterQuote:      row.adopter_quote ?? null,
    tags:              row.tags ?? [],
    // Joins opcionales (cuando se hace select con relaciones)
    ownerName:         row.profiles?.display_name ?? row.owner_name ?? '—',
    ownerPhone:        row.profiles?.phone ?? row.owner_phone ?? '',
    sightings:         (row.sightings ?? []).map(dbToSighting),
  }
}

function petToDb(pet) {
  const row = {
    owner_id:           pet.ownerId ?? null,
    name:               pet.name,
    species:            pet.species ?? 'dog',
    breed:              pet.breed ?? null,
    color:              pet.color ?? null,
    size:               pet.size ?? null,
    sex:                pet.sex ?? 'unknown',
    neutered:           pet.neutered ?? null,
    photos:             pet.photos ?? [],
    primary_photo_idx:  pet.primaryPhotoIdx ?? 0,
    type:               pet.type ?? 'owned',
    status:             pet.status ?? 'found',
    adoption_status:    pet.adoptionStatus ?? null,
    has_collar:         pet.hasCollar ?? null,
    collar_color:       pet.collarColor ?? null,
    has_chip:           pet.hasChip ?? null,
    neighborhood:       pet.neighborhood ?? null,
    lost_since:         pet.lostSince ?? null,
    last_seen_location: pet.lastSeenLocation ?? null,
    notes:              pet.notes ?? null,
    tags:               pet.tags ?? [],
    registered_via:     pet.registeredVia ?? 'organic',
    found_at:           pet.foundAt ?? null,
    adopted_at:         pet.adoptedAt ?? null,
    adopter_name:       pet.adopterName ?? null,
    adopter_quote:      pet.adopterQuote ?? null,
  }
  if (Object.prototype.hasOwnProperty.call(pet, 'shelterId')) {
    row.shelter_id = pet.shelterId ?? null
  }
  return row
}

function dbToSighting(row) {
  return {
    id:            row.id,
    petId:         row.pet_id,
    reporterId:    row.reporter_id,
    text:          row.description,
    location:      row.location_text,
    lat:           row.lat,
    lng:           row.lng,
    photoUrl:      row.photo_url,
    date:          row.created_at,
  }
}

// ─── Hook principal ───────────────────────────────────────────────

export function usePets() {
  const [pets,    setPets]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // ── FETCH ALL ──────────────────────────────────────────────────
  const fetchPets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pets')
        .select(`
          *,
          profiles ( display_name, phone ),
          sightings ( * )
        `)
        .order('created_at', { ascending: false })

      if (err) throw err
      setPets((data ?? []).map(dbToPet))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carga inicial
  useEffect(() => { fetchPets() }, [fetchPets])

  // Suscripción realtime: granular por evento para evitar re-fetch completo
  useEffect(() => {
    const channel = supabase
      .channel('pets-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pets' },
        ({ new: row }) => {
          const pet = dbToPet(row)
          setPets(prev => prev.some(p => p.id === pet.id) ? prev : [pet, ...prev])
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pets' },
        ({ new: row }) => {
          const pet = dbToPet(row)
          setPets(prev => prev.map(p => p.id === pet.id ? pet : p))
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pets' },
        ({ old: row }) => {
          setPets(prev => prev.filter(p => p.id !== row.id))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── ADD PET ────────────────────────────────────────────────────
  /**
   * @param {object} formData  - datos del formulario (camelCase)
   * @param {File|File[]|null} photoFiles - archivo(s) de imagen
   * @returns {Promise<object>} mascota creada (camelCase)
   */
  const addPet = useCallback(async (formData, photoFiles = null) => {
    const dbPayload = petToDb(formData)

    const { data: inserted, error: insertErr } = await supabase
      .from('pets')
      .insert(dbPayload)
      .select()
      .single()

    if (insertErr) throw insertErr

    // Upload photos (single File or array of Files)
    const files = photoFiles
      ? (Array.isArray(photoFiles) ? photoFiles : [photoFiles])
      : []

    if (files.length > 0) {
      const urls = await Promise.all(files.map(f => uploadPetPhoto(f, inserted.id)))
      const existing = inserted.photos ?? []
      const allPhotos = [...existing, ...urls]
      const { error: updateErr } = await supabase
        .from('pets')
        .update({ photos: allPhotos })
        .eq('id', inserted.id)
      if (updateErr) throw updateErr
      inserted.photos = allPhotos
    }

    const newPet = dbToPet(inserted)
    setPets(prev => [newPet, ...prev])
    return newPet
  }, [])

  // ── UPDATE PET ─────────────────────────────────────────────────
  const updatePet = useCallback(async (id, changes, photoFiles = null) => {
    let extraChanges = {}

    // Upload new photos (single File or array of Files)
    const files = photoFiles
      ? (Array.isArray(photoFiles) ? photoFiles : [photoFiles])
      : []

    if (files.length > 0) {
      const urls = await Promise.all(files.map(f => uploadPetPhoto(f, id)))
      // Append to existing photos in changes, or fetch current
      const existing = changes.photos ?? []
      extraChanges.photos = [...existing, ...urls]
    }

    const { data, error: err } = await supabase
      .from('pets')
      .update({ ...petToDb(changes), ...extraChanges })
      .eq('id', id)
      .select(`*, profiles(display_name, phone), sightings(*)`)
      .single()

    if (err) throw err

    const updated = dbToPet(data)
    setPets(prev => prev.map(p => p.id === id ? updated : p))
    return updated
  }, [])

  // ── DELETE PET ─────────────────────────────────────────────────
  const deletePet = useCallback(async (id) => {
    const { error: err } = await supabase
      .from('pets')
      .delete()
      .eq('id', id)

    if (err) throw err
    setPets(prev => prev.filter(p => p.id !== id))
  }, [])

  // ── MARK LOST ──────────────────────────────────────────────────
  const markLost = useCallback(async (id, lastSeenLocation) => {
    return updatePet(id, {
      status:            'lost',
      lostSince:         new Date().toISOString(),
      lastSeenLocation,
    })
  }, [updatePet])

  // ── MARK FOUND ─────────────────────────────────────────────────
  const markFound = useCallback(async (id) => {
    return updatePet(id, {
      status:           'home',
      lostSince:        null,
      lastSeenLocation: null,
      foundAt:          new Date().toISOString(),
    })
  }, [updatePet])

  // ── ADD SIGHTING ───────────────────────────────────────────────
  const addSighting = useCallback(async (petId, sightingData) => {
    const { data, error: err } = await supabase
      .from('sightings')
      .insert({
        pet_id:        petId,
        description:   sightingData.text,
        location_text: sightingData.location ?? null,
        lat:           sightingData.lat ?? null,
        lng:           sightingData.lng ?? null,
      })
      .select()
      .single()

    if (err) throw err

    const newSighting = dbToSighting(data)

    // Actualizar localmente sin re-fetch completo
    setPets(prev => prev.map(p =>
      p.id === petId
        ? { ...p, sightings: [...(p.sightings ?? []), newSighting] }
        : p
    ))

    return newSighting
  }, [])

  return {
    pets,
    loading,
    error,
    fetchPets,
    addPet,
    updatePet,
    deletePet,
    markLost,
    markFound,
    addSighting,
  }
}
