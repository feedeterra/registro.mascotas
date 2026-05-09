/**
 * Listado de colectas. Con slug de refugio usa la ruta anidada (lista filtrada).
 * @param {string | null | undefined} refugioSlug
 * @returns {string}
 */
export function pathToColectas(refugioSlug) {
  const s = typeof refugioSlug === 'string' ? refugioSlug.trim() : ''
  if (s) return `/refugio/${s}/colectas`
  return '/colectas'
}
