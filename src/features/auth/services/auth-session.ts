import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { apiClient } from '@/lib/api-client'
import {
  clearStoredActivity,
  getLastActivityAt,
  startActivityTracking,
  stopActivityTracking,
} from '@/features/auth/services/activity-tracker'
import {
  getCurrentUser,
  logout,
  refreshSession,
} from '@/features/auth/services/auth-api'
import {
  ACCESS_REFRESH_INTERVAL_MS,
  SESSION_IDLE_TIMEOUT_MS,
} from '@/features/auth/types/auth.types'

let refreshTimer: ReturnType<typeof setInterval> | null = null

const ADMIN_PROBE_URL = '/elecciones'

/**
 * Solicita un endpoint de gestión para que el backend registre ACCESO_DENEGADO
 * cuando el JWT es válido pero el claim role no es election_admin (UAT-02 / US-313).
 *
 * Solo resuelve cuando el backend responde HTTP 403; cualquier otro resultado
 * se re-lanza para no mostrar /403 sin auditoría confirmada.
 */
export const probeAdminAccessDenied = async (): Promise<void> => {
  try {
    await apiClient.get(ADMIN_PROBE_URL)
    const unexpectedSuccess = new Error(
      `Admin access probe to ${ADMIN_PROBE_URL} succeeded without HTTP 403`
    )
    throw unexpectedSuccess
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 403) {
      return
    }
    throw error
  }
}

export const scheduleAccessTokenRefresh = (): void => {
  clearAccessTokenRefresh()
  startActivityTracking()
  refreshTimer = setInterval(() => {
    void handleScheduledRefresh()
  }, ACCESS_REFRESH_INTERVAL_MS)
}

export const clearAccessTokenRefresh = (): void => {
  stopActivityTracking()
  if (!refreshTimer) {
    return
  }
  clearInterval(refreshTimer)
  refreshTimer = null
}

export const ensureValidAccessToken = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    useAuthStore.getState().auth.setSession(user)
    scheduleAccessTokenRefresh()
    return true
  } catch {
    try {
      const response = await refreshSession()
      if (!response.user) {
        useAuthStore.getState().auth.reset()
        return false
      }
      useAuthStore.getState().auth.setSession(response.user)
      scheduleAccessTokenRefresh()
      return true
    } catch {
      useAuthStore.getState().auth.reset()
      return false
    }
  }
}

/**
 * VOTAR-492: el corte de inactividad detectado en el cliente tiene que
 * invalidar la sesión de verdad — no alcanza con vaciar el store, porque
 * `ensureValidAccessToken` (`GET /auth/me`) la rehidrata sola si el access
 * token todavía no expiró. `logout()` revoca la refresh session y limpia las
 * cookies; la marca de actividad se borra para que el próximo login no la
 * herede vencida.
 */
const terminateIdleSession = async (): Promise<void> => {
  clearAccessTokenRefresh()
  clearStoredActivity()
  try {
    await logout()
  } catch {
    // Best-effort: si el logout falla, el reset local de abajo igual saca al
    // usuario de este cliente.
  }
  useAuthStore.getState().auth.reset()
}

const handleScheduledRefresh = async (): Promise<void> => {
  // VOTAR-492: no renovar una sesión ociosa — el backend la caducaría igual.
  if (Date.now() - getLastActivityAt() >= SESSION_IDLE_TIMEOUT_MS) {
    await terminateIdleSession()
    return
  }
  try {
    const response = await refreshSession()
    if (!response.user) {
      clearAccessTokenRefresh()
      useAuthStore.getState().auth.reset()
      return
    }
    useAuthStore.getState().auth.setSession(response.user)
  } catch {
    clearAccessTokenRefresh()
    useAuthStore.getState().auth.reset()
  }
}
