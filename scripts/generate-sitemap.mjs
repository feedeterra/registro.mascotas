/**
 * Regenera public/sitemap.xml con rutas estáticas + una entrada por perro adoptable (slug).
 * Las historias de éxito solo se listan en /historias o /refugio/:slug/historias (sin URL por historia).
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

/** URLs canónicas /refugio/:shelter/perro/:slug si existe columna `pets.slug`; si no, /perro/:id. */
async function fetchPetRowsForSitemap() {
  if (!SUPABASE_URL || !ANON) return []

  async function fetchPaged(queryFn) {
    const rows = []
    const pageSize = 1000
    let offset = 0
    for (;;) {
      const u = queryFn(offset, pageSize)
      const res = await fetch(u.toString(), {
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${ANON}`,
        },
      })
      const txt = await res.text().catch(() => '')
      if (!res.ok) {
        return { ok: false, rows: [], errorText: txt, status: res.status }
      }
      let batch
      try {
        batch = JSON.parse(txt)
      } catch {
        return { ok: false, rows: [], errorText: txt, status: res.status }
      }
      if (!Array.isArray(batch) || batch.length === 0) break
      rows.push(...batch)
      if (batch.length < pageSize) break
      offset += pageSize
    }
    return { ok: true, rows }
  }

  const slugMode = await fetchPaged((offset, pageSize) => {
    const u = new URL(`${SUPABASE_URL}/rest/v1/pets`)
    u.searchParams.set('select', 'id,slug,updated_at,shelters!inner(slug)')
    u.searchParams.set('slug', 'not.is.null')
    u.searchParams.set('adoption_status', 'neq.adopted')
    u.searchParams.set('order', 'updated_at.desc')
    u.searchParams.set('limit', String(pageSize))
    u.searchParams.set('offset', String(offset))
    return u
  })

  if (slugMode.ok) return slugMode.rows

  const err = slugMode.errorText || ''
  if (slugMode.status === 400 && /column pets\.slug|slug does not exist/i.test(err)) {
    console.warn('sitemap: columna pets.slug ausente; usando /perro/:id (aplicá migración pets_slug para URLs canónicas).')
  } else {
    console.warn('sitemap: error al leer pets (slugs)', slugMode.status, err.slice(0, 200))
  }

  const idMode = await fetchPaged((offset, pageSize) => {
    const u = new URL(`${SUPABASE_URL}/rest/v1/pets`)
    u.searchParams.set('select', 'id,updated_at')
    u.searchParams.set('adoption_status', 'neq.adopted')
    u.searchParams.set('order', 'updated_at.desc')
    u.searchParams.set('limit', String(pageSize))
    u.searchParams.set('offset', String(offset))
    return u
  })

  if (!idMode.ok) {
    console.warn('sitemap: error al leer pets (ids)', idMode.status, (idMode.errorText || '').slice(0, 200))
    return []
  }
  return idMode.rows
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

const petRows = await fetchPetRowsForSitemap()
for (const row of petRows) {
  if (!row?.id) continue
  const sh = row?.shelters?.slug
  const ps = row?.slug
  const loc =
    sh && ps ? `${BASE}/refugio/${sh}/perro/${ps}` : `${BASE}/perro/${row.id}`
  const lm = lastmodFromIso(row.updated_at)
  xml += '  <url>\n'
  xml += `    <loc>${esc(loc)}</loc>\n`
  if (lm) xml += `    <lastmod>${esc(lm)}</lastmod>\n`
  xml += `    <changefreq>weekly</changefreq>\n`
  xml += `    <priority>0.75</priority>\n`
  xml += '  </url>\n'
}

xml += '</urlset>\n'

const outFile = path.join(root, 'public', 'sitemap.xml')
writeFileSync(outFile, xml, 'utf8')
console.log(`sitemap: ${outFile} (${STATIC.length} estáticas + ${petRows.length} perros)`)
