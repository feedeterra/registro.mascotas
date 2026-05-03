-- Slug por refugio: URL /refugio/:shelter_slug/perro/:pet_slug
-- Primer nombre base libre → solo slugify(nombre); colisiones → base + '-' + 4 hex del id (sin guiones).

CREATE OR REPLACE FUNCTION public.slugify_pet_name(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(
    left(
      trim(both '-' FROM regexp_replace(
        regexp_replace(lower(trim(coalesce(raw, ''))), '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      )),
      72
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.pets_assign_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  b text;
  cand text;
  suf text;
  id_hex text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL
     AND NEW.shelter_id IS NOT DISTINCT FROM OLD.shelter_id
  THEN
    NEW.slug := OLD.slug;
    RETURN NEW;
  END IF;

  IF NEW.shelter_id IS NULL THEN
    NEW.slug := NULL;
    RETURN NEW;
  END IF;

  b := public.slugify_pet_name(NEW.name);
  IF b IS NULL THEN
    b := 'mascota';
  END IF;

  id_hex := replace(NEW.id::text, '-', '');

  cand := b;
  IF NOT EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.shelter_id = NEW.shelter_id
      AND p.slug = cand
      AND p.id IS DISTINCT FROM NEW.id
  ) THEN
    NEW.slug := cand;
    RETURN NEW;
  END IF;

  suf := substr(id_hex, 1, 4);
  cand := b || '-' || suf;
  IF NOT EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.shelter_id = NEW.shelter_id
      AND p.slug = cand
      AND p.id IS DISTINCT FROM NEW.id
  ) THEN
    NEW.slug := cand;
    RETURN NEW;
  END IF;

  suf := substr(id_hex, 1, 8);
  NEW.slug := b || '-' || suf;
  RETURN NEW;
END;
$$;

ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS slug text;

DROP TRIGGER IF EXISTS trg_pets_assign_slug ON public.pets;

WITH base AS (
  SELECT
    id,
    shelter_id,
    public.slugify_pet_name(name) AS raw_base,
    created_at,
    replace(id::text, '-', '') AS id_hex
  FROM public.pets
  WHERE shelter_id IS NOT NULL
),
norm AS (
  SELECT
    id,
    shelter_id,
    created_at,
    id_hex,
    coalesce(nullif(raw_base, ''), 'mascota') AS b
  FROM base
),
ranked AS (
  SELECT
    id,
    b,
    id_hex,
    row_number() OVER (
      PARTITION BY shelter_id, b
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM norm
),
final AS (
  SELECT
    id,
    CASE
      WHEN rn = 1 THEN b
      ELSE b || '-' || substr(id_hex, 1, 4)
    END AS new_slug
  FROM ranked
)
UPDATE public.pets p
SET slug = f.new_slug
FROM final f
WHERE p.id = f.id
  AND (p.slug IS NULL OR btrim(p.slug) = '');

CREATE TRIGGER trg_pets_assign_slug
BEFORE INSERT OR UPDATE OF name, shelter_id ON public.pets
FOR EACH ROW
EXECUTE FUNCTION public.pets_assign_slug();

CREATE UNIQUE INDEX IF NOT EXISTS idx_pets_shelter_slug_unique
ON public.pets (shelter_id, slug)
WHERE shelter_id IS NOT NULL AND slug IS NOT NULL;

COMMENT ON COLUMN public.pets.slug IS 'Único por refugio; URL /refugio/{shelter.slug}/perro/{slug}. NULL si shelter_id NULL.';
