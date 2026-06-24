import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { AuthResponse } from '@/features/auth/types/auth.types'
import { useAuthStore } from '@/stores/auth-store'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let refreshQueue: Array<{
  resolve: () => void
  reject: (error: unknown) => void
}> = []

const processRefreshQueue = (error: unknown): void => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
      return
    }
    resolve()
  })
  refreshQueue = []
}

export const refreshAccessToken = async (): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/refresh')
  useAuthStore.getState().auth.setSession(data.user)
  return data
}

const isAuthEndpoint = (url: string): boolean =>
  url.includes('/auth/login') ||
  url.includes('/auth/refresh') ||
  url.includes('/auth/logout') ||
  url.includes('/auth/me')

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    const requestUrl = originalRequest.url ?? ''
    if (isAuthEndpoint(requestUrl)) {
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then(() => apiClient(originalRequest))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      await refreshAccessToken()
      processRefreshQueue(null)
      return apiClient(originalRequest)
    } catch (refreshError) {
      processRefreshQueue(refreshError)
      useAuthStore.getState().auth.reset()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export const isConflictError = (error: unknown): error is AxiosError => {
  return error instanceof AxiosError && error.response?.status === 409
}

export const isValidationError = (error: unknown): error is AxiosError => {
  const status = error instanceof AxiosError ? error.response?.status : 0
  return status === 422 || status === 400
}

export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined
    if (Array.isArray(data?.message)) {
      return data.message.join(', ')
    }
    if (typeof data?.message === 'string') {
      return data.message
    }
  }
  return 'Ocurrió un error inesperado'
}

export type ApiFieldError = {
  clave: string
  message: string
}

export type ApiStructuredFieldError = {
  field: string
  message: string
}

export type ApiRulesViolation = {
  idLista: number
  nombreLista: string
  siglaLista: string
  idCategoria: number
  nombreCategoria: string
  minimoRequerido: number
  cantidadActual: number
  faltantes: number
  message: string
}

export const getApiFieldErrors = (error: unknown): ApiFieldError[] => {
  if (!(error instanceof AxiosError)) {
    return []
  }
  const data = error.response?.data as { errors?: ApiFieldError[] } | undefined
  if (!Array.isArray(data?.errors)) {
    return []
  }
  return data.errors
}

export const getApiStructuredFieldErrors = (
  error: unknown,
): ApiStructuredFieldError[] => {
  if (!(error instanceof AxiosError)) {
    return []
  }
  const data = error.response?.data as {
    errors?: Array<{ field?: string; message?: string }>
  } | undefined
  if (!Array.isArray(data?.errors)) {
    return []
  }
  return data.errors
    .filter((item) => item.field && item.message)
    .map((item) => ({
      field: item.field as string,
      message: item.message as string,
    }))
}

export const getApiRulesViolations = (error: unknown): ApiRulesViolation[] => {
  if (!(error instanceof AxiosError)) {
    return []
  }
  const data = error.response?.data as
    | { violations?: ApiRulesViolation[] }
    | undefined
  if (!Array.isArray(data?.violations)) {
    return []
  }
  return data.violations
}
