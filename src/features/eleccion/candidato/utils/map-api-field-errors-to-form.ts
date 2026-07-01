import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ApiFieldError } from '@/lib/api-client'

export const mapApiFieldErrorsToForm = <T extends FieldValues>(
  errors: ApiFieldError[],
  setError: UseFormSetError<T>
): void => {
  for (const error of errors) {
    setError(`datosAdicionales.${error.clave}` as Path<T>, {
      type: 'server',
      message: error.message,
    })
  }
}
