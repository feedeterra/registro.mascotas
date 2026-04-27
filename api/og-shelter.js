import { createClient } from '@supabase/supabase-js'

const APP_URL = process.env.VITE_APP_URL || 'https://registro-mascotas.vercel.app'
const DEFAULT_IMAGE = `${APP_URL}/og-default.jpg`
const DEFAULT_TITLE = 'Perritos y Refugios | Encontrá tu compañero ideal'
const DEFAULT_DESC = 'Encontrá perritos en adopción, conocé los refugios y ayudá a encontrarles un hogar.'

function isCrawler(ua = '') {
  return /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|googlebot|bingbot|applebot/i.test(ua)
}

function buildHtml({ title, description, image, url }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="es_AR" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="canonical" href="${url}" />
  <meta http-equiv="refresh" content="0;url=${url}" />
</head>
<body>
  <a href="${url}">Ver ${title}</a>
</body>
</html>`
}

export default async function handler(req, res) {
  const ua = req.headers['user-agent'] || ''
  const url = req.url || ''

  // Extract slug from /refugio/:slug (ignores sub-paths like /refugio/:slug/adoptar)
  const match = url.match(/\/refugio\/([^/?#/]+)/)
  const slug = match?.[1]

  if (!slug) {
    res.setHeader('Location', `${APP_URL}/refugios`)
    return res.status(302).end()
  }

  if (!isCrawler(ua)) {
    res.setHeader('Location', `${APP_URL}/refugio/${slug}`)
    return res.status(302).end()
  }

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    )

    const { data: shelter } = await supabase
      .from('shelters')
      .select('id, name, city, slug, shelter_config(shelter_image_url, province, description, pets(count))')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (!shelter) {
      return res.status(200).setHeader('Content-Type', 'text/html').end(
        buildHtml({ title: DEFAULT_TITLE, description: DEFAULT_DESC, image: DEFAULT_IMAGE, url: `${APP_URL}/refugios` })
      )
    }

    const config = shelter.shelter_config
    const location = [shelter.city, config?.province].filter(Boolean).join(', ')
    const petCount = config?.pets?.[0]?.count ?? 0

    const title = `${shelter.name} — Refugio en ${location || 'Argentina'}`
    const description = config?.description
      ? config.description.slice(0, 160).replace(/"/g, '&quot;')
      : `${shelter.name} tiene ${petCount} perrito${petCount !== 1 ? 's' : ''} esperando un hogar en ${location || 'Argentina'}. Adoptá, apadriná o hacete voluntario.`
    const image = config?.shelter_image_url || DEFAULT_IMAGE
    const pageUrl = `${APP_URL}/refugio/${shelter.slug}`

    return res
      .status(200)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
      .end(buildHtml({ title, description, image, url: pageUrl }))

  } catch {
    return res.status(200).setHeader('Content-Type', 'text/html').end(
      buildHtml({ title: DEFAULT_TITLE, description: DEFAULT_DESC, image: DEFAULT_IMAGE, url: `${APP_URL}/refugio/${slug}` })
    )
  }
}
