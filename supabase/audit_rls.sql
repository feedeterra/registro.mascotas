-- ════════════════════════════════════════════════════════════════
-- AUDITORÍA RLS PRE-LAUNCH
-- Correr en Supabase Dashboard → SQL Editor
-- Cada query devuelve resultados que tenés que revisar
-- ════════════════════════════════════════════════════════════════

-- 1) ¿Qué tablas públicas tienen RLS activo?
-- Esperado: rowsecurity = true en TODAS las tablas que aparecen
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;
-- ⚠️ Si alguna fila aparece con rowsecurity=false, ejecutar:
--    ALTER TABLE public.<nombre> ENABLE ROW LEVEL SECURITY;

-- 2) Listado completo de policies
SELECT schemaname, tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 3) Tablas con RLS activo pero SIN policies (BLOQUEADAS para todos)
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND p.policyname IS NULL;
-- ⚠️ Si devuelve filas, esas tablas no se pueden leer. Hay que crear policy de SELECT.

-- 4) Storage: ¿buckets públicos?
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;
-- Esperado: pet-photos y shelter-images con public=true

-- 5) Storage policies (preferir pg_policies; storage.policies puede no existir según versión)
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- 6) Test de lectura anónima — simulá un usuario deslogueado
-- (Correr cada uno por separado para ver el resultado)
SET LOCAL ROLE anon;
SELECT count(*) AS anon_pets FROM public.pets WHERE is_active = true;
SELECT count(*) AS anon_shelters FROM public.shelters WHERE is_active = true;
SELECT count(*) AS anon_stories FROM public.success_stories;
RESET ROLE;
-- ⚠️ Si alguno da 0 cuando hay datos, falta policy de SELECT pública

-- 7) Datos de prueba a limpiar antes del launch
SELECT id, name, created_at FROM public.shelters
WHERE name ILIKE '%test%' OR name ILIKE '%dummy%' OR name ILIKE '%demo%';

SELECT id, name, created_at FROM public.pets
WHERE name ILIKE '%test%' OR name ILIKE '%dummy%' OR name ILIKE '%demo%';

-- 8) Verificar que app_config tenga una sola fila
SELECT count(*) FROM public.app_config;
-- Esperado: 1

-- 9) Trigger anti–escalada en profiles (tras migración 20260429120000)
SELECT t.tgname, p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal;
-- Debería existir profiles_prevent_self_privilege_escalation → profiles_prevent_self_privilege_escalation

-- 10) Policies peligrosas en volunteer_subscriptions (SELECT USING (true) = filas expuestas)
SELECT policyname, cmd, qual::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'volunteer_subscriptions'
ORDER BY policyname;

-- 11) RPC pública de agregados (tras migración 20260429123000)
SELECT proname, prosecdef AS security_definer
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'get_public_volunteer_stats';
-- Debería existir una fila con security_definer = true
