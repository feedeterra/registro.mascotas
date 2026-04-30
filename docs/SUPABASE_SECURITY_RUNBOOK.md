# Runbook de seguridad Supabase — Registro Mascotas

Documento para quien tenga acceso al **Dashboard de Supabase** (SQL Editor, Storage, Authentication). Objetivo: verificar y endurecer **RLS**, **Storage**, **RPC** y **perfiles** sin depender solo del front (React).

**Fuente de verdad del esquema en repo:** carpeta `supabase/migrations/` (orden cronológico). Los archivos en `scripts/` son parches manuales históricos: **no asumir** que producción coincide con ellos; hay que **comparar** con lo que devuelven las consultas de auditoría.

---

## 1. Antes de empezar

| Ítem | Acción |
|------|--------|
| Entorno | Indicar si las pruebas son **staging** o **producción**. |
| Backup | En producción, confirmar que existen backups / point-in-time recovery según plan de Supabase. |
| Ventana | Algunos `ALTER` y policies no requieren downtime, pero conviene no hacer cambios masivos en horario pico. |
| Migraciones pendientes | Si el equipo usa `supabase db push` o migraciones CI, asegurarse de que **todas** las migraciones del repo estén aplicadas en el proyecto remoto antes de auditar. |

---

## 2. Auditoría rápida (copiar/pegar en SQL Editor)

Ejecutar en este orden y **guardar resultados** (export o capturas) para el historial.

### 2.1 Tablas `public` sin RLS

Toda tabla expuesta a PostgREST (API) debería tener `rowsecurity = true`, salvo decisión explícita en contra.

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;
```

**Acción si `rowsecurity = false` en tablas con datos sensibles:**

```sql
ALTER TABLE public.<nombre_tabla> ENABLE ROW LEVEL SECURITY;
```

Luego **crear policies** (SELECT mínimo); sin policies, con RLS activo la tabla queda bloqueada.

### 2.2 RLS activo pero sin ninguna policy (tabla ilegible)

```sql
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND p.policyname IS NULL;
```

Si hay filas: agregar al menos una policy de `SELECT` acorde al producto.

### 2.3 Listado completo de policies

```sql
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

Revisar especialmente:

- `FOR ALL` o `USING (true)` en tablas con **PII** (emails, teléfonos, direcciones).
- Duplicados contradictorios (varias policies que suman permisos demasiado amplios).

### 2.4 Tablas que el código usa (checklist)

Comparar el listado anterior con estas tablas usadas por la app (si alguna **no aparece** en `pg_policies`, investigar):

- `profiles`
- `shelters`
- `pets`
- `shelter_config`
- `shelter_announcements`
- `shelter_events`
- `volunteer_subscriptions`
- `app_config`
- Cualquier otra creada después (p. ej. historias, avistamientos): buscar en `supabase/migrations/` nombres `CREATE TABLE`.

**Atención:** En el repo **no hay una migración** que defina de forma única todas las policies de `public.profiles`. Parte de la lógica puede estar solo en `scripts/fix_security_v3.sql`, `scripts/fix_staff_rls*.sql`. En producción hay que **confirmar** que `profiles` tiene RLS y policies acordes (ver sección 4).

---

## 3. Lectura anónima (`anon`) — expectativas

El archivo `supabase/audit_rls.sql` incluye pruebas con rol `anon`. **Importante:** en el SQL Editor del dashboard a veces el contexto no equivale al JWT `anon` del cliente. Lo más fiable es:

1. Desde la app o **Postman**, llamar a la API REST con **solo** la `anon key` (sin `Authorization`), o  
2. Usar la consola con `SET ROLE` si el proyecto lo permite.

Consultas de referencia (ajustar nombres de tablas/columnas si cambiaron):

```sql
-- Ejemplo: conteo esperado > 0 si la app pública debe listar datos
SET LOCAL ROLE anon;
SELECT count(*) AS anon_pets FROM public.pets;  -- si hay filtro is_active, alinear con la app
SELECT count(*) AS anon_shelters FROM public.shelters WHERE is_active = true;
RESET ROLE;
```

Documentar qué debe ser **público** vs **solo autenticado** según producto.

---

## 4. Tabla `profiles` (crítico)

### 4.1 Riesgo

El cliente (React) hace `update` en `profiles` para el usuario logueado. Si las policies permiten actualizar **cualquier columna** de la propia fila, un usuario podría intentar escalar privilegios poniendo:

- `is_admin = true`
- `shelter_id` / `shelter_role` de otro refugio

**La UI no debe ser la única defensa:** tiene que fallar en **Postgres**.

### 4.2 Verificación manual recomendada

1. En Dashboard → **Table Editor**, anotar un usuario de prueba **sin** admin.
2. Con ese usuario, en la app o vía API, **no** debe poder volverse admin.
3. Opcional: en SQL como `service_role` (solo personal de confianza), simular no es trivial; mejor prueba desde cliente con `supabase-js` y anon/authenticated key.

### 4.3 Endurecimiento recomendado (opcional — revisar con el equipo)

Si hoy no hay restricción explícita, valorar **una** de estas líneas (no aplicar a ciegas sin revisar policies existentes):

**Opción A — Policy `WITH CHECK` en UPDATE propio** (impide cambiar flags privilegiados; requiere que los cambios de `shelter_*` pasen solo por RPC `assign_shelter_staff` / admin):

- Documentar políticas exactas con el estado actual de `pg_policies` antes de tocar nada.

**Opción B — Trigger `BEFORE UPDATE` en `profiles`**

- Revierte o rechaza actualizaciones de `is_admin`, `shelter_id`, `shelter_role` si el actor no es admin o no es el flujo esperado.

**Opción C — Column-level privileges** (menos habitual con Supabase + PostgREST)

- Limitar qué columnas expone el rol `authenticated` para `UPDATE`.

Cualquier cambio debe probarse: login, edición de perfil, onboarding, asignación de staff, panel refugio, superadmin.

**En repo (opción B):** migración `supabase/migrations/20260429120000_profiles_prevent_self_privilege_escalation.sql` — trigger `BEFORE UPDATE` que impide auto-modificar `is_admin`, `shelter_id` y `shelter_role` si el actor no es admin (no bloquea RPC ni updates de otra fila por dueño/admin). Debe **aplicarse en el proyecto Supabase** (`supabase db push` o pegar el SQL en el Editor). Ver también `docs/SECURITY_HANDOFF_REPORT.md`.

### 4.4 RPC relacionadas (ya en migraciones)

Revisar definición y permisos de ejecución (`GRANT`) para:

- `assign_shelter_staff(target_user_id, target_shelter_id, role)`
- `remove_shelter_staff(target_user_id)`
- `delete_own_user()`

Migración de referencia: `supabase/migrations/20260426220000_shelter_roles_and_rpc.sql`.

Comprobar que:

- Tienen `SECURITY DEFINER` y `SET search_path = public` (ya figura en el archivo).
- Solo los roles esperados pueden **ejecutar** la función (en Supabase suele ser `authenticated` + lógica interna).

---

## 5. Multi-tenant: refugios, mascotas, contenido

### 5.1 Estado esperado según migraciones del repo

- **`shelters`:** `SELECT` público; escritura condicionada a `is_admin` en `20260427000000_rls_shelters.sql`. Si en producción existen policies extra de `scripts/fix_staff_rls_v2.sql` (owner puede UPDATE), **no deben** permitir que un owner modifique **otro** refugio.
- **`shelter_config`:** lectura pública; insert/update restringidos (owner o admin según migración `20260426220000`).
- **`shelter_announcements` / `shelter_events`:** lectura pública; escritura por staff del mismo `shelter_id` (o admin).
- **`pets`:** lectura pública en migración base; insert/update/delete por `owner_id`, staff del mismo refugio o admin. Comprobar que no haya policies duplicadas y conflictivas entre migraciones y scripts viejos.

### 5.2 Prueba conceptual

Para cada par de refugios A y B:

- Usuario staff de A **no** debe poder `UPDATE` / `DELETE` filas con `shelter_id = B`.

---

## 6. `volunteer_subscriptions`

Migración: `20260425000000_roles_and_subscriptions.sql` (usuario gestiona sus filas; staff puede SELECT del mismo refugio; admin ALL).

**Agregados públicos (repo):** migración `20260429123000_public_volunteer_stats_rpc.sql` — RPC `get_public_volunteer_stats()` y `DROP POLICY IF EXISTS` de políticas históricas demasiado abiertas. El cliente ya no depende de embeds `volunteer_subscriptions(count)` para la home ni listados.

**Advertencia (scripts viejos):** `scripts/fix_security_v3.sql` define `Public can view subscriptions count` con `SELECT USING (true)`. Si en producción existía sin la migración nueva, **aplicar** `20260429123000` o eliminar esa policy y exponer conteos solo vía la RPC.

Comprobar en producción:

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'volunteer_subscriptions';
```

---

## 7. Storage (buckets `pet-photos`, imágenes de refugio)

### 7.1 Buckets

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;
```

### 7.2 Policies de `storage.objects`

```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
```

**En repo:** migración `20260429140000_storage_pet_photos_policies.sql` (paths `avatars/{uid}/`, `{pet_id}/`, `shelter/{shelter_id}/`, `hero/`). Tras aplicarla, **revisar el Dashboard** y eliminar policies genéricas que permitan INSERT/UPDATE/DELETE en todo el bucket; con RLS, **cualquier policy permisiva suma** y anula el endurecimiento.

**Objetivo:**

- **Lectura:** acorde a si las URLs son públicas (bucket `public = true`).
- **Escritura/borrado:** paths acotados; un usuario no debe poder sobrescribir objetos de otro.

Validar en la UI de Storage que no haya reglas del tipo “cualquier autenticado puede escribir en cualquier path” salvo que sea intencional.

---

## 8. Auth y URLs (Dashboard)

En **Authentication → URL configuration**:

- Site URL y **Redirect URLs** alineados con producción (y preview si aplica).
- Revisar si **email confirmation** está activo para producción.

No guardar **service role** en variables `VITE_*` ni en el repo.

---

## 9. Después de cambios

1. Smoke test: home, listado refugios, detalle mascota, login, perfil, panel refugio, superadmin.
2. Re-ejecutar secciones 2.1–2.3 y guardar diff.
3. Registrar en el ticket/issue qué se ejecutó, quién lo hizo y fecha.

---

## 10. Referencias en el repo

| Archivo | Uso |
|---------|-----|
| `scripts/check-migration-standards.mjs` + `npm run check:db-standards` | Chequeo estático de migraciones (RLS para tablas nuevas en `public`; avisos en policies sensibles). CI: `.github/workflows/db-migration-standards.yml`. |
| `docs/SECURITY_HANDOFF_REPORT.md` | Qué está en repo vs qué aplica el equipo en Supabase |
| `supabase/audit_rls.sql` | Consultas de auditoría iniciales |
| `supabase/migrations/*.sql` | Historial oficial de esquema/RLS (incl. `20260429123000_public_volunteer_stats_rpc.sql`) |
| `scripts/fix_*.sql` | Parches manuales — contrastar con producción antes de re-aplicar |

---

## 11. Plantilla de handoff (completar)

- **Proyecto Supabase (ref / nombre):** _________________  
- **Entorno:** staging / producción  
- **Migraciones aplicadas hasta:** _________________  
- **Hallazgos:** (tablas sin RLS, policies peligrosas, Storage laxo, etc.)  
- **Cambios ejecutados:** (pegar SQL o enlace a migración nueva)  
- **Pendientes:** (p. ej. aplicar migración trigger `profiles` en remoto, limpieza policy pública en `volunteer_subscriptions`)  
- **Validado por:** _________________ **Fecha:** _________________  

---

*Última actualización del runbook alineada al estado del repo (migraciones y scripts existentes). Ajustar si el esquema remoto diverge.*
