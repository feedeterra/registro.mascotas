import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, HandCoins } from 'lucide-react'
import { useT, RS } from '../../theme'
import { Card } from '../ui'
import { DonationModal } from '../ui/DonationModal'
import { supabase } from '../../lib/supabase'
import { campaignStatusLabelEs } from '../../utils/campaigns'

function urgencyBadge(n) {
  if (n >= 3) return { text: 'Urgente', bg: 'rgba(255,255,255,0.18)' }
  if (n === 2) return { text: 'Prioridad media', bg: 'rgba(255,255,255,0.16)' }
  return { text: 'Prioridad baja', bg: 'rgba(255,255,255,0.14)' }
}

function firstPhotoFromPet(petRow) {
  const raw = petRow?.photos
  if (Array.isArray(raw) && raw.length) return raw[0]
  if (typeof raw === 'string') {
    try {
      const arr = JSON.parse(raw || '[]')
      if (Array.isArray(arr) && arr.length) return arr[0]
    } catch {}
  }
  return null
}

export default function CampaignCard({
  campaign,
  shelterSlug,
  shelterName,
  shelterAccounts = [],
  compact = false,
  micro = false,
}) {
  const T = useT()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState([])

  const u = urgencyBadge(Number(campaign?.urgency) || 2)
  const statusLabel = campaignStatusLabelEs(campaign?.status)

  const imageUrl = useMemo(() => {
    if (campaign?.image_mode === 'pet') return firstPhotoFromPet(campaign?.pets)
    return campaign?.image_url || null
  }, [campaign?.image_mode, campaign?.image_url, campaign?.pets])

  const title = campaign?.title || 'Colecta'
  const desc = campaign?.description || ''

  const resolvedShelterSlug =
    shelterSlug ||
    (campaign?.shelters && !Array.isArray(campaign.shelters) ? campaign.shelters.slug : campaign?.shelters?.[0]?.slug) ||
    null
  const resolvedShelterName =
    shelterName ||
    (campaign?.shelters && !Array.isArray(campaign.shelters) ? campaign.shelters.name : campaign?.shelters?.[0]?.name) ||
    'Refugio'

  const openDonate = async () => {
    setOpen(true)
    const override = Array.isArray(campaign?.transfer_accounts_override) ? campaign.transfer_accounts_override : null
    const useShelter = campaign?.use_shelter_accounts !== false
    if (!useShelter && override?.length) {
      setAccounts(override)
      return
    }
    if (shelterAccounts?.length) {
      setAccounts(shelterAccounts)
      return
    }

    if (!resolvedShelterSlug) return
    setLoading(true)
    try {
      const { data: sh } = await supabase
        .from('shelters')
        .select('id, name')
        .eq('slug', resolvedShelterSlug)
        .maybeSingle()
      if (sh?.id) {
        const { data } = await supabase
          .from('shelter_config')
          .select('transfer_accounts')
          .eq('shelter_id', sh.id)
          .maybeSingle()
        const acc = Array.isArray(data?.transfer_accounts) ? data.transfer_accounts : []
        setAccounts(acc)
      }
    } finally {
      setLoading(false)
    }
  }

  const aspectRatio = micro ? '4/3' : compact ? '16/9' : '4/3'
  const titleSize = micro ? 14 : compact ? 16 : 18
  const pad = micro ? '10px 12px' : '14px 16px'
  const badgePad = micro ? '4px 8px' : '5px 10px'
  const badgeFs = micro ? 10 : 11

  const badge = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: micro ? 4 : 6,
        padding: badgePad,
        borderRadius: 999,
        background: u.bg,
        color: '#fff',
        fontSize: badgeFs,
        fontWeight: 900,
        border: '1px solid rgba(255,255,255,0.22)',
        width: 'fit-content',
      }}
    >
      <AlertTriangle size={micro ? 12 : 14} aria-hidden /> {u.text}
    </span>
  )

  return (
    <>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ position: 'relative', aspectRatio, background: T.accentLt, minHeight: micro ? 132 : undefined }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition:
                  campaign?.image_position ||
                  (micro && campaign?.image_mode === 'pet' ? '50% 38%' : '50% 50%'),
              }}
            />
          ) : null}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)',
            }}
          />
          <div style={{ position: 'absolute', top: micro ? 6 : 10, left: micro ? 8 : 10 }}>{badge}</div>
          <div style={{ position: 'absolute', bottom: micro ? 6 : 10, left: micro ? 10 : 12, right: micro ? 10 : 12, color: '#fff' }}>
            <div style={{ fontSize: titleSize, fontWeight: 900, lineHeight: 1.15, marginBottom: 2 }}>
              {title}
            </div>
            <div style={{ fontSize: micro ? 11 : 12, opacity: 0.92, fontWeight: 700 }}>
              {resolvedShelterName}
            </div>
          </div>
        </div>
        <div style={{ padding: pad }}>
          <p
            style={{
              margin: 0,
              color: T.txt,
              fontSize: micro ? 12 : 13,
              lineHeight: 1.45,
              display: micro ? '-webkit-box' : 'block',
              WebkitLineClamp: micro ? 2 : undefined,
              WebkitBoxOrient: micro ? 'vertical' : undefined,
              overflow: micro ? 'hidden' : undefined,
            }}
          >
            {desc}
          </p>
          <div style={{ display: 'flex', gap: micro ? 6 : 10, marginTop: micro ? 8 : 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {resolvedShelterSlug && (
              <Link
                to={`/refugio/${resolvedShelterSlug}`}
                className="btn-press"
                style={{
                  textDecoration: 'none',
                  padding: micro ? '7px 10px' : '10px 12px',
                  borderRadius: RS,
                  border: `1.5px solid ${T.borderLt}`,
                  background: T.bg,
                  color: T.txt,
                  fontWeight: 800,
                  fontSize: micro ? 11 : 12,
                }}
              >
                Ver refugio →
              </Link>
            )}
            <button
              type="button"
              className="btn-press"
              onClick={openDonate}
              style={{
                marginLeft: 'auto',
                padding: micro ? '7px 10px' : '10px 12px',
                borderRadius: RS,
                border: 'none',
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                color: '#fff',
                fontWeight: 900,
                fontSize: micro ? 11 : 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: micro ? 6 : 8,
              }}
            >
              <HandCoins size={micro ? 14 : 16} aria-hidden /> Donar
            </button>
          </div>
          <div style={{ marginTop: micro ? 6 : 10, fontSize: micro ? 10 : 11, color: T.muted, fontWeight: 600 }}>
            Estado: <strong style={{ color: T.txt }}>{statusLabel}</strong>
          </div>
        </div>
      </Card>

      <DonationModal
        isOpen={open}
        onClose={() => setOpen(false)}
        accounts={accounts}
        shelterName={resolvedShelterName}
        loading={loading}
        title={`Donar a: ${title}`}
        message={`Tu aporte ayuda a esta colecta de ${resolvedShelterName}.`}
      />
    </>
  )
}
