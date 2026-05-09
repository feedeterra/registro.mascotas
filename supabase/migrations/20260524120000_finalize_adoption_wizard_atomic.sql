-- Final feliz: sin marcar nunca adoption_status = adopted en pets.
-- Orden en una sola transacción: INSERT success_stories (datos del perro + popup) → DELETE pet.
-- Si falla el INSERT, el perro no se modifica. El cliente no debe hacer updatePet antes del RPC.
--
-- Firma: parámetros opcionales con default.
--   - Con datos del wizard (cualquier parámetro distinto de NULL después del id): nombre adoptante obligatorio.
--   - Solo p_pet_id: flujo legado; el pet ya debe estar adopted en BD (integraciones viejas).

DROP FUNCTION IF EXISTS public.finalize_adoption(uuid);
DROP FUNCTION IF EXISTS public.finalize_adoption(uuid, text, text, text, text, text, timestamptz);

CREATE OR REPLACE FUNCTION public.finalize_adoption(
  p_pet_id uuid,
  p_adopted_photo_url text DEFAULT NULL,
  p_adopter_story text DEFAULT NULL,
  p_adopter_name text DEFAULT NULL,
  p_adopter_quote text DEFAULT NULL,
  p_adopted_photo_position text DEFAULT NULL,
  p_adopted_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet public.pets%ROWTYPE;
  v_story_id uuid;
  v_existing_story uuid;
  v_wizard boolean;
  v_final_story text;
  v_final_photo_after text;
  v_final_photo_pos text;
  v_final_adopter_name text;
  v_final_adopter_quote text;
  v_final_adopted_at timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_pet FROM public.pets WHERE id = p_pet_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pet not found';
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

  SELECT s.id INTO v_existing_story
  FROM public.success_stories s
  WHERE s.legacy_pet_id = p_pet_id
  LIMIT 1;

  IF v_existing_story IS NOT NULL THEN
    DELETE FROM public.pets WHERE id = p_pet_id;
    RETURN v_existing_story;
  END IF;

  v_wizard :=
    p_adopted_photo_url IS NOT NULL
    OR p_adopter_story IS NOT NULL
    OR p_adopter_name IS NOT NULL
    OR p_adopter_quote IS NOT NULL
    OR p_adopted_photo_position IS NOT NULL
    OR p_adopted_at IS NOT NULL;

  IF v_wizard THEN
    v_final_adopter_name := COALESCE(
      NULLIF(trim(p_adopter_name), ''),
      NULLIF(trim(v_pet.adopter_name), '')
    );
    IF v_final_adopter_name IS NULL THEN
      RAISE EXCEPTION 'adopter name is required'
        USING errcode = 'P0001';
    END IF;

    v_final_story := COALESCE(
      NULLIF(trim(p_adopter_story), ''),
      NULLIF(trim(v_pet.adopter_story), ''),
      NULLIF(trim(v_pet.notes), ''),
      ''
    );
    v_final_photo_after := p_adopted_photo_url;
    v_final_photo_pos := COALESCE(
      NULLIF(trim(p_adopted_photo_position), ''),
      NULLIF(trim(v_pet.adopted_photo_position), ''),
      '50% 50%'
    );
    v_final_adopter_quote := COALESCE(
      NULLIF(trim(p_adopter_quote), ''),
      v_pet.adopter_quote
    );
    v_final_adopted_at := COALESCE(p_adopted_at, now());
  ELSE
    IF v_pet.adoption_status IS DISTINCT FROM 'adopted' THEN
      RAISE EXCEPTION 'pet must have adoption_status adopted';
    END IF;

    v_final_story := COALESCE(
      NULLIF(trim(v_pet.adopter_story), ''),
      NULLIF(trim(v_pet.notes), ''),
      ''
    );
    v_final_photo_after := v_pet.adopted_photo_url;
    v_final_photo_pos := COALESCE(
      NULLIF(trim(v_pet.adopted_photo_position), ''),
      '50% 50%'
    );
    v_final_adopter_name := v_pet.adopter_name;
    v_final_adopter_quote := v_pet.adopter_quote;
    v_final_adopted_at := COALESCE(v_pet.adopted_at, now());
  END IF;

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
    v_final_story,
    CASE WHEN v_pet.photos IS NULL THEN '[]'::jsonb ELSE to_jsonb(v_pet.photos) END,
    CASE WHEN v_pet.photo_positions IS NULL THEN '[]'::jsonb ELSE to_jsonb(v_pet.photo_positions) END,
    COALESCE(v_pet.primary_photo_idx, 0),
    v_final_photo_after,
    v_final_photo_pos,
    v_final_adopter_name,
    v_final_adopter_quote,
    v_final_adopted_at,
    v_pet.id
  )
  RETURNING id INTO v_story_id;

  DELETE FROM public.pets WHERE id = p_pet_id;

  RETURN v_story_id;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_adoption(uuid, text, text, text, text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_adoption(uuid, text, text, text, text, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_adoption(uuid, text, text, text, text, text, timestamptz) TO service_role;
