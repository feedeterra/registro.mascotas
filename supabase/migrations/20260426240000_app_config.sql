-- Tabla singleton de configuración global de la app
CREATE TABLE IF NOT EXISTS public.app_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true), -- solo un row
  hero_image_url text,
  updated_at timestamptz DEFAULT now()
);

-- Insertar row inicial
INSERT INTO public.app_config (id) VALUES (true) ON CONFLICT DO NOTHING;

-- RLS: lectura pública, escritura solo superadmin
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_public_read" ON public.app_config
  FOR SELECT USING (true);

CREATE POLICY "app_config_superadmin_write" ON public.app_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
