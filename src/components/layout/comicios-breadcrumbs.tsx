import { Fragment } from 'react'
import { Link, useParams, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { listarCandidatos } from '@/features/eleccion/candidato/api/candidato-api'
import { obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import { listarListas } from '@/features/eleccion/lista/api/lista-api'

type BreadcrumbEntry = {
  label: string
  href?: string
}

export const ComiciosBreadcrumbs = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const params = useParams({ strict: false })

  const idEleccion = params.idEleccion ? Number(params.idEleccion) : undefined
  const idLista = params.idLista ? Number(params.idLista) : undefined
  const idCandidato = params.idCandidato ? Number(params.idCandidato) : undefined

  const isNuevoComicio = pathname.endsWith('/comicios/nuevo')
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
  } else if (idEleccion != null) {
    entries.push({
      label: eleccionLabel,
      href: `/comicios/${idEleccion}/oferta`,
    })

    if (isOferta) {
      entries.push({ label: 'Oferta electoral' })
    } else if (idLista != null) {
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
      } else if (isCandidatoEdit) {
        if (!isListaDetail) {
          entries[entries.length - 1] = {
            label: listaLabel,
            href: `/comicios/${idEleccion}/listas/${idLista}`,
          }
        }
        entries.push({ label: candidatoLabel })
      }
    }
  }

  if (entries.length <= 1 && !isNuevoComicio) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1

          return (
            <Fragment key={`${entry.label}-${index}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !entry.href ? (
                  <BreadcrumbPage>{entry.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={entry.href}>{entry.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
