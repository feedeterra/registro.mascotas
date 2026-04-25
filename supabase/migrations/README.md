# Migraciones SQL (Supabase)

Estas sentencias no se ejecutan solas con el CLI a menos que configures `supabase link`. Para avanzar rápido:

1. Abrí el proyecto en [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Pegá el contenido de `20260225120000_multi_shelter_foundation.sql` y ejecutá una vez.

Después de correr la migración, revisá **Row Level Security** en `shelters`, `shelter_announcements`, `shelter_events`, `pets` y `profiles` para permitir lectura pública y escritura según rol (`is_admin`, `shelter_id`). El cliente asume que las políticas actuales de `pets` / `profiles` se amplían de forma coherente con tu producto.

## Checklist rápido (producción)

Antes de mergear/deployar a Vercel, ver `DEPLOY_CHECKLIST.md`.
