import { apiClient } from '@/lib/api-client'

export const resolveMediaUrl = (url?: string | null): string | undefined => {
  if (!url) {
    return undefined
  }

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  const baseUrl =
    apiClient.defaults.baseURL ??
    import.meta.env.VITE_API_URL ??
    window.location.origin

  return new URL(url, baseUrl).toString()
}
