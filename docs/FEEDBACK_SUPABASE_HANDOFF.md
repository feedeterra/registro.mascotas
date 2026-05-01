# Handoff: feedback en Supabase (compañero)

Este documento resume lo que hay que configurar en **Supabase** para el botón flotante de feedback y el panel **Super Admin → Feedback**.

## 1. Migración SQL

En el repo:

- `supabase/migrations/20260430120000_feedback.sql` — tabla, RLS y RPC iniciales.
- `supabase/migrations/20260430130000_feedback_message_max_500.sql` — si ya aplicaste la anterior con límite 2000, esta ajusta mensaje a **máx. 500 caracteres** y actualiza el RPC (instalaciones nuevas que corran todo el historial también la ejecutan; es idempotente con el estado 500).

Aplicar con **SQL Editor** o `supabase db push` / migraciones del proyecto vinculado.

- Crea la tabla `public.feedback`, RLS (solo **admins** pueden `SELECT` y `UPDATE`), y la función RPC `submit_feedback` ejecutable **solo por `service_role`** (inserción con validación, cooldown 30 días por `anon_id` o `user_id`, y tope por IP hasheada en ventana de 1 hora). Mensaje: entre 10 y **500** caracteres.

## 2. Edge Function `submit-feedback`

Código: `supabase/functions/submit-feedback/index.ts`.

**Secrets / variables** (Dashboard → Edge Functions → Secrets, o CLI):

| Variable | Uso |
|----------|-----|
| `SUPABASE_URL` | URL del proyecto (suele inyectarse al deploy) |
| `SUPABASE_SERVICE_ROLE_KEY` | Cliente admin en la función; **nunca** en el front |
| `FEEDBACK_IP_SALT` | (Recomendado en prod) cadena aleatoria para hashear IP antes de guardar; en local puede faltar (hay fallback de desarrollo) |

**Deploy** (desde la raíz del repo, con CLI logueada):

```bash
supabase functions deploy submit-feedback --no-verify-jwt
```

En el repo hay `supabase/config.toml` con `[functions.submit-feedback] verify_jwt = false` para que acepten llamadas con **anon key** en `Authorization` cuando no hay sesión. Si deployás sin ese archivo, usá `--no-verify-jwt` como arriba o equivalente en Dashboard.

**CORS**: la función responde con `Access-Control-Allow-Origin: *` para POST desde el navegador.

## 3. Front (ya cableado)

- El cliente llama a: `{VITE_SUPABASE_URL}/functions/v1/submit-feedback` con headers `apikey` + `Authorization` (JWT de sesión si hay login, si no el anon key).
- **Usuario logueado**: la Edge Function valida el JWT y rellena `user_id` en `feedback` (referencia `profiles.id`).
- **Anónimo**: solo `anon_id` estable en `localStorage` + metadatos técnicos (`user_agent`, `ip_hash` vía función).

No hace falta exponer `service_role` en `VITE_*`.

## 4. Comportamiento de “quién envió”

| Caso | Qué guardamos |
|------|----------------|
| Sesión activa | `user_id` → en admin se muestra nombre/teléfono de `profiles` si existe |
| Sin sesión | `user_id` null; `anon_id` en texto (no es PII); útil para cooldown y soporte ligero |

## 5. Verificación rápida

1. Aplicar migración.
2. Deploy de la función con secrets correctos.
3. Desde la app: enviar un feedback de prueba.
4. En SQL: `select id, type, message, user_id, anon_id, created_at from public.feedback order by created_at desc limit 5;`
5. Como admin: abrir `/superadmin` → pestaña **Feedback** y cambiar estado / nota interna.

## 6. Errores habituales

- **403 / JWT** en la función: falta `verify_jwt = false` o deploy sin `--no-verify-jwt`.
- **No inserta**: RPC solo con service role; revisar que la función use `SUPABASE_SERVICE_ROLE_KEY` y que el nombre del RPC sea exactamente `submit_feedback`.
- **Admin no ve filas**: RLS exige `profiles.is_admin = true` para el usuario autenticado.
