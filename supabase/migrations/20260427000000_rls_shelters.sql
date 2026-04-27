ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "shelters_public_select" ON public.shelters
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "shelters_admin_write" ON public.shelters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
