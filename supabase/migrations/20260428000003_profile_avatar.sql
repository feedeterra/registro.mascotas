ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url    text,
  ADD COLUMN IF NOT EXISTS avatar_position jsonb DEFAULT '{"x":50,"y":50}';
