import type { Control } from 'react-hook-form'
import { useEffect } from 'react'
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
import type { RolCandidato } from '@/features/eleccion/data/schema'

type CandidatoRolFieldProps = {
  control: Control<CreateCandidatoInput>
  rolesDisponibles: RolCandidato[]
  setValue: (name: 'idCategoria', value: number) => void
}

export const CandidatoRolField = ({
  control,
  rolesDisponibles,
  setValue,
}: CandidatoRolFieldProps) => {
  const singleRole =
    rolesDisponibles.length === 1 ? rolesDisponibles[0] : null

  useEffect(() => {
    if (singleRole) {
      setValue('idCategoria', singleRole.idCategoria)
    }
  }, [singleRole, setValue])

  if (rolesDisponibles.length === 0) {
    return (
      <p className='text-destructive text-sm' role='alert'>
        Todos los roles de este comicio ya alcanzaron su cupo máximo en esta
        lista.
      </p>
    )
  }

  if (singleRole) {
    return (
      <FormItem>
        <FormLabel>Rol en la lista</FormLabel>
        <p className='text-sm font-medium' aria-live='polite'>
          {singleRole.nombre}
        </p>
        <p className='text-muted-foreground text-xs'>
          Máximo {singleRole.maximoPostulantes} postulante(s) para este rol
        </p>
      </FormItem>
    )
  }

  return (
    <FormField
      control={control}
      name='idCategoria'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Rol en la lista</FormLabel>
          <Select
            onValueChange={(value) => field.onChange(Number(value))}
            value={field.value ? String(field.value) : undefined}
          >
            <FormControl>
              <SelectTrigger className='h-10' aria-label='Rol del candidato'>
                <SelectValue placeholder='Seleccione un rol' />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {rolesDisponibles.map((rol) => (
                <SelectItem key={rol.idCategoria} value={String(rol.idCategoria)}>
                  {rol.nombre} (máx. {rol.maximoPostulantes})
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
