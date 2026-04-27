ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS photo_position text NOT NULL DEFAULT 'center top';
