import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import {
  actualizarCandidato,
  listarCandidatos,
} from '@/features/eleccion/api/candidato-api'
import { obtenerConfiguracionDatosCandidato } from '@/features/eleccion/api/configuracion-datos-candidato-api'
import { obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import { listarListas } from '@/features/eleccion/api/lista-api'
import { CandidatoForm } from '@/features/eleccion/components/candidato-form'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api-client'
import { ContentSection } from '@/features/settings/components/content-section'

export const Route = createFileRoute(
  '/_authenticated/comicios/$idEleccion/listas/$idLista/candidatos/$idCandidato'
)({
  component: EditarCandidatoRoute,
})

function EditarCandidatoRoute() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { idEleccion, idLista, idCandidato } = Route.useParams()
  const idEleccionNum = Number(idEleccion)
  const idListaNum = Number(idLista)
  const idCandidatoNum = Number(idCandidato)

  const eleccionQuery = useQuery({
    queryKey: ['eleccion', idEleccionNum],
    queryFn: () => obtenerEleccion(idEleccionNum),
  })

  const listasQuery = useQuery({
    queryKey: ['listas', idEleccionNum],
    queryFn: () => listarListas(idEleccionNum),
  })

  const candidatosQuery = useQuery({
    queryKey: ['candidatos', idListaNum],
    queryFn: () => listarCandidatos(idListaNum),
  })

  const configQuery = useQuery({
    queryKey: ['config-datos-candidato', idEleccionNum],
    queryFn: () => obtenerConfiguracionDatosCandidato(idEleccionNum),
  })

  const lista = listasQuery.data?.find((item) => item.idLista === idListaNum)
  const candidato = candidatosQuery.data?.find(
    (item) => item.idCandidato === idCandidatoNum
  )

  const idCategoriaDefault =
    lista?.idCategoriaDefault ?? candidato?.idCategoria ?? 1

  const actualizarCandidatoMutation = useMutation({
    mutationFn: (input: Parameters<typeof actualizarCandidato>[1]) =>
      actualizarCandidato(idCandidatoNum, input),
    onSuccess: async () => {
      toast.success('Candidato actualizado')
      await queryClient.invalidateQueries({ queryKey: ['candidatos', idListaNum] })
      await queryClient.invalidateQueries({ queryKey: ['listas', idEleccionNum] })
      navigate({
        to: '/comicios/$idEleccion/listas/$idLista',
        params: { idEleccion, idLista },
      })
    },
    onError: (error) => {
      if (getApiFieldErrors(error).length > 0) {
        return
      }
      toast.error(getApiErrorMessage(error))
    },
  })

  if (candidatosQuery.isLoading || configQuery.isLoading) {
    return (
      <p className='text-muted-foreground text-sm' aria-live='polite'>
        Cargando candidato…
      </p>
    )
  }

  if (!candidato) {
    return (
      <p className='text-destructive text-sm' role='alert'>
        No se encontró el candidato solicitado.
      </p>
    )
  }

  return (
    <>
      <div className='flex flex-col gap-0.5'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Editar candidato
        </h1>
        <p className='text-muted-foreground'>
          {candidato.nombre} {candidato.apellido}
          {lista ? ` · ${lista.nombre}` : ''}
          {eleccionQuery.data ? ` · ${eleccionQuery.data.nombre}` : ''}
        </p>
      </div>

      <Separator className='my-4 lg:my-6' />

      <div className='flex flex-1 flex-col overflow-hidden'>
        <ContentSection
          title='Ficha del candidato'
          desc='Actualice los datos personales y los campos adicionales del comicio.'
        >
          <CandidatoForm
            idCategoriaDefault={idCategoriaDefault}
            camposConfig={configQuery.data?.campos ?? []}
            submitLabel='Guardar cambios'
            defaultValues={{
              nombre: candidato.nombre,
              apellido: candidato.apellido,
              idCategoria: candidato.idCategoria,
              cargo: candidato.cargo ?? undefined,
              orden: candidato.orden,
              datosAdicionales: candidato.datosAdicionales,
            }}
            onSubmit={async (values) => {
              await actualizarCandidatoMutation.mutateAsync(values)
            }}
          />
        </ContentSection>
      </div>
    </>
  )
}
