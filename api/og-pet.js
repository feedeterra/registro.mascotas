import { createClient } from '@supabase/supabase-js'

const APP_URL = process.env.VITE_APP_URL || 'https://perritosyrefugios.vercel.app'
const DEFAULT_IMAGE = `${APP_URL}/og-default.jpg`
const DEFAULT_TITLE = 'Perritos y Refugios | Encontrá tu compañero ideal'
const DEFAULT_DESC = 'Encontrá perritos en adopción, conocé los refugios y ayudá a encontrarles un hogar.'

function sizeLabel(s) {
  return s === 'small' ? 'pequeño' : s === 'medium' ? 'mediano' : s === 'large' ? 'grande' : ''
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
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="es_AR" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="canonical" href="${url}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${image}" />
  <a href="${url}">Ver perrito</a>
</body>
</html>`
}

export default async function handler(req, res) {
  const url = req.url || ''
  const petId = req.query.id || url.match(/\/perro\/([^/?#]+)/)?.[1]

  if (!petId) {
    return res.status(200).setHeader('Content-Type', 'text/html').end(
      buildHtml({ title: DEFAULT_TITLE, description: DEFAULT_DESC, image: DEFAULT_IMAGE, url: APP_URL })
    )
  }

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    )

    const { data: pet } = await supabase
      .from('pets')
      .select('id, name, breed, sex, size, neighborhood, notes, photos, primary_photo_idx')
      .eq('id', petId)
      .single()

    if (!pet) {
      return res.status(200).setHeader('Content-Type', 'text/html').end(
        buildHtml({ title: DEFAULT_TITLE, description: DEFAULT_DESC, image: DEFAULT_IMAGE, url: `${APP_URL}/perro/${petId}` })
      )
    }

    const name = pet.name || (pet.sex === 'female' ? 'Perrita rescatada' : 'Perrito rescatado')
    const breedVal = pet.breed && pet.breed.toUpperCase() !== 'NO' ? pet.breed : ''
    const breed = breedVal ? ` · ${breedVal}` : ''
    const size = pet.size ? ` ${sizeLabel(pet.size)}` : ''
    const zone = pet.neighborhood ? ` en ${pet.neighborhood}` : ''
    const title = `${name}${breed}${size} — en adopción${zone}`
    const description = pet.notes
      ? pet.notes.slice(0, 160).replace(/"/g, '&quot;')
      : `${name} está esperando un hogar. Adoptalo responsablemente a través de nuestra red de refugios.`
    const photos = Array.isArray(pet.photos) ? pet.photos : []
    const image = photos[pet.primary_photo_idx ?? 0] || photos[0] || DEFAULT_IMAGE
    const pageUrl = `${APP_URL}/perro/${pet.id}`

    return res
      .status(200)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
      .end(buildHtml({ title, description, image, url: pageUrl }))

  } catch {
    return res.status(200).setHeader('Content-Type', 'text/html').end(
      buildHtml({ title: DEFAULT_TITLE, description: DEFAULT_DESC, image: DEFAULT_IMAGE, url: `${APP_URL}/perro/${petId}` })
    )
  }
}
