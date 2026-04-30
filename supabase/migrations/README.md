# Migraciones SQL (Supabase)

## Estándar en CI y local

Tras agregar o editar archivos en esta carpeta, debe pasar:

```bash
npm run check:db-standards
```

Comprueba que toda **`CREATE TABLE`** en `public` tenga en alguna migración (mismo archivo o posterior) un **`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`**, y avisa patrones peligrosos en `volunteer_subscriptions` / `profiles`. No sustituye una revisión humana ni `supabase db reset` local.

En GitHub, el workflow `.github/workflows/db-migration-standards.yml` corre en PRs que tocan migraciones.

---

Estas sentencias no se ejecutan solas con el CLI a menos que configures `supabase link`. Para avanzar rápido:

1. Abrí el proyecto en [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Pegá el contenido de `20260225120000_multi_shelter_foundation.sql` y ejecutá una vez.

Después de correr la migración, revisá **Row Level Security** en `shelters`, `shelter_announcements`, `shelter_events`, `pets` y `profiles` para permitir lectura pública y escritura según rol (`is_admin`, `shelter_id`). El cliente asume que las políticas actuales de `pets` / `profiles` se amplían de forma coherente con tu producto.

## Checklist rápido (producción)

Antes de mergear/deployar a Vercel, ver `DEPLOY_CHECKLIST.md`.
