-- Feedback público: solo inserción vía RPC (service_role / Edge Function).
-- Lectura y actualización de estado: admins (RLS).

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL CHECK (type IN ('bug', 'idea', 'mejora', 'otro')),
  rating int CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  message text NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 500),
  page_url text NOT NULL CHECK (char_length(page_url) <= 2048),
  anon_id text NOT NULL CHECK (char_length(anon_id) BETWEEN 8 AND 80),
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  user_agent text,
  ip_hash text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'resolved', 'spam', 'archived')),
  admin_note text,
  source text NOT NULL DEFAULT 'floating_button'
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_anon_created ON public.feedback (anon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user_created ON public.feedback (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_ip_created ON public.feedback (ip_hash, created_at DESC) WHERE ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback (status);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Sin políticas de INSERT/DELETE para roles autenticados anónimos: no insert directo.

CREATE POLICY feedback_select_admin
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY feedback_update_admin
  ON public.feedback
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- RPC: llamado solo con service_role (Edge Function). Enforce cooldown + rate IP.
CREATE OR REPLACE FUNCTION public.submit_feedback(
  p_anon_id text,
  p_user_id uuid,
  p_type text,
  p_rating int,
  p_message text,
  p_page_url text,
  p_user_agent text,
  p_ip_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_msg text;
  v_url text;
  v_anon text;
BEGIN
  v_anon := nullif(trim(p_anon_id), '');
  IF v_anon IS NULL OR length(v_anon) < 8 OR length(v_anon) > 80 THEN
    RAISE EXCEPTION 'invalid_anon_id' USING ERRCODE = 'P0001';
  END IF;

  IF p_type IS NULL OR p_type NOT IN ('bug', 'idea', 'mejora', 'otro') THEN
    RAISE EXCEPTION 'invalid_type' USING ERRCODE = 'P0001';
  END IF;

  IF p_rating IS NOT NULL AND (p_rating < 1 OR p_rating > 5) THEN
    RAISE EXCEPTION 'invalid_rating' USING ERRCODE = 'P0001';
  END IF;

  v_msg := trim(p_message);
  IF v_msg IS NULL OR length(v_msg) < 10 OR length(v_msg) > 500 THEN
    RAISE EXCEPTION 'invalid_message' USING ERRCODE = 'P0001';
  END IF;

  v_url := trim(p_page_url);
  IF v_url IS NULL OR length(v_url) < 1 OR length(v_url) > 2048 THEN
    RAISE EXCEPTION 'invalid_page_url' USING ERRCODE = 'P0001';
  END IF;

  IF p_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p_user_id) THEN
    RAISE EXCEPTION 'invalid_user_id' USING ERRCODE = 'P0001';
  END IF;

  -- Cooldown 30 días: mismo anon_id (dispositivo) o mismo usuario logueado
  IF EXISTS (
    SELECT 1 FROM public.feedback f
    WHERE f.created_at > now() - interval '30 days'
      AND (
        f.anon_id = v_anon
        OR (p_user_id IS NOT NULL AND f.user_id = p_user_id)
      )
  ) THEN
    RAISE EXCEPTION 'cooldown' USING ERRCODE = 'P0001';
  END IF;

  -- Rate limit por IP hasheada (ventana 1 hora)
  IF p_ip_hash IS NOT NULL AND length(p_ip_hash) >= 16 THEN
    IF (
      SELECT count(*)::int FROM public.feedback f
      WHERE f.ip_hash = p_ip_hash AND f.created_at > now() - interval '1 hour'
    ) >= 30 THEN
      RAISE EXCEPTION 'rate_limit_ip' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  INSERT INTO public.feedback (
    type, rating, message, page_url, anon_id, user_id, user_agent, ip_hash, source
  ) VALUES (
    p_type, p_rating, v_msg, v_url, v_anon, p_user_id,
    nullif(left(trim(p_user_agent), 512), ''),
    nullif(trim(p_ip_hash), ''),
    'floating_button'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_feedback(text, uuid, text, int, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_feedback(text, uuid, text, int, text, text, text, text) TO service_role;

COMMENT ON TABLE public.feedback IS 'Feedback de la app; insert vía submit_feedback (Edge Function).';
COMMENT ON FUNCTION public.submit_feedback IS 'Inserta feedback con validación, cooldown y rate limit; solo service_role.';
