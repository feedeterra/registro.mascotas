-- Columns for volunteer registration on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS volunteer_roles text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS phone text;

-- Volunteer config on shelter_config
ALTER TABLE public.shelter_config
  ADD COLUMN IF NOT EXISTS volunteer_group_url text,
  ADD COLUMN IF NOT EXISTS volunteer_group_msg text;
