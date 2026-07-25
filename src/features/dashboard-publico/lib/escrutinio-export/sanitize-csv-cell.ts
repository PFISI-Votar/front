const CSV_INJECTION_PREFIXES = /^[=+\-@\t]/u

/**
 * Prevents CSV formula injection when opening files in spreadsheet apps.
 */
export const sanitizeCsvCell = (
  value: string | number | null | undefined
): string => {
  const text = value === null || value === undefined ? '' : String(value)
  if (CSV_INJECTION_PREFIXES.test(text)) {
    return `'${text}`
  }
  return text
}

export const escapeCsvCell = (
  value: string | number | null | undefined
): string => {
  const sanitized = sanitizeCsvCell(value)
  if (/[",\n\r]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`
  }
  return sanitized
}
