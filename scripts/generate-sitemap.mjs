/**
 * Regenera public/sitemap.xml con rutas estáticas + una entrada por fila en success_stories.
 *
 * Requiere en .env o .env.local: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_URL (opcional).
 *
 * Uso: npm run sitemap
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function loadDotEnv() {
  const merged = { ...process.env }
  for (const name of ['.env', '.env.local']) {
    try {
      const raw = readFileSync(path.join(root, name), 'utf8')
      for (const line of raw.split('\n')) {
        const t = line.trim()
        if (!t || t.startsWith('#')) continue
        const i = t.indexOf('=')
        if (i === -1) continue
        const k = t.slice(0, i).trim()
        let v = t.slice(i + 1).trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1)
        }
        if (merged[k] === undefined || merged[k] === '') merged[k] = v
      }
    } catch {
      /* archivo opcional */
    }
  }
  return merged
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function lastmodFromIso(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

const env = loadDotEnv()
const BASE = (env.VITE_APP_URL || 'https://perritosyrefugios.vercel.app').replace(/\/$/, '')
const SUPABASE_URL = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const ANON = env.VITE_SUPABASE_ANON_KEY || ''

const STATIC = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/adoptar', changefreq: 'daily', priority: '0.9' },
  { path: '/refugios', changefreq: 'weekly', priority: '0.8' },
  { path: '/historias', changefreq: 'weekly', priority: '0.7' },
  { path: '/sumarme', changefreq: 'monthly', priority: '0.6' },
  { path: '/sponsors', changefreq: 'monthly', priority: '0.5' },
]

async function fetchPetSlugRows() {
  if (!SUPABASE_URL || !ANON) return []
  const rows = []
  const pageSize = 1000
  let offset = 0
  for (;;) {
    const u = new URL(`${SUPABASE_URL}/rest/v1/pets`)
    u.searchParams.set('select', 'slug,updated_at,shelters!inner(slug)')
    u.searchParams.set('slug', 'not.is.null')
    u.searchParams.set('adoption_status', 'neq.adopted')
    u.searchParams.set('order', 'updated_at.desc')
    u.searchParams.set('limit', String(pageSize))
    u.searchParams.set('offset', String(offset))

    const res = await fetch(u.toString(), {
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${ANON}`,
      },
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.warn('sitemap: error al leer pets (slugs)', res.status, txt.slice(0, 200))
      break
    }
    const batch = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    rows.push(...batch)
    if (batch.length < pageSize) break
    offset += pageSize
  }
  return rows
}

async function fetchStoryRows() {
  if (!SUPABASE_URL || !ANON) {
    console.warn('sitemap: sin VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY; solo rutas estáticas.')
    return []
  }
  const rows = []
  const pageSize = 1000
  let offset = 0
  for (;;) {
    const u = new URL(`${SUPABASE_URL}/rest/v1/success_stories`)
    u.searchParams.set('select', 'id,updated_at')
    u.searchParams.set('order', 'updated_at.desc')
    u.searchParams.set('limit', String(pageSize))
    u.searchParams.set('offset', String(offset))

    const res = await fetch(u.toString(), {
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${ANON}`,
      },
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.warn('sitemap: error al leer success_stories', res.status, txt.slice(0, 200))
      break
    }
    const batch = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    rows.push(...batch)
    if (batch.length < pageSize) break
    offset += pageSize
  }
  return rows
}

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

for (const s of STATIC) {
  xml += '  <url>\n'
  xml += `    <loc>${esc(BASE + s.path)}</loc>\n`
  xml += `    <changefreq>${esc(s.changefreq)}</changefreq>\n`
  xml += `    <priority>${esc(s.priority)}</priority>\n`
  xml += '  </url>\n'
}

const petRows = await fetchPetSlugRows()
for (const row of petRows) {
  const sh = row?.shelters?.slug
  const ps = row?.slug
  if (!sh || !ps) continue
  const loc = `${BASE}/refugio/${sh}/perro/${ps}`
  const lm = lastmodFromIso(row.updated_at)
  xml += '  <url>\n'
  xml += `    <loc>${esc(loc)}</loc>\n`
  if (lm) xml += `    <lastmod>${esc(lm)}</lastmod>\n`
  xml += `    <changefreq>weekly</changefreq>\n`
  xml += `    <priority>0.75</priority>\n`
  xml += '  </url>\n'
}

const stories = await fetchStoryRows()
for (const row of stories) {
  if (!row?.id) continue
  const loc = `${BASE}/historia/${row.id}`
  const lm = lastmodFromIso(row.updated_at)
  xml += '  <url>\n'
  xml += `    <loc>${esc(loc)}</loc>\n`
  if (lm) xml += `    <lastmod>${esc(lm)}</lastmod>\n`
  xml += '    <changefreq>monthly</changefreq>\n'
  xml += '    <priority>0.65</priority>\n'
  xml += '  </url>\n'
}

xml += '</urlset>\n'

const outFile = path.join(root, 'public', 'sitemap.xml')
writeFileSync(outFile, xml, 'utf8')
console.log(`sitemap: ${outFile} (${STATIC.length} estáticas + ${petRows.length} perros + ${stories.length} historias)`)
