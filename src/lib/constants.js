// Fallback constants — overridden at runtime by shelter_config from Supabase
export const DEFAULT_WHATSAPP = '5492346306562'
export const DEFAULT_DONATION_LINK = 'https://cafecito.app/refugiocasa'

export const ADOPTION_STATUSES = [
  { value: 'shelter', label: '🏥 En refugio' },
  { value: 'transit', label: '🏠 En transito' },
  { value: 'urgent', label: '🚨 Urgente' },
  { value: 'adopted', label: '🎉 Adoptado' },
]

export const ADOPTION_STATUS_LABELS = {
  shelter: '🏥 EN REFUGIO',
  transit: '🏠 EN TRANSITO',
  urgent: '🚨 URGENTE',
  adopted: '🎉 ADOPTADO',
}
