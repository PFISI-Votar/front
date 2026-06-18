export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, '0')
)

export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) =>
  String(minute).padStart(2, '0')
)

export type ParsedDateTime = {
  date: Date | undefined
  hours: string
  minutes: string
}

export const parseDateTimeValue = (value: string): ParsedDateTime => {
  if (!value) {
    return { date: undefined, hours: '09', minutes: '00' }
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return { date: undefined, hours: '09', minutes: '00' }
  }

  return {
    date: new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
    hours: String(parsed.getHours()).padStart(2, '0'),
    minutes: String(parsed.getMinutes()).padStart(2, '0'),
  }
}

export const combineLocalDateTime = (
  date: Date,
  hours: number,
  minutes: number
): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(hours).padStart(2, '0')
  const minute = String(minutes).padStart(2, '0')

  return `${year}-${month}-${day}T${hour}:${minute}`
}

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())
