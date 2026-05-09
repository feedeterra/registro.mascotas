/** Máximo de caracteres por comentario en historias (alineado a la BD). */
export const STORY_COMMENT_MAX_LENGTH = 280

/**
 * Valida el texto antes de enviar (trim, no vacío, longitud).
 * @param {unknown} raw
 * @returns {{ ok: true, value: string } | { ok: false, code: 'empty' | 'too_long' }}
 */
export function validateStoryCommentContent(raw) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return { ok: false, code: 'empty' }
  if (trimmed.length > STORY_COMMENT_MAX_LENGTH) return { ok: false, code: 'too_long' }
  return { ok: true, value: trimmed }
}
