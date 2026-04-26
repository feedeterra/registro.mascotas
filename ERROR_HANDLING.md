# Convención de manejo de errores

Objetivo: **la app no se rompe** y el usuario recibe feedback consistente.

## Capas

- **Global**:
  - `ErrorBoundary` para errores de render (evita pantalla blanca).
  - `ToastProvider` + `notifyError()` para notificaciones consistentes.
  - Listener de `unhandledrejection` (errores async no capturados) → toast.

- **Pantallas / UI**:
  - Mostrar **toast** cuando el error ocurre como resultado de una **acción explícita** del usuario (click “Guardar”, “Eliminar”, “Importar”, etc.).
  - Mostrar **estado inline** (banner en pantalla / empty state) para errores de **carga inicial** o **autosave**.

## Regla práctica

- **Acción del usuario** → `toast.notifyError(err)` (y opcionalmente `setError(...)` si querés persistir el contexto en pantalla).
- **Background / autosave / fetch inicial** → `setError(...)` + UI state, **sin toast** para evitar spam.

## Normalización

Usar `normalizeError()` (`src/lib/errors.js`) para mapear errores típicos (RLS/permisos, red, auth, duplicados) a mensajes humanos.

