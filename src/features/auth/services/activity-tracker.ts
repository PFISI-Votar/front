/**
 * VOTAR-492 §12.2 — seguimiento de actividad del usuario para el timeout por
 * inactividad. Registra la última interacción real (no los refresh automáticos)
 * en `localStorage`, de modo que varias pestañas comparten el mismo reloj: si
 * una está activa, las demás no expiran.
 */

const STORAGE_KEY = 'votar.lastActivityAt'
const WRITE_THROTTLE_MS = 30 * 1000

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll'] as const

let lastWrite = 0
let tracking = false

const now = (): number => Date.now()

const readStored = (): number => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? Number(raw) : NaN
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

const writeStored = (value: number): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // Modo privado / almacenamiento bloqueado: el tracker degrada a memoria.
  }
}

const handleActivity = (): void => {
  const current = now()
  if (current - lastWrite < WRITE_THROTTLE_MS) {
    return
  }
  lastWrite = current
  writeStored(current)
}

export const startActivityTracking = (): void => {
  if (tracking || typeof window === 'undefined') {
    return
  }
  tracking = true
  const current = now()
  lastWrite = current
  // Siempre pisa la marca al arrancar (nueva sesión o rehidratación de una
  // vigente): si no, tras un idle detectado el próximo login heredaba el
  // timestamp vencido y el refresh de los 14 min podía echar a un usuario
  // activo.
  writeStored(current)
  for (const event of ACTIVITY_EVENTS) {
    window.addEventListener(event, handleActivity, { passive: true })
  }
}

export const stopActivityTracking = (): void => {
  if (!tracking || typeof window === 'undefined') {
    return
  }
  tracking = false
  for (const event of ACTIVITY_EVENTS) {
    window.removeEventListener(event, handleActivity)
  }
}

/** Marca de la última actividad (ms epoch); `Date.now()` si no hay registro. */
export const getLastActivityAt = (): number => {
  const stored = readStored()
  return stored > 0 ? stored : now()
}

/** VOTAR-492: borra la marca al terminar una sesión para no heredarla en la siguiente. */
export const clearStoredActivity = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Modo privado / almacenamiento bloqueado: no hay nada que limpiar.
  }
}
