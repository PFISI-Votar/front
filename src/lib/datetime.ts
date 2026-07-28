/** Locale used when displaying datetimes to users. Wire format is always UTC ISO. */
export const DATETIME_DISPLAY_LOCALE = 'es-AR'

export const DATETIME_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: 'short',
  timeStyle: 'short',
}

/** 24-hour clock for institutional views (audit log, official timestamps). */
export const DATETIME_DISPLAY_24H_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
}

const UTC_ISO8601_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/i

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

export const isUtcIsoDateTime = (value: string): boolean => {
  const trimmed = value.trim()
  if (!UTC_ISO8601_PATTERN.test(trimmed)) {
    return false
  }

  return !Number.isNaN(new Date(trimmed).getTime())
}

export const parseUtcDateTime = (value: string): Date | undefined => {
  if (!isUtcIsoDateTime(value)) {
    return undefined
  }

  return new Date(value.trim())
}

export const formatDateTimeForDisplay = (
  isoUtc: string,
  locale: string = DATETIME_DISPLAY_LOCALE,
  options: Intl.DateTimeFormatOptions = DATETIME_DISPLAY_OPTIONS
): string => {
  const date = new Date(isoUtc)
  if (Number.isNaN(date.getTime())) {
    return isoUtc
  }

  return new Intl.DateTimeFormat(locale, options).format(date)
}

export const formatDateTime24ForDisplay = (
  isoUtc: string,
  locale: string = DATETIME_DISPLAY_LOCALE
): string =>
  formatDateTimeForDisplay(isoUtc, locale, DATETIME_DISPLAY_24H_OPTIONS)

export const parseDateTimeValue = (value: string): ParsedDateTime => {
  if (!value) {
    return { date: undefined, hours: '09', minutes: '00' }
  }

  const parsed = parseUtcDateTime(value)
  if (!parsed) {
    return { date: undefined, hours: '09', minutes: '00' }
  }

  return {
    date: new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
    hours: String(parsed.getHours()).padStart(2, '0'),
    minutes: String(parsed.getMinutes()).padStart(2, '0'),
  }
}

/** Combines local calendar/time picker values and returns an ISO 8601 UTC string. */
export const combineLocalDateTime = (
  date: Date,
  hours: number,
  minutes: number
): string => {
  const local = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0
  )

  return local.toISOString()
}

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const isSameLocalDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

/** First selectable minute strictly after minInstant on the same local day. */
export const getMinLocalTimeForDay = (
  selectedDay: Date,
  minInstant?: Date
): { hours: number; minutes: number } | null => {
  if (!minInstant || !isSameLocalDay(selectedDay, minInstant)) {
    return null
  }

  const nextMinute = new Date(minInstant)
  nextMinute.setSeconds(0, 0)
  nextMinute.setMinutes(nextMinute.getMinutes() + 1)

  if (!isSameLocalDay(selectedDay, nextMinute)) {
    return { hours: 24, minutes: 0 }
  }

  return {
    hours: nextMinute.getHours(),
    minutes: nextMinute.getMinutes(),
  }
}

export const clampLocalTime = (
  selectedDay: Date,
  hours: string,
  minutes: string,
  minInstant?: Date
): { hours: string; minutes: string } => {
  const minTime = getMinLocalTimeForDay(selectedDay, minInstant)
  if (!minTime || minTime.hours >= 24) {
    return { hours, minutes }
  }

  const hourNum = Number(hours)
  const minuteNum = Number(minutes)

  if (
    hourNum > minTime.hours ||
    (hourNum === minTime.hours && minuteNum >= minTime.minutes)
  ) {
    return { hours, minutes }
  }

  return {
    hours: String(minTime.hours).padStart(2, '0'),
    minutes: String(minTime.minutes).padStart(2, '0'),
  }
}

export const isHourOptionDisabled = (
  hour: string,
  selectedDay: Date | undefined,
  minInstant?: Date
): boolean => {
  if (!selectedDay || !minInstant) {
    return false
  }

  const minTime = getMinLocalTimeForDay(selectedDay, minInstant)
  if (!minTime) {
    return false
  }

  if (minTime.hours >= 24) {
    return true
  }

  return Number(hour) < minTime.hours
}

export const isMinuteOptionDisabled = (
  minute: string,
  hour: string,
  selectedDay: Date | undefined,
  minInstant?: Date
): boolean => {
  if (!selectedDay || !minInstant) {
    return false
  }

  const minTime = getMinLocalTimeForDay(selectedDay, minInstant)
  if (!minTime) {
    return false
  }

  if (minTime.hours >= 24) {
    return true
  }

  const hourNum = Number(hour)
  if (hourNum > minTime.hours) {
    return false
  }

  if (hourNum < minTime.hours) {
    return true
  }

  return Number(minute) < minTime.minutes
}
