-- Una sola migración, en orden:
--   A) finalize_adoption: pets.photos como text[] → to_jsonb (evita COALESCE con jsonb).
--   B) Backfill adoptados → success_stories + delete pet (idempotente en el INSERT).
--
-- PRERREQUISITO: deben existir public.pets y public.success_stories (este repo no crea pets;
-- si ves ERROR 42P01 relation "pets" does not exist, estás en una DB vacía o sin el esquema base).
--
-- Verificación: SELECT to_regclass('public.pets'), to_regclass('public.success_stories');

-- ─── A) RPC finalize_adoption ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.finalize_adoption(p_pet_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet public.pets%ROWTYPE;
  v_story_id uuid;
  v_story text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_pet FROM public.pets WHERE id = p_pet_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pet not found';
  END IF;

  IF v_pet.adoption_status IS DISTINCT FROM 'adopted' THEN
    RAISE EXCEPTION 'pet must have adoption_status adopted';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (
        (shelter_id IS NOT DISTINCT FROM v_pet.shelter_id AND shelter_id IS NOT NULL)
        OR is_admin = true
      )
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  IF v_pet.shelter_id IS NULL THEN
    RAISE EXCEPTION 'pet has no shelter_id';
  END IF;

  v_story := COALESCE(NULLIF(trim(v_pet.adopter_story), ''), NULLIF(trim(v_pet.notes), ''), '');

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
  ) VALUES (
    v_pet.shelter_id,
    COALESCE(NULLIF(trim(v_pet.name), ''), 'Sin nombre'),
    v_pet.sex,
    v_story,
    CASE WHEN v_pet.photos IS NULL THEN '[]'::jsonb ELSE to_jsonb(v_pet.photos) END,
    CASE WHEN v_pet.photo_positions IS NULL THEN '[]'::jsonb ELSE to_jsonb(v_pet.photo_positions) END,
    COALESCE(v_pet.primary_photo_idx, 0),
    v_pet.adopted_photo_url,
    COALESCE(v_pet.adopted_photo_position, '50% 50%'),
    v_pet.adopter_name,
    v_pet.adopter_quote,
    COALESCE(v_pet.adopted_at, now()),
    v_pet.id
  )
  RETURNING id INTO v_story_id;

  DELETE FROM public.pets WHERE id = p_pet_id;

  RETURN v_story_id;
END;
$$;

-- ─── B) Backfill: adopted → success_stories + delete pet ─────────
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

DELETE FROM public.pets p
USING public.success_stories s
WHERE s.legacy_pet_id = p.id
  AND p.adoption_status = 'adopted';
