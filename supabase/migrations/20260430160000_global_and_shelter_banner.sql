-- Barra superior: aviso global (SuperAdmin) + campos de barra por refugio (shelter_config)
ALTER TABLE public.app_config
  ADD COLUMN IF NOT EXISTS global_banner_text text,
  ADD COLUMN IF NOT EXISTS global_banner_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS global_banner_ends_at timestamptz;

ALTER TABLE public.shelter_config
  ADD COLUMN IF NOT EXISTS announcement_text text,
  ADD COLUMN IF NOT EXISTS announcement_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS announcement_end_date timestamptz;
