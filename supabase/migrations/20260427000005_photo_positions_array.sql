ALTER TABLE public.pets
  DROP COLUMN IF EXISTS photo_position,
  ADD COLUMN IF NOT EXISTS photo_positions jsonb NOT NULL DEFAULT '[]'::jsonb;
