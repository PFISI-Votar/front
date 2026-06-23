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
import type { CreateCandidatoInput } from '@/features/eleccion/candidato/data/schema'
import type { CategoriaElectoral } from '@/features/eleccion/categoria/data/schema'

type CandidatoCategoriaFieldProps = {
  control: Control<CreateCandidatoInput>
  categoriasDisponibles: CategoriaElectoral[]
}

export const CandidatoCategoriaField = ({
  control,
  categoriasDisponibles,
}: CandidatoCategoriaFieldProps) => {
  if (categoriasDisponibles.length === 0) {
    return (
      <p className='text-destructive text-sm' role='alert'>
        No hay categorías con cupo disponible en esta lista. Revise los límites
        de postulantes o agregue categorías en la oferta electoral.
      </p>
    )
  }

  return (
    <FormField
      control={control}
      name='idCategoria'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Categoría electoral</FormLabel>
          <Select
            onValueChange={(value) => field.onChange(Number(value))}
            value={field.value ? String(field.value) : undefined}
          >
            <FormControl>
              <SelectTrigger
                className='h-10'
                aria-label='Categoría electoral del candidato'
              >
                <SelectValue placeholder='Seleccione una categoría' />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {categoriasDisponibles.map((categoria) => (
                <SelectItem
                  key={categoria.idCategoria}
                  value={String(categoria.idCategoria)}
                >
                  {categoria.nombre} (mín. {categoria.minimoPostulantes} · máx.{' '}
                  {categoria.maximoPostulantes})
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
