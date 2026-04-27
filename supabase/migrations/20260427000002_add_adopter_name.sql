-- Agregar campo adopter_name a la tabla pets
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS adopter_name text;
