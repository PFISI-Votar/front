import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useWatch, type Control } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { CreateComicioInput } from '@/features/eleccion/data/schema'
import type { RolCandidatoInput } from '@/features/eleccion/lista/data/schema'

const buildRolVacio = (): RolCandidatoInput => ({
  nombre: '',
  maximoPostulantes: 1,
})

type RolesCandidatoFieldProps = {
  control: Control<CreateComicioInput>
}

const RolIdCategoriaHiddenField = ({
  control,
  index,
}: {
  control: Control<CreateComicioInput>
  index: number
}) => {
  const idCategoria = useWatch({
    control,
    name: `roles.${index}.idCategoria`,
  })

  if (!idCategoria) {
    return null
  }

  return (
    <FormField
      control={control}
      name={`roles.${index}.idCategoria`}
      render={({ field }) => <input type='hidden' {...field} value={field.value} />}
    />
  )
}

export const RolesCandidatoField = ({ control }: RolesCandidatoFieldProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'roles',
  })

  const handleAddRol = () => {
    append(buildRolVacio())
  }

  return (
    <div className='space-y-4' aria-label='Roles de candidato en la lista'>
      <div className='flex items-center justify-between gap-4'>
        <FormLabel>Roles de candidato</FormLabel>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={handleAddRol}
          aria-label='Agregar rol de candidato'
        >
          <Plus className='mr-1 size-4' />
          Agregar rol
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          Agregue al menos un rol con su límite de postulantes.
        </p>
      ) : null}

      <div className='space-y-4'>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className='grid gap-4 rounded-lg border p-4 lg:grid-cols-[1fr_160px_auto]'
          >
            <RolIdCategoriaHiddenField control={control} index={index} />
            <FormField
              control={control}
              name={`roles.${index}.nombre`}
              render={({ field: nombreField }) => (
                <FormItem>
                  <FormLabel>Nombre del rol</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Presidente'
                      className='h-10'
                      {...nombreField}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`roles.${index}.maximoPostulantes`}
              render={({ field: maxField }) => (
                <FormItem>
                  <FormLabel>Máx. postulantes</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={1}
                      className='h-10'
                      value={maxField.value}
                      onChange={(event) =>
                        maxField.onChange(Number(event.target.value))
                      }
                      onBlur={maxField.onBlur}
                      name={maxField.name}
                      ref={maxField.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex items-end'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => remove(index)}
                aria-label={`Eliminar rol ${index + 1}`}
                disabled={fields.length <= 1}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
