import { apiClient } from '@/lib/api-client'

export const resolveMediaUrl = (url?: string | null): string | undefined => {
  if (!url) {
    return undefined
  }

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  const baseUrl =
    apiClient.defaults.baseURL ||
    import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost')

  return new URL(url, baseUrl).toString()
}
