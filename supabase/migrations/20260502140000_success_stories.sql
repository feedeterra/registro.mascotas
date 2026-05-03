-- Historias de éxito como entidad propia (independiente de pets tras adopción).
-- Idempotente donde aplica.

CREATE TABLE IF NOT EXISTS public.success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id uuid NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  pet_name text NOT NULL,
  sex text,
  story text NOT NULL DEFAULT '',
  photos_before jsonb NOT NULL DEFAULT '[]'::jsonb,
  photo_positions jsonb NOT NULL DEFAULT '[]'::jsonb,
  primary_photo_idx int NOT NULL DEFAULT 0,
  photo_after_url text,
  photo_after_position text DEFAULT '50% 50%',
  adopter_name text,
  adopter_quote text,
  adopted_at timestamptz,
  legacy_pet_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_success_stories_shelter ON public.success_stories(shelter_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_adopted_at ON public.success_stories(adopted_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_success_stories_legacy_pet ON public.success_stories(legacy_pet_id) WHERE legacy_pet_id IS NOT NULL;

COMMENT ON TABLE public.success_stories IS 'Finales felices publicados por refugio; legacy_pet_id enlaza al id del pet eliminado tras finalize_adoption.';
COMMENT ON COLUMN public.success_stories.legacy_pet_id IS 'UUID del registro pets borrado; permite redirect /perro/:id → historia.';

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "success_stories_public_select" ON public.success_stories
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "success_stories_staff_insert" ON public.success_stories
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = success_stories.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "success_stories_staff_update" ON public.success_stories
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = success_stories.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "success_stories_staff_delete" ON public.success_stories
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = success_stories.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Copia un pet adoptado a success_stories y elimina el pet (misma transacción).
-- Requiere que el pet ya esté en adoption_status = 'adopted' con datos cargados.
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
    COALESCE(v_pet.photos, '[]'::jsonb),
    COALESCE(v_pet.photo_positions, '[]'::jsonb),
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

REVOKE ALL ON FUNCTION public.finalize_adoption(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_adoption(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_adoption(uuid) TO service_role;
