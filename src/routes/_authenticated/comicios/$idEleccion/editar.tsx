import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  actualizarEleccion,
  obtenerEleccion,
} from '@/features/eleccion/api/eleccion-api'
import { ComicioForm } from '@/features/eleccion/components/comicio-form'
import { ContentSection } from '@/features/settings/components/content-section'

export const Route = createFileRoute('/_authenticated/comicios/$idEleccion/editar')({
  component: EditarComicioPage,
})

function EditarComicioPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { idEleccion } = Route.useParams()
  const idEleccionNum = Number(idEleccion)

  const eleccionQuery = useQuery({
    queryKey: ['eleccion', idEleccionNum],
    queryFn: () => obtenerEleccion(idEleccionNum),
  })

  const actualizarMutation = useMutation({
    mutationFn: (input: Parameters<typeof actualizarEleccion>[1]) =>
      actualizarEleccion(idEleccionNum, input),
    onSuccess: async () => {
      toast.success('Comicio actualizado')
      await queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccionNum] })
      await queryClient.invalidateQueries({ queryKey: ['elecciones'] })
      await queryClient.invalidateQueries({ queryKey: ['listas', idEleccionNum] })
      navigate({
        to: '/comicios/$idEleccion/oferta',
        params: { idEleccion },
      })
    },
  })

  if (eleccionQuery.isLoading) {
    return (
      <p className='text-muted-foreground text-sm' aria-live='polite'>
        Cargando comicio…
      </p>
    )
  }

  if (!eleccionQuery.data) {
    return (
      <p className='text-destructive text-sm' role='alert'>
        No se encontró el comicio solicitado.
      </p>
    )
  }

  if (eleccionQuery.data.estado !== 'BORRADOR') {
    return (
      <p className='text-destructive text-sm' role='alert'>
        Solo se pueden editar comicios en estado BORRADOR.
      </p>
    )
  }

  return (
    <>
      <div className='flex flex-col gap-0.5'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Editar comicio
        </h1>
        <p className='text-muted-foreground'>
          {eleccionQuery.data.nombre} · ID {idEleccion}
        </p>
      </div>

      <div className='flex flex-1 flex-col overflow-hidden'>
        <ContentSection
          title='Configuración del comicio'
          desc='Modifique los datos generales, la modalidad electoral y los métodos de acceso. Las categorías se gestionan en la oferta electoral.'
        >
          <ComicioForm
            mode='edit'
            defaultValues={eleccionQuery.data}
            submitLabel='Guardar cambios'
            onSubmit={async (values) => {
              await actualizarMutation.mutateAsync(values)
            }}
          />
        </ContentSection>
      </div>
    </>
  )
}
