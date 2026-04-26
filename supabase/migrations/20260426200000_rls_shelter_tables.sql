-- RLS para shelter_config, shelter_announcements, shelter_events, pets
-- Idempotente: usa DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$

-- ── shelter_config ─────────────────────────────────────────────────
ALTER TABLE public.shelter_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "shelter_config_public_select" ON public.shelter_config
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "shelter_config_staff_update" ON public.shelter_config
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = shelter_config.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "shelter_config_staff_insert" ON public.shelter_config
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = shelter_config.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "shelter_config_admin_delete" ON public.shelter_config
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── shelter_announcements ──────────────────────────────────────────
ALTER TABLE public.shelter_announcements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "ann_public_select" ON public.shelter_announcements
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "ann_staff_insert" ON public.shelter_announcements
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = shelter_announcements.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "ann_staff_update" ON public.shelter_announcements
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = shelter_announcements.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "ann_staff_delete" ON public.shelter_announcements
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = shelter_announcements.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── shelter_events ─────────────────────────────────────────────────
ALTER TABLE public.shelter_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "evt_public_select" ON public.shelter_events
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "evt_staff_insert" ON public.shelter_events
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = shelter_events.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "evt_staff_update" ON public.shelter_events
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = shelter_events.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "evt_staff_delete" ON public.shelter_events
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = shelter_events.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── pets ───────────────────────────────────────────────────────────
-- Solo activa RLS si no está activa (pets puede ya tener policies)
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "pets_public_select" ON public.pets
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pets_owner_insert" ON public.pets
    FOR INSERT WITH CHECK (
      auth.uid() = owner_id
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = pets.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pets_owner_update" ON public.pets
    FOR UPDATE USING (
      auth.uid() = owner_id
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = pets.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pets_owner_delete" ON public.pets
    FOR DELETE USING (
      auth.uid() = owner_id
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND shelter_id = pets.shelter_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── profiles: campo notes para voluntarios ─────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notes text;
