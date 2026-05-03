-- Políticas Storage: imágenes de historias bajo pet-photos/stories/shelter-{uuid}/
-- Alineado con uploadStoryImage() en src/lib/supabase.js
--
-- Nota: Si en el proyecto ya existe una policy muy permisiva de INSERT/UPDATE/DELETE
-- sobre todo el bucket, Postgres aplicará OR entre policies: conviene revisar el
-- dashboard y eliminar reglas del tipo "cualquier autenticado en cualquier path".

DROP POLICY IF EXISTS "pet_photos_stories_staff_insert" ON storage.objects;
CREATE POLICY "pet_photos_stories_staff_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pet-photos'
  AND name LIKE 'stories/shelter-%/%'
  AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.shelter_id IS NOT NULL
        AND name LIKE 'stories/shelter-' || p.shelter_id::text || '/%'
    )
  )
);

DROP POLICY IF EXISTS "pet_photos_stories_staff_update" ON storage.objects;
CREATE POLICY "pet_photos_stories_staff_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pet-photos'
  AND name LIKE 'stories/shelter-%/%'
  AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.shelter_id IS NOT NULL
        AND name LIKE 'stories/shelter-' || p.shelter_id::text || '/%'
    )
  )
)
WITH CHECK (
  bucket_id = 'pet-photos'
  AND name LIKE 'stories/shelter-%/%'
  AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.shelter_id IS NOT NULL
        AND name LIKE 'stories/shelter-' || p.shelter_id::text || '/%'
    )
  )
);

DROP POLICY IF EXISTS "pet_photos_stories_staff_delete" ON storage.objects;
CREATE POLICY "pet_photos_stories_staff_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pet-photos'
  AND name LIKE 'stories/shelter-%/%'
  AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.shelter_id IS NOT NULL
        AND name LIKE 'stories/shelter-' || p.shelter_id::text || '/%'
    )
  )
);
