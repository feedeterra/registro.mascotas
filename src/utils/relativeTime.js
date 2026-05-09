/**
 * Fecha relativa en español (sin dependencias).
 * @param {string | Date} isoOrDate
 */
export function formatRelativeTimeEs(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  if (Number.isNaN(d.getTime())) return ''
  const sec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (sec < 60) return 'hace un momento'
  const min = Math.floor(sec / 60)
  if (min < 60) return min === 1 ? 'hace 1 minuto' : `hace ${min} minutos`
  const h = Math.floor(min / 60)
  if (h < 24) return h === 1 ? 'hace 1 hora' : `hace ${h} horas`
  const days = Math.floor(h / 24)
  if (days < 7) return days === 1 ? 'hace 1 día' : `hace ${days} días`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`
  const months = Math.floor(days / 30)
  if (months < 12) return months === 1 ? 'hace 1 mes' : `hace ${months} meses`
  const years = Math.floor(days / 365)
  return years === 1 ? 'hace 1 año' : `hace ${years} años`
}
