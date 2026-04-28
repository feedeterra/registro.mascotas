-- MASCOTAS (staff + owner)
DROP POLICY IF EXISTS "Shelter staff can insert pets" ON public.pets;
CREATE POLICY "Shelter staff can insert pets" ON public.pets FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND shelter_id IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  AND profiles.shelter_id = pets.shelter_id AND profiles.shelter_role IN ('staff','owner')
));

DROP POLICY IF EXISTS "Shelter staff can update pets" ON public.pets;
CREATE POLICY "Shelter staff can update pets" ON public.pets FOR UPDATE
USING (auth.uid() IS NOT NULL AND shelter_id IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  AND profiles.shelter_id = pets.shelter_id AND profiles.shelter_role IN ('staff','owner')
));

DROP POLICY IF EXISTS "Shelter staff can delete pets" ON public.pets;
CREATE POLICY "Shelter staff can delete pets" ON public.pets FOR DELETE
USING (auth.uid() IS NOT NULL AND shelter_id IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  AND profiles.shelter_id = pets.shelter_id AND profiles.shelter_role IN ('staff','owner')
));

-- ANUNCIOS (staff + owner)
DROP POLICY IF EXISTS "Shelter staff can insert announcements" ON public.shelter_announcements;
CREATE POLICY "Shelter staff can insert announcements" ON public.shelter_announcements FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  AND profiles.shelter_id = shelter_announcements.shelter_id AND profiles.shelter_role IN ('staff','owner')
));

DROP POLICY IF EXISTS "Shelter staff can update announcements" ON public.shelter_announcements;
CREATE POLICY "Shelter staff can update announcements" ON public.shelter_announcements FOR UPDATE
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  AND profiles.shelter_id = shelter_announcements.shelter_id AND profiles.shelter_role IN ('staff','owner')
));

DROP POLICY IF EXISTS "Shelter staff can delete announcements" ON public.shelter_announcements;
CREATE POLICY "Shelter staff can delete announcements" ON public.shelter_announcements FOR DELETE
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  AND profiles.shelter_id = shelter_announcements.shelter_id AND profiles.shelter_role IN ('staff','owner')
));

-- EVENTOS (staff + owner)
DROP POLICY IF EXISTS "Shelter staff can insert events" ON public.shelter_events;
CREATE POLICY "Shelter staff can insert events" ON public.shelter_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  AND profiles.shelter_id = shelter_events.shelter_id AND profiles.shelter_role IN ('staff','owner')
));

DROP POLICY IF EXISTS "Shelter staff can update events" ON public.shelter_events;
CREATE POLICY "Shelter staff can update events" ON public.shelter_events FOR UPDATE
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  AND profiles.shelter_id = shelter_events.shelter_id AND profiles.shelter_role IN ('staff','owner')
));

DROP POLICY IF EXISTS "Shelter staff can delete events" ON public.shelter_events;
CREATE POLICY "Shelter staff can delete events" ON public.shelter_events FOR DELETE
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  AND profiles.shelter_id = shelter_events.shelter_id AND profiles.shelter_role IN ('staff','owner')
));

-- REFUGIO - info (solo owner)
DROP POLICY IF EXISTS "Owner can update shelter info" ON public.shelters;
CREATE POLICY "Owner can update shelter info" ON public.shelters FOR UPDATE
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  AND profiles.shelter_id = shelters.id AND profiles.shelter_role = 'owner'
));

-- SHELTER CONFIG (solo owner) - nombre correcto sin 's'
DROP POLICY IF EXISTS "Owner can update shelter config" ON public.shelter_config;
CREATE POLICY "Owner can update shelter config" ON public.shelter_config FOR UPDATE
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  AND profiles.shelter_id = shelter_config.shelter_id AND profiles.shelter_role = 'owner'
));

-- ROLES: el owner puede actualizar perfiles de su refugio
DROP POLICY IF EXISTS "Owner can manage staff roles" ON public.profiles;
CREATE POLICY "Owner can manage staff roles" ON public.profiles FOR UPDATE
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles AS me WHERE me.id = auth.uid()
  AND me.shelter_id = profiles.shelter_id AND me.shelter_role = 'owner'
));
