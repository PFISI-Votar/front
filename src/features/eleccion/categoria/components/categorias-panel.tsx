import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { getApiErrorMessage } from '@/lib/api-client'
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
} from '@/features/eleccion/categoria/api/categoria-api'
import {
  categoriaFormSchema,
  type Categoria,
  type CategoriaFormInput,
} from '@/features/eleccion/categoria/data/schema'

type CategoriasPanelProps = {
  idEleccion: number
  isEditable: boolean
}

const buildCategoriaDefaults = (): CategoriaFormInput => ({
  nombre: '',
  descripcion: '',
  minimoPostulantes: 0,
  maximoPostulantes: 1,
})

const mapCategoriaToForm = (categoria: Categoria): CategoriaFormInput => ({
  nombre: categoria.nombre,
  descripcion: categoria.descripcion ?? '',
  minimoPostulantes: categoria.minimoPostulantes,
  maximoPostulantes: categoria.cantidadCargos,
})

type CategoriaFormProps = {
  defaultValues: CategoriaFormInput
  submitLabel: string
  isLoading: boolean
  onSubmit: (values: CategoriaFormInput) => Promise<void>
  onCancel: () => void
}

const CategoriaForm = ({
  defaultValues,
  submitLabel,
  isLoading,
  onSubmit,
  onCancel,
}: CategoriaFormProps) => {
  const form = useForm<CategoriaFormInput>({
    resolver: zodResolver(categoriaFormSchema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='grid gap-4 rounded-lg border p-4 lg:grid-cols-2'
        aria-label='Formulario de categoría electoral'
      >
        <FormField
          control={form.control}
          name='nombre'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder='Presidente' className='h-10' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='descripcion'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder='Cargo principal del centro'
                  className='h-10'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='minimoPostulantes'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mín. postulantes por lista</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min={0}
                  className='h-10'
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='maximoPostulantes'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Máx. postulantes por lista</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min={1}
                  className='h-10'
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex items-end gap-2 lg:col-span-2'>
          <Button type='submit' disabled={isLoading}>
            {isLoading ? 'Guardando…' : submitLabel}
          </Button>
          <Button type='button' variant='ghost' onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}

export const CategoriasPanel = ({
  idEleccion,
  isEditable,
}: CategoriasPanelProps) => {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null)

  const categoriasQuery = useQuery({
    queryKey: ['categorias', idEleccion],
    queryFn: () => listarCategorias(idEleccion),
  })

  const invalidateCategorias = async () => {
    await queryClient.invalidateQueries({ queryKey: ['categorias', idEleccion] })
    await queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
    await queryClient.invalidateQueries({ queryKey: ['listas', idEleccion] })
  }

  const crearMutation = useMutation({
    mutationFn: (input: CategoriaFormInput) =>
      crearCategoria(idEleccion, input),
    onSuccess: async () => {
      toast.success('Categoría creada correctamente')
      setShowCreateForm(false)
      await invalidateCategorias()
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const actualizarMutation = useMutation({
    mutationFn: ({
      idCategoria,
      input,
    }: {
      idCategoria: number
      input: CategoriaFormInput
    }) => actualizarCategoria(idEleccion, idCategoria, input),
    onSuccess: async () => {
      toast.success('Categoría actualizada')
      setEditingCategoria(null)
      await invalidateCategorias()
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const eliminarMutation = useMutation({
    mutationFn: (idCategoria: number) =>
      eliminarCategoria(idEleccion, idCategoria),
    onSuccess: async () => {
      toast.success('Categoría eliminada')
      setDeleteTarget(null)
      await invalidateCategorias()
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const categorias = categoriasQuery.data ?? []

  return (
    <Card>
      <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
        <div className='flex flex-col gap-1'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <FolderTree className='size-5' aria-hidden='true' />
            Categorías electorales
          </CardTitle>
          <CardDescription>
            Defina los cargos de la boleta y los límites de postulantes por
            lista. Se validan al oficializar el comicio.
          </CardDescription>
        </div>
        {isEditable && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => {
              setEditingCategoria(null)
              setShowCreateForm((prev) => !prev)
            }}
            aria-expanded={showCreateForm}
            aria-label='Agregar categoría electoral'
          >
            <Plus className='me-2 size-4' />
            Nueva categoría
          </Button>
        )}
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {showCreateForm && isEditable && (
          <CategoriaForm
            defaultValues={buildCategoriaDefaults()}
            submitLabel='Agregar categoría'
            isLoading={crearMutation.isPending}
            onSubmit={async (values) => {
              await crearMutation.mutateAsync(values)
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {categoriasQuery.isLoading && (
          <p className='text-muted-foreground text-sm'>Cargando categorías…</p>
        )}

        {!categoriasQuery.isLoading && categorias.length === 0 && (
          <p className='text-muted-foreground text-sm'>
            Aún no hay categorías registradas. Agregue al menos una antes de
            registrar candidatos u oficializar.
          </p>
        )}

        {categorias.length > 0 && (
          <ul
            className='flex flex-col gap-3'
            aria-label='Listado de categorías electorales'
          >
            {categorias.map((categoria) => {
              const isEditing =
                editingCategoria?.idCategoria === categoria.idCategoria

              if (isEditing) {
                return (
                  <li key={categoria.idCategoria}>
                    <CategoriaForm
                      defaultValues={mapCategoriaToForm(categoria)}
                      submitLabel='Guardar cambios'
                      isLoading={actualizarMutation.isPending}
                      onSubmit={async (values) => {
                        await actualizarMutation.mutateAsync({
                          idCategoria: categoria.idCategoria,
                          input: values,
                        })
                      }}
                      onCancel={() => setEditingCategoria(null)}
                    />
                  </li>
                )
              }

              return (
                <li
                  key={categoria.idCategoria}
                  className='flex flex-wrap items-start justify-between gap-3 rounded-lg border px-4 py-3'
                >
                  <div className='flex min-w-0 flex-col gap-1'>
                    <p className='font-medium'>{categoria.nombre}</p>
                    {categoria.descripcion ? (
                      <p className='text-muted-foreground text-sm'>
                        {categoria.descripcion}
                      </p>
                    ) : null}
                    <p className='text-muted-foreground text-sm'>
                      Postulantes por lista: mín. {categoria.minimoPostulantes}{' '}
                      · máx. {categoria.cantidadCargos}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant='secondary'>Orden {categoria.orden}</Badge>
                    {isEditable && (
                      <>
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          aria-label={`Editar categoría ${categoria.nombre}`}
                          onClick={() => {
                            setShowCreateForm(false)
                            setEditingCategoria(categoria)
                          }}
                        >
                          <Pencil className='size-4' />
                        </Button>
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          aria-label={`Eliminar categoría ${categoria.nombre}`}
                          onClick={() => setDeleteTarget(categoria)}
                        >
                          <Trash2 className='size-4 text-destructive' />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        title='¿Eliminar categoría?'
        desc={
          deleteTarget ? (
            <>
              Se eliminará la categoría <strong>{deleteTarget.nombre}</strong>.
              Solo es posible si no tiene candidatos registrados.
            </>
          ) : (
            ''
          )
        }
        cancelBtnText='Cancelar'
        confirmText='Sí, eliminar'
        destructive
        isLoading={eliminarMutation.isPending}
        handleConfirm={() => {
          if (deleteTarget) {
            eliminarMutation.mutate(deleteTarget.idCategoria)
          }
        }}
      />
    </Card>
  )
}
