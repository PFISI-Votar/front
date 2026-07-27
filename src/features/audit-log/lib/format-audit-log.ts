/** Trunca un hash para visualización sin exponer PII. */
export const truncateHash = (value: string | null | undefined): string => {
  if (value == null || value.length === 0) {
    return '—'
  }
  if (value.length <= 16) {
    return value
  }
  return `${value.slice(0, 8)}…${value.slice(-8)}`
}

/** Trunca texto descriptivo para la tabla. */
export const truncateText = (
  value: string | null | undefined,
  maxLength = 80
): string => {
  if (value == null || value.length === 0) {
    return '—'
  }
  if (value.length <= maxLength) {
    return value
  }
  return `${value.slice(0, maxLength)}…`
}
