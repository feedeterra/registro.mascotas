-- Eliminar columna raza (breed): ya no se usa en producto ni en UI.
ALTER TABLE public.pets DROP COLUMN IF EXISTS breed;
