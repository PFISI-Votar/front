import type { Control, FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ApiFieldError } from '@/lib/api-client'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { CampoCandidatoDefinicion } from '../data/schema'

type CandidatoCamposDinamicosProps<T extends FieldValues> = {
  control: Control<T>
  campos: CampoCandidatoDefinicion[]
}

const getFieldName = (clave: string): `datosAdicionales.${string}` =>
  `datosAdicionales.${clave}` as `datosAdicionales.${string}`

export const mapApiFieldErrorsToForm = <T extends FieldValues>(
  errors: ApiFieldError[],
  setError: UseFormSetError<T>,
): void => {
  for (const error of errors) {
    setError(`datosAdicionales.${error.clave}` as Path<T>, {
      type: 'server',
      message: error.message,
    })
  }
}

export const CandidatoCamposDinamicos = <T extends FieldValues>({
  control,
  campos,
}: CandidatoCamposDinamicosProps<T>) => {
  const camposOrdenados = [...campos].sort((a, b) => a.orden - b.orden)

  if (camposOrdenados.length === 0) {
    return null
  }

  return (
    <fieldset className='flex flex-col gap-4 rounded-lg border p-4'>
      <legend className='px-1 text-sm font-medium'>Datos adicionales</legend>
      {camposOrdenados.map((campo) => {
        const fieldName = getFieldName(campo.clave)
        const label = campo.obligatorio ? campo.etiqueta : `${campo.etiqueta} (opcional)`

        if (campo.tipo === 'booleano') {
          return (
            <FormField
              key={campo.clave}
              control={control}
              name={fieldName as Path<T>}
              render={({ field }) => (
                <FormItem className='flex flex-row items-start gap-3 space-y-0'>
                  <FormControl>
                    <Checkbox
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      aria-required={campo.obligatorio}
                    />
                  </FormControl>
                  <div className='flex flex-col gap-1'>
                    <FormLabel>{label}</FormLabel>
                    {campo.ayuda && <FormDescription>{campo.ayuda}</FormDescription>}
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          )
        }

        const inputType =
          campo.tipo === 'numero'
            ? 'number'
            : campo.tipo === 'email'
              ? 'email'
              : campo.tipo === 'url'
                ? 'url'
                : campo.tipo === 'fecha'
                  ? 'date'
                  : 'text'

        return (
          <FormField
            key={campo.clave}
            control={control}
            name={fieldName as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input
                    type={inputType}
                    placeholder={campo.ejemplo}
                    required={campo.obligatorio}
                    aria-required={campo.obligatorio}
                    {...field}
                    value={
                      field.value === undefined || field.value === null
                        ? ''
                        : String(field.value)
                    }
                    onChange={(event) => {
                      if (campo.tipo === 'numero') {
                        const raw = event.target.value
                        field.onChange(raw === '' ? '' : Number(raw))
                        return
                      }
                      field.onChange(event.target.value)
                    }}
                  />
                </FormControl>
                {campo.ayuda && <FormDescription>{campo.ayuda}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )
      })}
    </fieldset>
  )
}
