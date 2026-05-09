/** Etiquetas en español para estados de colecta (valores DB: draft | active | completed). */
export function campaignStatusLabelEs(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'active') return 'Activa'
  if (s === 'completed') return 'Finalizada'
  if (s === 'draft') return 'Por finalizar'
  return status || '—'
}

export function urgencyLabelEs(n) {
  const u = Number(n) || 2
  if (u >= 3) return 'Alta'
  if (u === 2) return 'Media'
  return 'Baja'
}
