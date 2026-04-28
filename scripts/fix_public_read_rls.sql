-- Asegurar que todos pueden VER los datos públicos de los refugios
-- (aunque no estén logueados)

-- 1. Refugios
DROP POLICY IF EXISTS "Public can view shelters" ON public.shelters;
CREATE POLICY "Public can view shelters" ON public.shelters FOR SELECT USING (is_active = true);

-- 2. Configuración (Fotos, WhatsApp, etc)
DROP POLICY IF EXISTS "Public can view shelter config" ON public.shelter_config;
CREATE POLICY "Public can view shelter config" ON public.shelter_config FOR SELECT USING (true);

-- 3. Mascotas
DROP POLICY IF EXISTS "Public can view pets" ON public.pets;
CREATE POLICY "Public can view pets" ON public.pets FOR SELECT USING (true);

-- 4. Anuncios
DROP POLICY IF EXISTS "Public can view announcements" ON public.shelter_announcements;
CREATE POLICY "Public can view announcements" ON public.shelter_announcements FOR SELECT USING (active = true);

-- 5. Eventos
DROP POLICY IF EXISTS "Public can view events" ON public.shelter_events;
CREATE POLICY "Public can view events" ON public.shelter_events FOR SELECT USING (true);
