export function normalizeError(err) {
  const rawMessage = (err && (err.message || err.error_description || err.error)) || ''
  const msg = rawMessage.toString()

  // Supabase / PostgREST shapes often include `code`, `status`, `details`, `hint`.
  const status = err?.status || err?.statusCode || err?.response?.status || null
  const code = err?.code || null

  // Permissions (RLS)
  if (
    status === 401 || status === 403 ||
    msg.toLowerCase().includes('permission denied') ||
    msg.toLowerCase().includes('not authorized') ||
    msg.toLowerCase().includes('jwt')
  ) {
    return {
      severity: 'warn',
      code: 'PERMISSION',
      userMessage: 'No tenés permisos para realizar esta acción.',
      debugMessage: msg,
      status,
    }
  }

  // Network-ish
  if (
    msg.toLowerCase().includes('failed to fetch') ||
    msg.toLowerCase().includes('network') ||
    msg.toLowerCase().includes('timeout')
  ) {
    return {
      severity: 'warn',
      code: 'NETWORK',
      userMessage: 'No pudimos conectar. Revisá tu internet e intentá de nuevo.',
      debugMessage: msg,
      status,
    }
  }

  // Common auth messages (Login.jsx already special-cases some)
  if (msg.includes('Invalid login credentials')) {
    return { severity: 'warn', code: 'AUTH', userMessage: 'Email o contraseña incorrectos.', debugMessage: msg, status }
  }
  if (msg.includes('Email not confirmed')) {
    return { severity: 'warn', code: 'AUTH', userMessage: 'Confirmá tu email antes de ingresar.', debugMessage: msg, status }
  }

  // Unique violation (Postgres)
  if (code === '23505' || msg.toLowerCase().includes('duplicate key')) {
    return {
      severity: 'warn',
      code: 'DUPLICATE',
      userMessage: 'Ya existe un registro con esos datos.',
      debugMessage: msg,
      status,
    }
  }

  return {
    severity: 'error',
    code: 'UNKNOWN',
    userMessage: 'Ocurrió un error. Intentá de nuevo.',
    debugMessage: msg || String(err),
    status,
  }
}

