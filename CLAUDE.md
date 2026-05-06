# CLAUDE.md — registro-mascotas

## Approach
- Think before acting. Read existing files before writing code.
- Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read unless the file may have changed.
- Test your code before declaring done.
- No sycophantic openers or closing fluff.
- Keep solutions simple and direct.
- User instructions always override this file.

## Project context
- App comunitaria para registro de perros — Capilla del Señor
- Stack: React 18 + Vite 5 + Supabase + react-router-dom v7
- Language: Spanish (UI and variable names may mix Spanish/English)
- Mobile-first layout (max-width 480px)
- No TypeScript — plain JSX only
- No testing framework configured yet

## Architecture
- `src/pages/` — route-level components (Home, PetDetail, Profile, Shelter, Login, Adopt, SuccessStories, Admin, DevSeed)
- `src/components/` — shared UI (Navbar, Footer, PetCard, Welcome, AnnouncementBar, ui/)
- `src/hooks/` — custom hooks (useAuth, usePets, useShelter, useShelterConfig, useShelterPublicConfig for `/refugio/:slug`)
- `src/context/` — AuthContext (Supabase auth)
- `src/lib/supabase.js` — Supabase client singleton
- `src/theme.jsx` — ThemeProvider
- `supabase/migrations/` — SQL idempotente (ejecutar en Dashboard); `profiles.shelter_id` = staff del refugio; `pets.shelter_id` = origen

## UI rules
- No emojis anywhere in the codebase — not in JSX, strings, labels, or comments.
- Use lucide-react icons instead of emojis for visual elements.
- Never hardcode colors — always use theme tokens (`T.accent`, `T.muted`, `T.urgent`, etc.).
- Border radius must use `RS`, `RM`, or `R` from theme, not raw px values.

## Data model — critical rules
- `pets.type = 'stray'` is required for a pet to appear in Adoptá. Without it the pet is invisible.
- `pets.adoption_status = 'shelter'` → tab "En refugio". `'transit'` → tránsito. `'urgent'` → urgente. `'adopted'` → adopted.
- `pets.status = 'found'` for shelter/stray pets.
- `pets.registered_via`: `'organic'` = user-submitted, `'bulk_import'` = script, `'import'` = legacy.
- `pets.tags` stores keys (`playful`, `friendly`, `onlyDog`, `shy`, etc.), never label strings. `PERSONALITY_TRAITS` in `src/utils.js` is the single source of truth for valid keys and their labels/icons.
- `pets.size` valid values: `'small'`, `'medium'`, `'large'` (English keys). `sizeLabel()` in utils.js handles display.
- `pets.sex` valid values: `'male'`, `'female'`, `'unknown'`.
- `shelter_id` for Refugio CASA = `b31e3c43-8eb1-43bc-bcdc-2d22de0eace5`.

## Tag system
- Tags are inferred from `notes` via `inferTraits(pet)` in `src/utils.js` (frontend) and `inferTags(notes)` in import scripts.
- Both functions normalize text (lowercase + strip accents) before matching — always normalize before comparing.
- Tags stored in DB take precedence over inferred tags (see `PetDetail.jsx` lines 134-136).
- Never create custom tag strings — only use keys defined in `PERSONALITY_TRAITS`.

## Panel de gestión
- Route: `/refugio/:slug/gestion` — rendered by `src/pages/MyShelter.jsx` (not Admin.jsx).
- Tab order: Perritos → Anuncios → Eventos → Equipo → Información.
- Default tab on load: `'pets'`.

## Scripts
- `scripts/` contains bulk-import and patch tools that run with `SUPABASE_SERVICE_ROLE_KEY`.
- Never commit `.env.local` or service role keys.
- `import-casa.mjs` — bulk import from CSV + photo folders. Run with `--dry-run` first, `--one` to test a single pet.
- `patch-ages.mjs` / `patch-waiting.mjs` — one-off data patches; keep for re-use if re-import is needed.

## Coding rules
- Use functional components with hooks. No class components.
- Supabase queries go in hooks (`src/hooks/`), not in components.
- Keep components under 150 lines. Extract logic to hooks when growing.
- Use existing patterns: check sibling files before inventing new conventions.
- Do not install new dependencies without asking first.
- Edits over rewrites: use targeted Edit tool, not Write, for existing files.
- When modifying Supabase queries, preserve existing RLS assumptions.

## Response rules
- Default language: Spanish (match the user).
- Skip "Claro", "Por supuesto", "Excelente pregunta" and similar filler.
- Lead with the action or answer, not the reasoning.
- One-line status updates between tool calls, not paragraphs.
- Do not explain what you just did — the diff speaks for itself.
- Do not add comments, docstrings, or type annotations to code you did not change.
- Default response length: ≤3 lines unless the user asks for detail or the task is multi-step.
- No closing summaries, no "next steps" sections, no recap of changes already shown in the diff.
- No bullet lists with 1 item. No headers for responses under 5 lines.
- When asked a yes/no or factual question, answer in 1 line.

## Token discipline
- Read with `offset`/`limit` when the file is large and you know the region.
- Never re-read a file already read in this conversation unless it was edited externally.
- Prefer `grep` (Bash) over reading whole files to locate symbols.
- Batch independent tool calls in a single message — never serialize independent reads.
- Do not run `ls`, `pwd`, `cat`, or `git status` "to confirm" — trust prior output.
- When a tool result is long (logs, git diff), summarize the relevant fragment in your head; do not echo it back to the user.
