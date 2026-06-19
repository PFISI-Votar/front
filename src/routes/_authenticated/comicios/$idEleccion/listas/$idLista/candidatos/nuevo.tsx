import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { crearCandidato } from '@/features/eleccion/api/candidato-api'
import { obtenerConfiguracionDatosCandidato } from '@/features/eleccion/api/configuracion-datos-candidato-api'
import { obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import { listarListas } from '@/features/eleccion/api/lista-api'
import { CandidatoForm } from '@/features/eleccion/components/candidato-form'
import {
  ComicioFrozenGuard,
  ConflictAlert,
} from '@/features/eleccion/components/comicio-frozen-guard'
import {
  getApiErrorMessage,
  getApiFieldErrors,
  isConflictError,
} from '@/lib/api-client'
import { ContentSection } from '@/features/settings/components/content-section'

export const Route = createFileRoute(
  '/_authenticated/comicios/$idEleccion/listas/$idLista/candidatos/nuevo'
)({
  component: NuevoCandidatoRoute,
})

function NuevoCandidatoRoute() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { idEleccion, idLista } = Route.useParams()
  const idEleccionNum = Number(idEleccion)
  const idListaNum = Number(idLista)
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)

  const eleccionQuery = useQuery({
    queryKey: ['eleccion', idEleccionNum],
    queryFn: () => obtenerEleccion(idEleccionNum),
  })

  const listasQuery = useQuery({
    queryKey: ['listas', idEleccionNum],
    queryFn: () => listarListas(idEleccionNum),
  })

  const configQuery = useQuery({
    queryKey: ['config-datos-candidato', idEleccionNum],
    queryFn: () => obtenerConfiguracionDatosCandidato(idEleccionNum),
  })

  const lista = listasQuery.data?.find((item) => item.idLista === idListaNum)
  const idCategoriaDefault =
    lista?.idCategoriaDefault ?? lista?.candidatos?.[0]?.idCategoria ?? 1
  const isEditable = eleccionQuery.data?.estado === 'BORRADOR'

  const crearCandidatoMutation = useMutation({
    mutationFn: (input: Parameters<typeof crearCandidato>[1]) =>
      crearCandidato(idListaNum, input),
    onSuccess: async () => {
      setConflictMessage(null)
      toast.success('Candidato registrado')
      await queryClient.invalidateQueries({ queryKey: ['candidatos', idListaNum] })
      await queryClient.invalidateQueries({ queryKey: ['listas', idEleccionNum] })
      await queryClient.invalidateQueries({
        queryKey: ['config-datos-candidato', idEleccionNum],
      })
      navigate({
        to: '/comicios/$idEleccion/listas/$idLista',
        params: { idEleccion, idLista },
      })
    },
    onError: (error) => {
      if (getApiFieldErrors(error).length > 0) {
        return
      }
      if (isConflictError(error)) {
        setConflictMessage(getApiErrorMessage(error))
        toast.error(getApiErrorMessage(error))
        return
      }
      toast.error(getApiErrorMessage(error))
    },
  })

  const isLoading =
    listasQuery.isLoading || configQuery.isLoading || eleccionQuery.isLoading

  return (
    <>
      <div className='flex flex-col gap-0.5'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Registrar candidato
        </h1>
        <p className='text-muted-foreground'>
          {lista
            ? `Lista ${lista.nombre} (${lista.sigla})`
            : `Lista #${idLista}`}
          {eleccionQuery.data ? ` · ${eleccionQuery.data.nombre}` : ''}
        </p>
      </div>

      <div className='flex flex-1 flex-col gap-4 overflow-hidden'>
        <ConflictAlert message={conflictMessage} />
        <ContentSection
          title='Datos del candidato'
          desc='Complete los datos personales y los campos adicionales definidos para este comicio.'
        >
          <ComicioFrozenGuard
            isLoading={isLoading}
            isEditable={isEditable}
            idEleccion={idEleccion}
            idLista={idLista}
          >
            <CandidatoForm
              idCategoriaDefault={idCategoriaDefault}
              camposConfig={configQuery.data?.campos ?? []}
              submitLabel='Registrar candidato'
              onSubmit={async (values) => {
                await crearCandidatoMutation.mutateAsync(values)
              }}
            />
          </ComicioFrozenGuard>
        </ContentSection>
      </div>
    </>
  )
}
