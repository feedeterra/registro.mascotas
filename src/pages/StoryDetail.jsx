import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useT, RS } from '../theme'
import { Card, Btn, Skeleton, SponsorZone } from '../components/ui'
import { optimizeImage } from '../utils/images'
import SEO from '../components/SEO'
import { Heart, ChevronRight, BookOpen } from 'lucide-react'
import { fetchSuccessStoryById } from '../services/successStories'

export default function StoryDetail() {
  const { id } = useParams()
  const T = useT()
  const navigate = useNavigate()
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data, error } = await fetchSuccessStoryById(id)
      if (cancelled) return
      if (!error && data) setStory(data)
      else setStory(null)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [id])

  const appBase = (import.meta.env.VITE_APP_URL || 'https://perritosyrefugios.vercel.app').replace(/\/$/, '')
  const canonicalPath = `/historia/${id}`
  const petName = story?.petName || 'Historia'
  const desc =
    (story?.story || '').replace(/\s+/g, ' ').trim().slice(0, 160) ||
    `Historia de adopción de ${petName} en Perritos y Refugios.`
  const shareImage = story?.photoAfter || story?.photoBefore

  const articleLd = story
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${story.petName} — final feliz`,
        description: desc,
        ...(shareImage ? { image: [shareImage] } : {}),
        ...(story.adoptedDate ? { datePublished: story.adoptedDate } : {}),
        mainEntityOfPage: `${appBase}${canonicalPath}`,
        publisher: {
          '@type': 'Organization',
          name: 'Perritos y Refugios',
          url: appBase,
        },
        author: {
          '@type': 'Organization',
          name: story.shelterName || 'Refugio',
        },
      }
    : null

  const seo = (
    <SEO
      title={`${petName} — final feliz`}
      description={desc}
      image={shareImage}
      url={`${appBase}${canonicalPath}`}
      type="article"
      jsonLd={articleLd}
    />
  )

  if (loading) {
    return (
      <div style={{ padding: 20, paddingTop: 40 }}>
        {seo}
        <Skeleton width="50%" height={22} style={{ marginBottom: 16 }} />
        <Skeleton height={220} radius={RS} style={{ marginBottom: 16 }} />
        <Skeleton height={80} />
      </div>
    )
  }

  if (!story) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        {seo}
        <p style={{ color: T.muted, fontWeight: 600 }}>No encontramos esta historia.</p>
        <Btn onClick={() => navigate('/historias')} style={{ marginTop: 16 }}>Ver historias</Btn>
      </div>
    )
  }

  const refugioLink = story.shelterSlug ? `/refugio/${story.shelterSlug}` : '/refugios'

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {seo}

      <button
        type="button"
        className="btn-press"
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none', color: T.muted,
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          marginBottom: 16, padding: 0,
        }}
      >
        <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Volver
      </button>

      <Card style={{ overflow: 'hidden', padding: 0, marginBottom: 20 }}>
        {story.photoAfter && (
          <div style={{ width: '100%', aspectRatio: '4/3', background: T.accentLt }}>
            <img
              src={optimizeImage(story.photoAfter, { width: 900 })}
              alt={petName}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                objectPosition: story.adoptedPhotoPosition || '50% 50%',
                display: 'block',
              }}
            />
          </div>
        )}
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: T.txt, margin: 0, letterSpacing: -0.5 }}>
              {petName}
            </h1>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase' }}>Refugio</div>
              <Link to={refugioLink} style={{ fontSize: 14, fontWeight: 800, color: T.accent, textDecoration: 'none' }}>
                {story.shelterName || 'Ver refugio'}
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: T.ok, fontWeight: 700, fontSize: 14 }}>
            <Heart size={18} fill="currentColor" /> Adoptado/a
          </div>

          {story.story && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={14} style={{ color: T.accent }} /> Historia
              </div>
              <p style={{ fontSize: 15, color: T.txt, lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>
                {story.story}
              </p>
            </div>
          )}

          {(story.adopterName || story.quote) && (
            <div style={{ marginTop: 16, padding: 14, borderRadius: RS, background: T.bg, border: `1px solid ${T.borderLt}` }}>
              {story.adopterName && (
                <div style={{ fontSize: 13, fontWeight: 800, color: T.txt }}>{story.adopterName}</div>
              )}
              {story.quote && (
                <div style={{ fontSize: 14, color: T.muted, marginTop: 6, fontStyle: 'italic' }}>“{story.quote}”</div>
              )}
            </div>
          )}
        </div>
      </Card>

      <SponsorZone tier="premium" />
    </div>
  )
}
