import type { Control } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { CreateComicioInput } from '@/features/eleccion/data/schema'
import { METODOS_AUTENTICACION_OPTIONS } from '@/features/eleccion/configuracion-comicio/data/constants'
import type { MetodoAutenticacionInput } from '@/features/eleccion/configuracion-comicio/data/schema'

type MetodosAutenticacionFieldProps = {
  control: Control<CreateComicioInput>
}

export const MetodosAutenticacionField = ({
  control,
}: MetodosAutenticacionFieldProps) => {
  return (
    <FormField
      control={control}
      name='metodosAutenticacion'
      render={({ field }) => {
        const selected = field.value ?? []

        const handleToggle = (
          metodo: MetodoAutenticacionInput,
          checked: boolean,
        ) => {
          const next = checked
            ? [...selected, metodo]
            : selected.filter((value) => value !== metodo)
          field.onChange(next)
        }

        return (
          <FormItem>
            <FormLabel>Métodos de inicio de sesión</FormLabel>
            <div
              className='space-y-3'
              role='group'
              aria-label='Métodos de inicio de sesión para votantes'
            >
              {METODOS_AUTENTICACION_OPTIONS.map((option) => {
                const isChecked = selected.includes(option.value)
                return (
                  <FormItem
                    key={option.value}
                    className='flex flex-row items-center gap-3 space-y-0'
                  >
                    <FormControl>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleToggle(option.value, checked === true)
                        }
                        aria-label={option.label}
                      />
                    </FormControl>
                    <FormLabel className='font-normal'>{option.label}</FormLabel>
                  </FormItem>
                )
              })}
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
