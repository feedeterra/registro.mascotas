# Checklist de deploy (Supabase + Vercel)

Este repo usa **Supabase** como backend (DB/Auth/Storage) y **Vercel** para deployar el frontend.

## 1) Antes de mergear a `main`

- Confirmar que estás en la branch correcta.
- `npm run check:db-standards` OK (convenciones RLS en migraciones nuevas).
- `npm run build` OK (o `npx vite build`).

## 2) Migraciones (OBLIGATORIO antes de deploy a producción)

Vercel **no ejecuta** migraciones de Supabase. Hay que correrlas en el dashboard de Supabase.

1. Abrir `Supabase Dashboard` → tu proyecto → **SQL Editor**.
2. Ejecutar el contenido de:
   - `supabase/migrations/20260225120000_multi_shelter_foundation.sql`
3. Verificar que existan (Table Editor):
   - `shelters`
   - `shelter_announcements`
   - `shelter_events`
   - columna `profiles.shelter_id`
   - columna `pets.shelter_id`
   - columna `shelter_config.shelter_id`

## 3) RLS (Row Level Security)

Si activás RLS, definí políticas mínimas por tabla:

- **Lectura pública**:
  - `shelters` (solo `is_active = true`)
  - `pets` (si tu app es pública)
- **Staff de refugio** (`profiles.shelter_id`):
  - CRUD en `pets` y `shelter_config` donde `pets.shelter_id = profiles.shelter_id`
  - CRUD en `shelter_announcements` y `shelter_events` donde `shelter_id = profiles.shelter_id`
- **Super-admin** (`profiles.is_admin = true`):
  - CRUD total

> Nota: si RLS está ON y no hay policies, el frontend va a “romper” por permisos denegados.

## 4) Variables de entorno en Vercel

Configurar en Vercel (Project Settings → Environment Variables):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 5) Smoke test post-deploy (manual)

- **Home** carga y muestra carousel de refugios si hay datos.
- **/refugios** lista refugios y pagina; el botón “Usar mi ubicación” no rompe si el usuario niega permisos.
- **/refugio/casa** renderiza (usa fallback legacy si falta config por `shelter_id`).
- **Login**: Google y email.
- **/admin**:
  - super-admin ve tabs completas
  - staff de refugio ve solo “Perritos” y crea con `shelter_id`
- **/mi-refugio** para staff: edita info + anuncios + eventos.

