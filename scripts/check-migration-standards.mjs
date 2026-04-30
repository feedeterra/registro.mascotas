#!/usr/bin/env node
/**
 * Estándar de migraciones Supabase (repo compartido):
 * - Cada CREATE TABLE en public debe terminar con ENABLE ROW LEVEL SECURITY
 *   en alguna migración posterior o en la misma (orden por nombre de archivo).
 * - Simula DROP TABLE para no exigir RLS en tablas eliminadas.
 * - Avisa si aparece una policy muy permisiva en tablas sensibles.
 *
 * Uso: node scripts/check-migration-standards.mjs
 *      npm run check:db-standards
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const migrationsDir = path.join(root, 'supabase', 'migrations')

const CREATE_RE =
  /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(/gi
const DROP_RE =
  /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?(\w+)\s*;?/gi
const RLS_RE =
  /ALTER\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY\s*;?/gi

/** Tablas que no deben tener policies SELECT con USING (true) en migraciones nuevas */
const SENSITIVE_TABLES = new Set(['volunteer_subscriptions', 'profiles'])

function stripSqlComments(sql) {
  let s = sql.replace(/\/\*[\s\S]*?\*\//g, '\n')
  return s
    .split('\n')
    .map((line) => {
      const i = line.indexOf('--')
      if (i === -1) return line
      return line.slice(0, i)
    })
    .join('\n')
}

function collectMatches(re, content, type, file) {
  const out = []
  re.lastIndex = 0
  let m
  while ((m = re.exec(content)) !== null) {
    out.push({ type, table: m[1].toLowerCase(), file, index: m.index })
  }
  return out
}

function checkRiskyPolicies(files) {
  const warnings = []
  for (const file of files) {
    const raw = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    const content = stripSqlComments(raw)
    for (const table of SENSITIVE_TABLES) {
      if (!content.toLowerCase().includes(`on public.${table}`)) continue
      // Policy ... ON public.X ... FOR SELECT ... USING (true)
      const block = new RegExp(
        `CREATE\\s+POLICY[\\s\\S]{0,1200}?ON\\s+public\\.${table}[\\s\\S]{0,1200}?USING\\s*\\(\\s*true\\s*\\)`,
        'i',
      )
      if (block.test(content)) {
        warnings.push(
          `${file}: posible SELECT demasiado abierto (USING (true)) en public.${table}`,
        )
      }
    }
  }
  return warnings
}

function main() {
  if (!fs.existsSync(migrationsDir)) {
    console.error('No existe supabase/migrations')
    process.exit(1)
  }

  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const created = new Set()
  const rlsEnabled = new Set()

  for (const file of sqlFiles) {
    const raw = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    const content = stripSqlComments(raw)

    const events = [
      ...collectMatches(CREATE_RE, content, 'create', file),
      ...collectMatches(DROP_RE, content, 'drop', file),
      ...collectMatches(RLS_RE, content, 'rls', file),
    ].sort((a, b) => a.index - b.index)

    for (const e of events) {
      if (e.type === 'create') created.add(e.table)
      if (e.type === 'drop') {
        created.delete(e.table)
        rlsEnabled.delete(e.table)
      }
      if (e.type === 'rls') rlsEnabled.add(e.table)
    }
  }

  const missingRls = [...created].filter((t) => !rlsEnabled.has(t))

  const warnings = checkRiskyPolicies(sqlFiles)

  if (warnings.length) {
    console.warn('\n⚠ Advertencias (revisar manualmente):')
    for (const w of warnings) console.warn(`  - ${w}`)
    console.warn('')
  }

  if (missingRls.length) {
    console.error(
      '✗ Tablas creadas en migraciones sin ENABLE ROW LEVEL SECURITY en el historial:',
    )
    for (const t of missingRls.sort()) console.error(`  - public.${t}`)
    console.error(
      '\nAñadí en una migración: ALTER TABLE public.<tabla> ENABLE ROW LEVEL SECURITY;',
    )
    console.error('y las policies necesarias. Ver docs/SUPABASE_SECURITY_RUNBOOK.md\n')
    process.exit(1)
  }

  console.log(
    `✓ check-migration-standards: ${sqlFiles.length} migraciones, tablas public con RLS: OK`,
  )
  process.exit(0)
}

main()
