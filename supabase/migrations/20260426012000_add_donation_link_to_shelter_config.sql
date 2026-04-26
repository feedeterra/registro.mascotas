-- Add donation_link to shelter_config (idempotent)
ALTER TABLE public.shelter_config
  ADD COLUMN IF NOT EXISTS donation_link text;

