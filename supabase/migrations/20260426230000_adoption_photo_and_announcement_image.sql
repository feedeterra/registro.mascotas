-- Migración: Soporte de fotos de adopción y announcements con imágenes
-- 1. Agregar campo de foto de adopción y fecha de adopción a pets
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS adopted_photo_url text,
  ADD COLUMN IF NOT EXISTS adopted_at timestamptz;

-- 2. Agregar image_url a shelter_announcements para soportar anuncios con imagen
ALTER TABLE public.shelter_announcements
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS announcement_type text DEFAULT 'general';
-- announcement_type: 'general' | 'adoption'
