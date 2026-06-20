import type { Control } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CreateComicioInput } from '@/features/eleccion/data/schema'
import { TIPO_VOTACION_OPTIONS } from '@/features/eleccion/lista/data/schema'

type CreateComicioTipoVotacionFieldProps = {
  control: Control<CreateComicioInput>
}

export const CreateComicioTipoVotacionField = ({
  control,
}: CreateComicioTipoVotacionFieldProps) => {
  return (
    <FormField
      control={control}
      name='tipoVotacion'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tipo de votación</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className='h-10' aria-label='Tipo de votación'>
                <SelectValue placeholder='Seleccione la modalidad' />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {TIPO_VOTACION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
