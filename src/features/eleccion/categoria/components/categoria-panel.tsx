import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getApiErrorMessage } from '@/lib/api-client'
import { crearCategoria, listarCategorias } from '@/features/eleccion/categoria/api/categoria-api'
import { CategoriaFormDialog } from '@/features/eleccion/categoria/components/categoria-form-dialog'
import type { CreateCategoriaInput } from '@/features/eleccion/categoria/data/schema'

type CategoriasPanelProps = {
  idEleccion: number
  isEditable: boolean
}

export const CategoriasPanel = ({ idEleccion, isEditable }: CategoriasPanelProps) => {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const categoriasQuery = useQuery({
    queryKey: ['categorias', idEleccion],
    queryFn: () => listarCategorias(idEleccion),
  })

  const crearCategoriaMutation = useMutation({
    mutationFn: (input: CreateCategoriaInput) => crearCategoria(idEleccion, input),
    onSuccess: async () => {
      toast.success('Categoría creada correctamente')
      await queryClient.invalidateQueries({ queryKey: ['categorias', idEleccion] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  return (
    <Card>
      <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
        <div className='flex flex-col gap-1'>
          <CardTitle>Categorías electorales</CardTitle>
          <CardDescription>
            Cargos o roles que se votarán en este comicio
          </CardDescription>
        </div>
        <Button
          size='sm'
          onClick={() => setDialogOpen(true)}
          disabled={!isEditable}
          aria-label='Agregar nueva categoría'
        >
          <Plus className='me-2 size-4' />
          Nueva categoría
        </Button>
      </CardHeader>
      <CardContent>
        {categoriasQuery.isLoading && (
          <p className='text-muted-foreground text-sm'>Cargando categorías…</p>
        )}

        {!categoriasQuery.isLoading && (categoriasQuery.data ?? []).length === 0 && (
          <p className='text-muted-foreground text-sm'>
            No hay categorías registradas. Agregá al menos una antes de oficializar.
          </p>
        )}

        <ul className='flex flex-col gap-2' aria-label='Lista de categorías'>
          {(categoriasQuery.data ?? []).map((categoria) => (
            <li
              key={categoria.idCategoria}
              className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3'
            >
              <div className='flex flex-col gap-0.5'>
                <p className='font-medium'>{categoria.nombre}</p>
                <p className='text-muted-foreground text-sm'>
                  {categoria.descripcion
                    ? `${categoria.descripcion} · `
                    : ''}
                  {categoria.cantidadCargos} cargo{categoria.cantidadCargos !== 1 ? 's' : ''} · Orden {categoria.orden}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>

      <CategoriaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (values) => {
          await crearCategoriaMutation.mutateAsync(values)
        }}
      />
    </Card>
  )
}