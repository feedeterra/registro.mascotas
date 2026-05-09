-- Backfill: mascotas adoption_status = 'adopted' → success_stories + borrado del pet
-- (misma semántica que public.finalize_adoption, sin sesión auth).
--
-- Prerrequisito: migración 20260502140000_success_stories (tabla + función) ya aplicada.
-- Idempotente: no inserta si ya existe fila con legacy_pet_id = pets.id.
--
-- Antes de ejecutar en prod, podés previsualizar:
--   SELECT id, name, shelter_id, adoption_status FROM pets WHERE adoption_status = 'adopted';

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS adopted_photo_position text;

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS primary_photo_idx int NOT NULL DEFAULT 0;

INSERT INTO public.success_stories (
  shelter_id,
  pet_name,
  sex,
  story,
  photos_before,
  photo_positions,
  primary_photo_idx,
  photo_after_url,
  photo_after_position,
  adopter_name,
  adopter_quote,
  adopted_at,
  legacy_pet_id
)
SELECT
  p.shelter_id,
  COALESCE(NULLIF(trim(p.name), ''), 'Sin nombre'),
  p.sex,
  COALESCE(NULLIF(trim(p.adopter_story), ''), NULLIF(trim(p.notes), ''), ''),
  CASE WHEN p.photos IS NULL THEN '[]'::jsonb ELSE to_jsonb(p.photos) END,
  CASE WHEN p.photo_positions IS NULL THEN '[]'::jsonb ELSE to_jsonb(p.photo_positions) END,
  COALESCE(p.primary_photo_idx, 0),
  p.adopted_photo_url,
  COALESCE(NULLIF(trim(p.adopted_photo_position), ''), '50% 50%'),
  p.adopter_name,
  p.adopter_quote,
  COALESCE(p.adopted_at, now()),
  p.id
FROM public.pets p
WHERE p.adoption_status = 'adopted'
  AND p.shelter_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.success_stories s WHERE s.legacy_pet_id = p.id
  );

-- Quitar filas de pets que ya tienen historia (redirect por legacy_pet_id)
DELETE FROM public.pets p
USING public.success_stories s
WHERE s.legacy_pet_id = p.id
  AND p.adoption_status = 'adopted';
