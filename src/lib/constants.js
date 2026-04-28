// Fallback constants — overridden at runtime by shelter_config from Supabase
export const DEFAULT_WHATSAPP = '5492346306562'
export const DEFAULT_DONATION_LINK = 'https://cafecito.app/refugiocasa'

export const ADOPTION_STATUSES = [
  { value: 'shelter', label: 'En refugio', iconName: 'Building' },
  { value: 'transit', label: 'En transito', iconName: 'Home' },
  { value: 'urgent', label: 'Urgente', iconName: 'AlertTriangle' },
  { value: 'adopted', label: 'Adoptado', iconName: 'PartyPopper' },
]

export const ADOPTION_STATUS_LABELS = {
  shelter: 'EN REFUGIO',
  transit: 'EN TRANSITO',
  urgent: 'URGENTE',
  adopted: 'ADOPTADO',
}
