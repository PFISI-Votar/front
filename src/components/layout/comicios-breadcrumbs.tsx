import { useParams, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { listarCandidatos } from '@/features/eleccion/candidato/api/candidato-api'
import { obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import { listarListas } from '@/features/eleccion/lista/api/lista-api'
import { type BreadcrumbEntry } from '@/components/layout/breadcrumb-nav'

export const useComiciosBreadcrumbEntries = (): BreadcrumbEntry[] => {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const params = useParams({ strict: false })

  const idEleccion = params.idEleccion ? Number(params.idEleccion) : undefined
  const idLista = params.idLista ? Number(params.idLista) : undefined
  const idCandidato = params.idCandidato ? Number(params.idCandidato) : undefined

  const isNuevoComicio = pathname.endsWith('/comicios/nuevo')
  const isEditarComicio = pathname.endsWith('/editar')
  const isOferta = pathname.includes('/oferta')
  const isListaDetail =
    idLista != null && !pathname.includes('/candidatos')
  const isCandidatoNuevo = pathname.endsWith('/candidatos/nuevo')
  const isCandidatoEdit = idCandidato != null

  const eleccionQuery = useQuery({
    queryKey: ['eleccion', idEleccion],
    queryFn: () => obtenerEleccion(idEleccion!),
    enabled: idEleccion != null,
  })

  const listasQuery = useQuery({
    queryKey: ['listas', idEleccion],
    queryFn: () => listarListas(idEleccion!),
    enabled: idEleccion != null && idLista != null,
  })

  const candidatosQuery = useQuery({
    queryKey: ['candidatos', idLista],
    queryFn: () => listarCandidatos(idLista!),
    enabled: idLista != null && idCandidato != null,
  })

  const lista = listasQuery.data?.find((item) => item.idLista === idLista)
  const candidato = candidatosQuery.data?.find(
    (item) => item.idCandidato === idCandidato
  )

  const eleccionLabel =
    eleccionQuery.data?.nombre ??
    (idEleccion != null ? `Comicio #${idEleccion}` : 'Comicio')

  const listaLabel = lista
    ? `${lista.nombre} (${lista.sigla})`
    : idLista != null
      ? `Lista #${idLista}`
      : 'Lista'

  const candidatoLabel = candidato
    ? `${candidato.nombre} ${candidato.apellido}`
    : idCandidato != null
      ? `Candidato #${idCandidato}`
      : 'Candidato'

  const entries: BreadcrumbEntry[] = [{ label: 'Comicios', href: '/comicios' }]

  if (isNuevoComicio) {
    entries.push({ label: 'Nuevo comicio' })
    return entries
  }

  if (idEleccion == null) {
    return entries
  }

  entries.push({
    label: eleccionLabel,
    href: `/comicios/${idEleccion}/oferta`,
  })

  if (isEditarComicio) {
    entries.push({ label: 'Editar comicio' })
    return entries
  }

  if (isOferta) {
    entries.push({ label: 'Oferta electoral' })
    return entries
  }

  if (idLista == null) {
    return entries
  }

  entries.push({
    label: listaLabel,
    href: isListaDetail
      ? undefined
      : `/comicios/${idEleccion}/listas/${idLista}`,
  })

  if (isCandidatoNuevo) {
    if (!isListaDetail) {
      entries[entries.length - 1] = {
        label: listaLabel,
        href: `/comicios/${idEleccion}/listas/${idLista}`,
      }
    }
    entries.push({ label: 'Nuevo candidato' })
    return entries
  }

  if (isCandidatoEdit) {
    if (!isListaDetail) {
      entries[entries.length - 1] = {
        label: listaLabel,
        href: `/comicios/${idEleccion}/listas/${idLista}`,
      }
    }
    entries.push({ label: candidatoLabel })
  }

  return entries
}
