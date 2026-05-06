import { Helmet } from 'react-helmet-async'

/**
 * Componente para manejar SEO y Meta Tags dinámicos.
 * 
 * @param {string} title - Título de la página
 * @param {string} description - Descripción para buscadores y redes sociales
 * @param {string} image - URL de la imagen para compartir (OpenGraph)
 * @param {string} url - URL canónica de la página
 * @param {string} type - Tipo de contenido (website, article, etc)
 */
function toAbsoluteUrl(href, base) {
  if (!href) return null
  const b = base.replace(/\/$/, '')
  if (/^https?:\/\//i.test(href)) return href
  if (href.startsWith('/')) return b + href
  return `${b}/${href}`
}

export default function SEO({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  jsonLd = null,
}) {
  const siteName = 'Perritos y Refugios'
  const fullTitle = title ? `${title} | ${siteName}` : siteName
  const appUrl = import.meta.env.VITE_APP_URL || 'https://perritosyrefugios.vercel.app'
  const defaultImage = toAbsoluteUrl('/og-default.jpg', appUrl)
  const finalImage = toAbsoluteUrl(image, appUrl) || defaultImage
  const finalUrl = url ? (toAbsoluteUrl(url, appUrl) || url) : window.location.href

  return (
    <Helmet>
      {/* Estándar */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={finalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalImage} />
      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  )
}
