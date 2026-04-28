-- Agrega columna wants_to_volunteer a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wants_to_volunteer boolean DEFAULT false;
