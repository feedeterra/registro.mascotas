-- Roles y suscripciones voluntarios. Idempotente.

-- Tabla de suscripciones: un usuario puede estar en múltiples refugios
CREATE TABLE IF NOT EXISTS public.volunteer_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shelter_id  uuid NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  roles       text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, shelter_id)
);

CREATE INDEX IF NOT EXISTS idx_vol_subs_user    ON public.volunteer_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vol_subs_shelter ON public.volunteer_subscriptions(shelter_id);

-- RLS
ALTER TABLE public.volunteer_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "vol_subs_own_select" ON public.volunteer_subscriptions
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vol_subs_own_insert" ON public.volunteer_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vol_subs_own_update" ON public.volunteer_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vol_subs_own_delete" ON public.volunteer_subscriptions
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vol_subs_staff_select" ON public.volunteer_subscriptions
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND shelter_id = volunteer_subscriptions.shelter_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vol_subs_admin_all" ON public.volunteer_subscriptions
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Función para que el usuario elimine su propia cuenta
CREATE OR REPLACE FUNCTION public.delete_own_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
