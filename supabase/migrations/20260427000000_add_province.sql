-- Agregar columna province a shelter_config
ALTER TABLE public.shelter_config ADD COLUMN IF NOT EXISTS province text;

-- También agregarla a shelters por si acaso (más performante para listas)
ALTER TABLE public.shelters ADD COLUMN IF NOT EXISTS province text;
