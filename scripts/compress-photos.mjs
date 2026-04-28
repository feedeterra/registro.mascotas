#!/usr/bin/env node
// Descarga, comprime y re-sube todas las fotos de pets en Supabase Storage.
// Usa sharp para redimensionar a max 1200px y quality 80.
// Ejecutar: node scripts/compress-photos.mjs [--dry-run]

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import fetch from 'node-fetch'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '')
})

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const BUCKET = 'pet-photos'
const MAX_PX = 1200
const QUALITY = 80
const DRY_RUN = process.argv.includes('--dry-run')

async function compressAndReplace(url, petId, photoIdx) {
  // Extraer path relativo
  const marker = `/object/public/${BUCKET}/`
  const path = url.split(marker)[1]
  if (!path) { console.log(`  SKIP (URL externa): ${url}`); return url }

  // Descargar
  const res = await fetch(url)
  if (!res.ok) { console.log(`  SKIP (error ${res.status}): ${path}`); return url }
  const buffer = Buffer.from(await res.arrayBuffer())

  // Verificar si ya es pequeña (< 200KB)
  if (buffer.length < 200 * 1024) {
    console.log(`  OK ya comprimida (${Math.round(buffer.length/1024)}KB): ${path}`)
    return url
  }

  // Comprimir con sharp
  const compressed = await sharp(buffer)
    .resize({ width: MAX_PX, height: MAX_PX, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, progressive: true })
    .toBuffer()

  const saving = Math.round((1 - compressed.length / buffer.length) * 100)
  console.log(`  ${buffer.length > 0 ? Math.round(buffer.length/1024) : '?'}KB → ${Math.round(compressed.length/1024)}KB (-${saving}%): ${path}`)

  if (DRY_RUN) return url

  // Re-subir al mismo path (upsert)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, { contentType: 'image/jpeg', upsert: true })

  if (error) { console.log(`  ERROR al subir: ${error.message}`); return url }

  // Devolver nueva URL (misma, pero ahora comprimida)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== COMPRIMIENDO FOTOS ===')

  const { data: pets, error } = await supabase
    .from('pets')
    .select('id, name, photos')
    .not('photos', 'is', null)

  if (error) throw error
  console.log(`${pets.length} perros con fotos\n`)

  let totalOriginal = 0, totalCompressed = 0, updated = 0

  for (const pet of pets) {
    const photos = Array.isArray(pet.photos) ? pet.photos : []
    if (!photos.length) continue

    console.log(`[${pet.name || pet.id}] ${photos.length} foto(s)`)
    const newPhotos = []

    for (let i = 0; i < photos.length; i++) {
      const newUrl = await compressAndReplace(photos[i], pet.id, i)
      newPhotos.push(newUrl)
    }

    if (!DRY_RUN && JSON.stringify(newPhotos) !== JSON.stringify(photos)) {
      const { error: upErr } = await supabase
        .from('pets')
        .update({ photos: newPhotos })
        .eq('id', pet.id)
      if (upErr) console.log(`  ERROR actualizando pet: ${upErr.message}`)
      else updated++
    }
  }

  console.log(`\nListo. ${updated} perros actualizados.`)
}

main().catch(console.error)
