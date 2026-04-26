-- Adición de campos para historias de éxito (finales felices)
ALTER TABLE public.pets 
  ADD COLUMN IF NOT EXISTS adopted_at timestamptz,
  ADD COLUMN IF NOT EXISTS adopter_name text,
  ADD COLUMN IF NOT EXISTS adopter_quote text,
  ADD COLUMN IF NOT EXISTS adopter_story text;

COMMENT ON COLUMN public.pets.adopter_story IS 'Historia detallada de la adopción, separada de las notas de rescate.';
