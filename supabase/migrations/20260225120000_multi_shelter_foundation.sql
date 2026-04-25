-- Multi-refugio: tablas y columnas base. Ejecutar en Supabase → SQL Editor.
-- Idempotente (IF NOT EXISTS / IF NOT EXISTS columnas donde aplica).

-- Refugios (si ya existe la tabla, solo se agregan columnas faltantes abajo)
CREATE TABLE IF NOT EXISTS public.shelters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  city text,
  lat double precision,
  lng double precision,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Columnas extra por si la tabla shelters ya existía con otro esquema
ALTER TABLE public.shelters ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.shelters ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.shelters ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE public.shelters ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.shelters ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.shelters ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

INSERT INTO public.shelters (slug, name, city)
VALUES ('casa', 'Refugio CASA', 'Capilla del Señor, Buenos Aires')
ON CONFLICT (slug) DO NOTHING;

-- Staff: perfil vinculado a un refugio (dueño/equipo del panel refugio)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shelter_id uuid REFERENCES public.shelters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_shelter_id ON public.profiles(shelter_id);

-- Mascotas: origen del refugio (nullable = legado / sin asignar)
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS shelter_id uuid REFERENCES public.shelters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pets_shelter_id ON public.pets(shelter_id);

-- Config visual/donaciones: enlace al refugio (convive con fila legacy id = 'casa')
ALTER TABLE public.shelter_config
  ADD COLUMN IF NOT EXISTS shelter_id uuid REFERENCES public.shelters(id) ON DELETE CASCADE;

UPDATE public.shelter_config sc
SET shelter_id = s.id
FROM public.shelters s
WHERE s.slug = 'casa'
  AND sc.id = 'casa'
  AND sc.shelter_id IS NULL;

-- Anuncios por refugio (CRUD panel; la barra global puede leer el del refugio "principal" después)
CREATE TABLE IF NOT EXISTS public.shelter_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id uuid NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shelter_announcements_shelter ON public.shelter_announcements(shelter_id);

-- Eventos por refugio
CREATE TABLE IF NOT EXISTS public.shelter_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id uuid NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  title text,
  event_at timestamptz NOT NULL,
  place text,
  signup_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shelter_events_shelter ON public.shelter_events(shelter_id);
CREATE INDEX IF NOT EXISTS idx_shelter_events_at ON public.shelter_events(event_at);
