import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { apiClient } from '@/lib/api-client'
import {
  getCurrentUser,
  refreshSession,
} from '@/features/auth/services/auth-api'
import { ACCESS_REFRESH_INTERVAL_MS } from '@/features/auth/types/auth.types'

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
  refreshTimer = setInterval(() => {
    void handleScheduledRefresh()
  }, ACCESS_REFRESH_INTERVAL_MS)
}

export const clearAccessTokenRefresh = (): void => {
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
      useAuthStore.getState().auth.setSession(response.user)
      scheduleAccessTokenRefresh()
      return true
    } catch {
      useAuthStore.getState().auth.reset()
      return false
    }
  }
}

const handleScheduledRefresh = async (): Promise<void> => {
  try {
    const response = await refreshSession()
    useAuthStore.getState().auth.setSession(response.user)
  } catch {
    clearAccessTokenRefresh()
    useAuthStore.getState().auth.reset()
  }
}
