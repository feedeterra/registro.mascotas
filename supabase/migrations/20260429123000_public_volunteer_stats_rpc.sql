-- Estadísticas públicas de voluntarios sin exponer filas de volunteer_subscriptions (solo totales y conteos por refugio).
-- Permite retirar policies SELECT USING (true) si existían. El front debe llamar a get_public_volunteer_stats().

CREATE OR REPLACE FUNCTION public.get_public_volunteer_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*)::bigint FROM public.volunteer_subscriptions),
    'by_shelter', (
      SELECT coalesce(
        jsonb_object_agg(x.shelter_id::text, x.cnt),
        '{}'::jsonb
      )
      FROM (
        SELECT shelter_id, count(*)::int AS cnt
        FROM public.volunteer_subscriptions
        GROUP BY shelter_id
      ) x
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_volunteer_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_volunteer_stats() TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_volunteer_stats() IS
  'Solo agregados (total y conteos por shelter_id). Sin user_id; apto para anon.';

-- Policies históricas que exponen todas las filas (ver scripts/fix_security_v3.sql y migration_volunteer_subscriptions.sql)
DROP POLICY IF EXISTS "Public can view subscriptions count" ON public.volunteer_subscriptions;
DROP POLICY IF EXISTS "Volunteers viewable by everyone" ON public.volunteer_subscriptions;
