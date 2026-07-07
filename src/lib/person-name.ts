import type { ChangeEvent } from 'react'
import { z } from 'zod'

/** Letras (incluye acentos), espacios, guiones y apóstrofes. */
export const PERSON_NAME_PATTERN =
  /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*[\p{L}\p{M}]$|^[\p{L}\p{M}]$/u

const PERSON_NAME_INPUT_FILTER = /[^\p{L}\p{M}\s'.-]/gu

export const PERSON_NAME_INVALID_CHARS_MESSAGE =
  'Solo se permiten letras, espacios, guiones y apóstrofes.'

export const sanitizePersonNameInput = (value: string) =>
  value.replace(PERSON_NAME_INPUT_FILTER, '').replace(/\s{2,}/g, ' ')

export const personNameSchema = ({
  fieldLabel,
  maxLength = 100,
}: {
  fieldLabel: string
  maxLength?: number
}) =>
  z
    .string()
    .trim()
    .min(1, `${fieldLabel} es obligatorio`)
    .max(maxLength)
    .regex(PERSON_NAME_PATTERN, PERSON_NAME_INVALID_CHARS_MESSAGE)

export const bindPersonNameInput = <
  T extends { value: string; onChange: (value: string) => void },
>(
  field: T
) => ({
  ...field,
  onChange: (event: ChangeEvent<HTMLInputElement>) => {
    field.onChange(sanitizePersonNameInput(event.target.value))
  },
})
