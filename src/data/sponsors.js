// Mock sponsors for prototype
// Replace with real data from Supabase when ready

export const SPONSORS = [
  {
    id: 'sp-1',
    name: 'Veterinaria San Roque',
    tier: 'gold',
    logoUrl: null,
    tagline: 'Cuidamos a los perritos del refugio',
    websiteUrl: null,
    bannerImageUrl: null,
  },
  {
    id: 'sp-2',
    name: 'Forrajeria El Campo',
    tier: 'silver',
    logoUrl: null,
    tagline: 'Alimento de calidad para todas las mascotas',
    websiteUrl: null,
  },
  {
    id: 'sp-3',
    name: 'Pet Shop Capilla',
    tier: 'standard',
    logoUrl: null,
    tagline: 'Todo para tu mascota',
    websiteUrl: null,
  },
]

export function getSponsorsByTier(tier) {
  return SPONSORS.filter(s => s.tier === tier)
}
