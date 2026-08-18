import { apiClient } from '@/lib/api-client'

const isSafeImageSrc = (url: string): boolean =>
  !url.includes('<') &&
  !url.includes('>') &&
  (url.startsWith('blob:') ||
    url.startsWith('https:') ||
    url.startsWith('http:'))

export const toSafeImageSrc = (url?: string | null): string | undefined => {
  if (!url || !isSafeImageSrc(url)) {
    return undefined
  }

  try {
    const protocol = new URL(url).protocol
    if (protocol === 'https:' || protocol === 'http:' || protocol === 'blob:') {
      return url
    }
  } catch {
    return undefined
  }

  return undefined
}

export const resolveMediaUrl = (url?: string | null): string | undefined => {
  if (!url) {
    return undefined
  }

  if (/^https?:\/\//i.test(url)) {
    return toSafeImageSrc(url)
  }

  const baseUrl =
    apiClient.defaults.baseURL ??
    import.meta.env.VITE_API_URL ??
    window.location.origin

  return toSafeImageSrc(new URL(url, baseUrl).toString())
}
