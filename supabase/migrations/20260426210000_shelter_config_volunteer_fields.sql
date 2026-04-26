-- Add volunteer/donation fields to shelter_config (idempotent)
ALTER TABLE public.shelter_config
  ADD COLUMN IF NOT EXISTS whatsapp_group_link text,
  ADD COLUMN IF NOT EXISTS volunteer_group_msg text,
  ADD COLUMN IF NOT EXISTS transfer_accounts jsonb DEFAULT '[]'::jsonb;
