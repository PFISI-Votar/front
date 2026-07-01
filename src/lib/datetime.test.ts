/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import {
  clampLocalTime,
  combineLocalDateTime,
  formatDateTimeForDisplay,
  getMinLocalTimeForDay,
  isHourOptionDisabled,
  isMinuteOptionDisabled,
  isUtcIsoDateTime,
  parseDateTimeValue,
  parseUtcDateTime,
} from './datetime'

describe('datetime utilities', () => {
  it('accepts ISO 8601 strings with explicit UTC offset', () => {
    expect(isUtcIsoDateTime('2026-06-20T17:30:00.000Z')).toBe(true)
    expect(isUtcIsoDateTime('2026-06-20T14:30:00-03:00')).toBe(true)
  })

  it('rejects timezone-less datetime strings', () => {
    expect(isUtcIsoDateTime('2026-06-20T14:30')).toBe(false)
  })

  it('converts local picker values to UTC ISO', () => {
    const localDate = new Date(2026, 5, 20)
    const isoUtc = combineLocalDateTime(localDate, 14, 30)

    expect(isoUtc).toMatch(/Z$/)
    expect(parseUtcDateTime(isoUtc)?.toISOString()).toBe(isoUtc)
  })

  it('round-trips local picker values through UTC ISO', () => {
    const localDate = new Date(2026, 5, 20)
    const isoUtc = combineLocalDateTime(localDate, 14, 30)
    const parsed = parseDateTimeValue(isoUtc)

    expect(parsed.hours).toBe('14')
    expect(parsed.minutes).toBe('30')
    expect(parsed.date?.getFullYear()).toBe(2026)
    expect(parsed.date?.getMonth()).toBe(5)
    expect(parsed.date?.getDate()).toBe(20)
  })

  it('formats UTC ISO values for display in es-AR', () => {
    const formatted = formatDateTimeForDisplay('2026-06-20T17:30:00.000Z')

    expect(formatted).toMatch(/20\/6\/26/)
    expect(formatted.length).toBeGreaterThan(0)
  })

  it('requires the next minute when the selected day matches minDate', () => {
    const selectedDay = new Date(2026, 5, 20)
    const minInstant = new Date(2026, 5, 20, 15, 0, 0)

    expect(getMinLocalTimeForDay(selectedDay, minInstant)).toEqual({
      hours: 15,
      minutes: 1,
    })
  })

  it('disables past hours and minutes on the minimum day', () => {
    const selectedDay = new Date(2026, 5, 20)
    const minInstant = new Date(2026, 5, 20, 15, 30, 0)

    expect(isHourOptionDisabled('14', selectedDay, minInstant)).toBe(true)
    expect(isHourOptionDisabled('15', selectedDay, minInstant)).toBe(false)
    expect(isMinuteOptionDisabled('29', '15', selectedDay, minInstant)).toBe(
      true
    )
    expect(isMinuteOptionDisabled('30', '15', selectedDay, minInstant)).toBe(
      true
    )
    expect(isMinuteOptionDisabled('31', '15', selectedDay, minInstant)).toBe(
      false
    )
  })

  it('clamps invalid times to the first allowed minute', () => {
    const selectedDay = new Date(2026, 5, 20)
    const minInstant = new Date(2026, 5, 20, 15, 0, 0)

    expect(clampLocalTime(selectedDay, '09', '00', minInstant)).toEqual({
      hours: '15',
      minutes: '01',
    })
  })
})
