-- Políticas RLS en storage.objects para bucket pet-photos (alineadas con rutas del cliente).
-- IMPORTANTE: si en el Dashboard hay policies genéricas ("authenticated can upload" sin path),
-- hay que eliminarlas; con RLS, varias policies se combinan con OR y una permisiva anula el resto.
--
-- Rutas usadas por la app:
--   avatars/{auth.uid()}/...     — fotos de perfil
--   {pet_id}/...                 — fotos de mascotas (pet.id = primer segmento)
--   shelter/{shelter_id}/...     — imágenes del refugio (InfoTab)
--   hero/...                     — hero global (solo is_admin)

-- Lectura pública (bucket suele ser público; las URLs ya son públicas)
DROP POLICY IF EXISTS "storage_pet_photos_public_read" ON storage.objects;
CREATE POLICY "storage_pet_photos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'pet-photos');

-- ── INSERT ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "storage_pet_photos_insert_avatar_own" ON storage.objects;
CREATE POLICY "storage_pet_photos_insert_avatar_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = 'avatars'
    AND split_part(name, '/', 2) = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_pet_photos_insert_pet_media" ON storage.objects;
CREATE POLICY "storage_pet_photos_insert_pet_media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id::text = split_part(name, '/', 1)
        AND (
          p.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles pr
            WHERE pr.id = auth.uid() AND pr.shelter_id IS NOT DISTINCT FROM p.shelter_id
          )
          OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.is_admin = true)
        )
    )
  );

DROP POLICY IF EXISTS "storage_pet_photos_insert_shelter_media" ON storage.objects;
CREATE POLICY "storage_pet_photos_insert_shelter_media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = 'shelter'
    AND EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND (
          pr.is_admin = true
          OR (pr.shelter_id IS NOT NULL AND pr.shelter_id::text = split_part(name, '/', 2))
        )
    )
  );

DROP POLICY IF EXISTS "storage_pet_photos_insert_hero_admin" ON storage.objects;
CREATE POLICY "storage_pet_photos_insert_hero_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = 'hero'
    AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.is_admin = true)
  );

-- ── UPDATE (upsert / replace) ───────────────────────────────────────

DROP POLICY IF EXISTS "storage_pet_photos_update_avatar_own" ON storage.objects;
CREATE POLICY "storage_pet_photos_update_avatar_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = 'avatars'
    AND split_part(name, '/', 2) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = 'avatars'
    AND split_part(name, '/', 2) = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_pet_photos_update_pet_media" ON storage.objects;
CREATE POLICY "storage_pet_photos_update_pet_media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id::text = split_part(name, '/', 1)
        AND (
          p.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles pr
            WHERE pr.id = auth.uid() AND pr.shelter_id IS NOT DISTINCT FROM p.shelter_id
          )
          OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.is_admin = true)
        )
    )
  )
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id::text = split_part(name, '/', 1)
        AND (
          p.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles pr
            WHERE pr.id = auth.uid() AND pr.shelter_id IS NOT DISTINCT FROM p.shelter_id
          )
          OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.is_admin = true)
        )
    )
  );

DROP POLICY IF EXISTS "storage_pet_photos_update_shelter_media" ON storage.objects;
CREATE POLICY "storage_pet_photos_update_shelter_media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = 'shelter'
    AND EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND (
          pr.is_admin = true
          OR (pr.shelter_id IS NOT NULL AND pr.shelter_id::text = split_part(name, '/', 2))
        )
    )
  )
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = 'shelter'
    AND EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND (
          pr.is_admin = true
          OR (pr.shelter_id IS NOT NULL AND pr.shelter_id::text = split_part(name, '/', 2))
        )
    )
  );

DROP POLICY IF EXISTS "storage_pet_photos_update_hero_admin" ON storage.objects;
CREATE POLICY "storage_pet_photos_update_hero_admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = 'hero'
    AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.is_admin = true)
  )
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = 'hero'
    AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.is_admin = true)
  );

-- ── DELETE ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "storage_pet_photos_delete_avatar_own" ON storage.objects;
CREATE POLICY "storage_pet_photos_delete_avatar_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = 'avatars'
    AND split_part(name, '/', 2) = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_pet_photos_delete_pet_media" ON storage.objects;
CREATE POLICY "storage_pet_photos_delete_pet_media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id::text = split_part(name, '/', 1)
        AND (
          p.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles pr
            WHERE pr.id = auth.uid() AND pr.shelter_id IS NOT DISTINCT FROM p.shelter_id
          )
          OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.is_admin = true)
        )
    )
  );

DROP POLICY IF EXISTS "storage_pet_photos_delete_shelter_media" ON storage.objects;
CREATE POLICY "storage_pet_photos_delete_shelter_media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = 'shelter'
    AND EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND (
          pr.is_admin = true
          OR (pr.shelter_id IS NOT NULL AND pr.shelter_id::text = split_part(name, '/', 2))
        )
    )
  );

DROP POLICY IF EXISTS "storage_pet_photos_delete_hero_admin" ON storage.objects;
CREATE POLICY "storage_pet_photos_delete_hero_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = 'hero'
    AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.is_admin = true)
  );
