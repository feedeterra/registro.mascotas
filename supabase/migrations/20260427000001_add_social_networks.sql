-- Agregar campos de redes sociales a shelter_config
ALTER TABLE public.shelter_config 
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS tiktok_url text;
