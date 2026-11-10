import { apiClient } from '@/lib/api-client'

const resolveApiBase = (): string => {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
  const configured =
    apiClient.defaults.baseURL || import.meta.env.VITE_API_URL || ''
  // VITE_API_URL puede ser relativa (ej. "/api" detrás del proxy de Vercel).
  return new URL(configured || '/', origin).toString().replace(/\/$/, '')
}

export const resolveMediaUrl = (url?: string | null): string | undefined => {
  if (!url) {
    return undefined
  }

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  // Concatenar en lugar de new URL(url, base): con una ruta absoluta
  // ("/imagenes/1") new URL descartaría el prefijo "/api" de la base.
  const path = url.startsWith('/') ? url : `/${url}`
  return `${resolveApiBase()}${path}`
}
