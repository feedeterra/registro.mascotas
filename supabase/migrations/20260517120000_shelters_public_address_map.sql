-- Ubicación pública aproximada (ciudad/localidad) para mapa y listado.
-- lat/lng ya existen en shelters desde la fundación multi-refugio.

ALTER TABLE public.shelters ADD COLUMN IF NOT EXISTS address text;

COMMENT ON COLUMN public.shelters.address IS 'Ciudad o localidad legible para mostrar al usuario';
COMMENT ON COLUMN public.shelters.lat IS 'Latitud del centroide de la ciudad/localidad';
COMMENT ON COLUMN public.shelters.lng IS 'Longitud del centroide de la ciudad/localidad';

-- Permitir que el dueño del refugio actualice su fila (además de SuperAdmin con "shelters_admin_write").
DROP POLICY IF EXISTS "shelters_owner_update" ON public.shelters;
CREATE POLICY "shelters_owner_update" ON public.shelters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.shelter_id = shelters.id
        AND p.shelter_role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.shelter_id = shelters.id
        AND p.shelter_role = 'owner'
    )
  );
