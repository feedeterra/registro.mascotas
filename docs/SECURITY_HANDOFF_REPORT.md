# Reporte de seguridad — implementado en repo vs pendiente en Supabase

Fecha de referencia: abril 2026. Complementa [`SUPABASE_SECURITY_RUNBOOK.md`](SUPABASE_SECURITY_RUNBOOK.md).

---

## 1. Qué quedó hecho en el repositorio (ya commiteado)

| Ítem | Detalle |
|------|---------|
| **Trigger anti-escalada en `profiles`** | Migración `supabase/migrations/20260429120000_profiles_prevent_self_privilege_escalation.sql`: antes de un `UPDATE`, si `auth.uid()` es el dueño de la fila y **no** es `is_admin`, no puede cambiar `is_admin`, `shelter_id` ni `shelter_role`. No interfiere con `assign_shelter_staff` / `remove_shelter_staff` (actualizan **otra** fila). |
| **Voluntarios: agregados vía RPC** | Migración `20260429123000_public_volunteer_stats_rpc.sql`: función `get_public_volunteer_stats()` (`SECURITY DEFINER`) devuelve `total` y `by_shelter` sin exponer filas. Elimina policies `Public can view subscriptions count` y `Volunteers viewable by everyone` si existían. El front usa `fetchPublicVolunteerStats()` en `services/home.js`, `App.jsx`, listados de refugios y ficha pública. |
| **Storage `pet-photos`** | Migración `20260429140000_storage_pet_photos_policies.sql`: policies en `storage.objects` por prefijo (`avatars/{uid}/`, `{pet_id}/`, `shelter/{shelter_id}/`, `hero/`). Avatares en el cliente pasan a `avatars/<userId>/...` (`Profile.jsx`, `EditProfileModal.jsx`). **Tras aplicar:** en Dashboard → Storage → Policies, eliminar reglas genéricas que permitan INSERT/UPDATE/DELETE en todo el bucket para `authenticated`, si no el OR de RLS sigue siendo permisivo. |
| **Auditoría SQL** | `supabase/audit_rls.sql`: secciones 9 (existencia del trigger) y 10 (policies de `volunteer_subscriptions`). |
| **Variables de entorno** | `.env.example`: placeholders `VITE_SUPABASE_*` y advertencia de no usar `service_role` en el front. |
| **Documentación** | Runbook §4 enlaza esta migración y este reporte. |
| **Cliente** | `useAuth.updateProfile` ya arma un payload acotado; `services/auth.js` documenta no usar `updateProfileRow` para columnas privilegiadas. |

**Importante:** la migración **no se aplica sola** en tu proyecto remoto hasta que alguien con acceso ejecute `supabase db push` (o copie el SQL al Dashboard).

---

## 2. Qué debe hacer tu compañero (solo con acceso a Supabase / infra)

### 2.1 Aplicar las migraciones nuevas

1. En staging (recomendado antes que prod):  
   `supabase link` + `supabase db push`  
   o abrir **SQL Editor** y ejecutar en orden el contenido de:  
   - `supabase/migrations/20260429120000_profiles_prevent_self_privilege_escalation.sql`  
   - `supabase/migrations/20260429123000_public_volunteer_stats_rpc.sql`  
   - `supabase/migrations/20260429140000_storage_pet_photos_policies.sql`  
2. **Orden crítico:** la migración de la RPC debe aplicarse **antes o junto** con el deploy del front que deja de usar `volunteer_subscriptions` en embeds públicos. El front tiene `.catch` de respaldo (ceros) si la RPC aún no existe.  
3. **Storage:** aplicar `20260429140000` **después** del deploy del front que sube avatares a `avatars/{uid}/...`. Revisar y quitar policies duplicadas permisivas en `storage.objects` para `pet-photos`.  
4. Si el `CREATE TRIGGER ... EXECUTE FUNCTION` falla por versión de Postgres, probar:  
   `EXECUTE PROCEDURE public.profiles_prevent_self_privilege_escalation();`
5. Verificar trigger con la query §9, RPC con §11 y policies de storage con §4–5 de `supabase/audit_rls.sql`.

### 2.2 Auditoría RLS completa (obligatorio en prod)

Ejecutar y **archivar resultados** (CSV/capturas):

- Consultas del runbook §2.1–2.3.
- `supabase/audit_rls.sql` completo.

Acciones típicas según hallazgos:

- Tablas sin RLS → `ENABLE ROW LEVEL SECURITY` + policies mínimas.
- Tablas con RLS y sin policies → añadir `SELECT` (o la app queda rota).
- Policies con `USING (true)` en datos sensibles → acotar o mover a RPC `SECURITY DEFINER`.

### 2.3 `volunteer_subscriptions`

- La migración `20260429123000_public_volunteer_stats_rpc.sql` hace `DROP POLICY IF EXISTS` de nombres peligrosos y añade `get_public_volunteer_stats`. Tras aplicarla, comprobar en §10 de `audit_rls.sql` que no queden policies con `qual` trivial en SELECT para datos sensibles.
- Si en prod había otra policy con nombre distinto y `USING (true)`, eliminarla manualmente o añadir otro `DROP POLICY IF EXISTS` en una migración nueva.

### 2.4 Storage (`pet-photos`)

- Aplicar `20260429140000_storage_pet_photos_policies.sql` y **eliminar en el Dashboard** policies antiguas demasiado amplias en `storage.objects` (ver §7 del runbook).
- Objetivo: solo paths `avatars/{uid}/`, `{pet_id}/`, `shelter/{shelter_id}/`, `hero/` según rol; el front ya usa `avatars/<userId>/` para perfil.

### 2.5 Auth (Dashboard)

- **Site URL** y **Redirect URLs** correctos para prod (y previews si aplica).
- Política de **confirmación de email** acorde al lanzamiento.
- Confirmar que **ningún** secreto `service_role` esté en `VITE_*`, repo o front estático.

### 2.6 RPC y grants

- Revisar `GRANT EXECUTE` y uso de `assign_shelter_staff`, `remove_shelter_staff`, `delete_own_user` (runbook §4.4).

### 2.7 Smoke test después de cambios

Home, refugios, mascota, login, perfil (editar datos), voluntariado, asignar/quitar staff, superadmin, borrar cuenta (si aplica).

---

## 2.8 Automatización en el repo (recordatorio)

- **`npm run check:db-standards`**: valida convenciones en `supabase/migrations` (RLS obligatorio para tablas nuevas en `public`, avisos en policies sensibles). Incluido en **`npm run verify`** junto al build.
- **GitHub Actions**: `.github/workflows/db-migration-standards.yml` en PRs que tocan migraciones.
- **No cubre**: estado real del proyecto remoto en Supabase (hay que aplicar migraciones y correr `audit_rls.sql` allí). Para comprobar la DB viva hace falta CLI + `supabase db lint` (si lo usan) o queries del runbook.

---

## 3. Lo que este repo **no** puede automatizar

- Ejecutar SQL en el proyecto remoto de Supabase.
- Cambiar políticas de Storage desde el código del front.
- Configurar Auth redirects ni dominios en el Dashboard.
- Rotar claves ni revisar logs de abuso en Supabase.

---

## 4. Referencias rápidas en el repo

| Archivo |
|---------|
| `docs/SUPABASE_SECURITY_RUNBOOK.md` |
| `supabase/migrations/20260429120000_profiles_prevent_self_privilege_escalation.sql` (trigger `profiles`) |
| `supabase/migrations/20260429123000_public_volunteer_stats_rpc.sql` (RPC voluntarios) |
| `supabase/migrations/20260429140000_storage_pet_photos_policies.sql` (Storage) |
| `supabase/audit_rls.sql` |
| `scripts/fix_security_v3.sql` (solo referencia; contrastar con prod antes de reaplicar) |
