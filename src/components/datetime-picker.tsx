import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  clampLocalTime,
  combineLocalDateTime,
  HOUR_OPTIONS,
  isHourOptionDisabled,
  isMinuteOptionDisabled,
  MINUTE_OPTIONS,
  parseDateTimeValue,
  startOfDay,
} from '@/lib/datetime'
import { cn } from '@/lib/utils'

type DateTimePickerProps = Omit<React.ComponentProps<'div'>, 'onChange' | 'value'> & {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  minDate?: Date
}

export const DateTimePicker = React.forwardRef<HTMLDivElement, DateTimePickerProps>(
  (
    {
      value,
      onChange,
      onBlur,
      disabled = false,
      minDate,
      className,
      ...props
    },
    ref
  ) => {
  const { date, hours, minutes } = parseDateTimeValue(value)

  const emitChange = React.useCallback(
    (
      nextDate: Date | undefined,
      nextHours: string,
      nextMinutes: string
    ) => {
      if (!nextDate) {
        onChange('')
        return
      }

      const clamped = clampLocalTime(nextDate, nextHours, nextMinutes, minDate)

      onChange(
        combineLocalDateTime(
          nextDate,
          Number(clamped.hours),
          Number(clamped.minutes)
        )
      )
    },
    [minDate, onChange]
  )

  React.useEffect(() => {
    if (!date || !minDate || !value) {
      return
    }

    const clamped = clampLocalTime(date, hours, minutes, minDate)
    if (clamped.hours === hours && clamped.minutes === minutes) {
      return
    }

    emitChange(date, clamped.hours, clamped.minutes)
  }, [date, emitChange, hours, minutes, minDate, value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      emitChange(undefined, hours, minutes)
      return
    }

    emitChange(selectedDate, hours, minutes)
    onBlur?.()
  }

  const handleHoursChange = (nextHours: string) => {
    if (!date) {
      return
    }

    emitChange(date, nextHours, minutes)
    onBlur?.()
  }

  const handleMinutesChange = (nextMinutes: string) => {
    if (!date) {
      return
    }

    emitChange(date, hours, nextMinutes)
    onBlur?.()
  }

  const minDay = minDate ? startOfDay(minDate) : undefined

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-muted/20 p-3 shadow-xs',
        props['aria-invalid'] && 'border-destructive ring-destructive/20',
        className
      )}
      {...props}
    >
      <div className='flex flex-col gap-3'>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='outline'
              disabled={disabled}
              data-empty={!date}
              className={cn(
                'h-10 w-full justify-start font-normal',
                'data-[empty=true]:text-muted-foreground'
              )}
              aria-label='Seleccionar día'
            >
              <CalendarIcon className='me-2 size-4 shrink-0 opacity-70' />
              {date ? (
                <span className='truncate capitalize'>
                  {format(date, "EEEE d 'de' MMMM yyyy", { locale: es })}
                </span>
              ) : (
                <span>Seleccionar día</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='single'
              captionLayout='dropdown'
              selected={date}
              onSelect={handleDateSelect}
              defaultMonth={date ?? minDay ?? new Date()}
              fromYear={new Date().getFullYear()}
              toYear={new Date().getFullYear() + 5}
              disabled={(calendarDate) => {
                if (minDay && startOfDay(calendarDate) < minDay) {
                  return true
                }

                return false
              }}
            />
          </PopoverContent>
        </Popover>

        <div className='flex items-center gap-2'>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-md border bg-background'>
            <Clock className='size-4 text-muted-foreground' aria-hidden />
          </div>

          <Select
            value={hours}
            onValueChange={handleHoursChange}
            disabled={disabled || !date}
          >
            <SelectTrigger
              className='h-10 w-[4.5rem] font-mono tabular-nums'
              aria-label='Hora en formato 24 horas'
            >
              <SelectValue placeholder='HH' />
            </SelectTrigger>
            <SelectContent className='max-h-56'>
              {HOUR_OPTIONS.map((hour) => (
                <SelectItem
                  key={hour}
                  value={hour}
                  disabled={isHourOptionDisabled(hour, date, minDate)}
                  className='font-mono'
                >
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span
            className='text-lg font-semibold text-muted-foreground'
            aria-hidden
          >
            :
          </span>

          <Select
            value={minutes}
            onValueChange={handleMinutesChange}
            disabled={disabled || !date}
          >
            <SelectTrigger
              className='h-10 w-[4.5rem] font-mono tabular-nums'
              aria-label='Minutos'
            >
              <SelectValue placeholder='MM' />
            </SelectTrigger>
            <SelectContent className='max-h-56'>
              {MINUTE_OPTIONS.map((minute) => (
                <SelectItem
                  key={minute}
                  value={minute}
                  disabled={isMinuteOptionDisabled(minute, hours, date, minDate)}
                  className='font-mono'
                >
                  {minute}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className='text-muted-foreground ps-1 text-xs font-medium tracking-wide'>
            hs
          </span>
        </div>
      </div>
    </div>
  )
  }
)

DateTimePicker.displayName = 'DateTimePicker'
