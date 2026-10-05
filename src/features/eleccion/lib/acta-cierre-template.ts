import type { CandidatoEscrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'
import {
  buildResumenPorCategoria,
  buildResumenPorLista,
  buildVotoEnBlanco,
  calcularBaseVotosValidos,
} from '@/features/dashboard-publico/lib/escrutinio-export/escrutinio-export-calculos'
import type { ActaCierreData } from '@/features/eleccion/data/acta-cierre-schema'
import { formatFecha } from '@/features/eleccion/lib/plantilla-interpolacion'
import { TIPOS_VOTACION } from '@/features/eleccion/lista/data/schema'

/**
 * Bloque multilínea con los resultados agrupados por lista (o por
 * categoría, en comicios que no votan por lista) — reutiliza la misma
 * agregación que ya usa la exportación de escrutinio del Portal de
 * Transparencia (`escrutinio-export-calculos.ts`), para que los números
 * del Acta de Cierre nunca diverjan de los que ya se publican ahí.
 */
const buildResultadosTexto = (data: ActaCierreData): string => {
  const baseVotosValidos = calcularBaseVotosValidos(data.participacion)
  const votoEnBlanco = buildVotoEnBlanco(data.participacion, baseVotosValidos)
  const candidatos: CandidatoEscrutinio[] = data.candidatos

  const lineas: string[] = []
  if (data.tipoVotacion === TIPOS_VOTACION.POR_LISTA) {
    for (const lista of buildResumenPorLista(candidatos, baseVotosValidos)) {
      const etiquetaLista = lista.siglaLista
        ? `${lista.nombreLista} (${lista.siglaLista})`
        : lista.nombreLista
      lineas.push(
        `${etiquetaLista}: ${lista.totalVotosLista} votos (${lista.porcentaje}%)`
      )
    }
  } else {
    for (const categoria of buildResumenPorCategoria(
      candidatos,
      baseVotosValidos
    )) {
      lineas.push(`${categoria.nombreCategoria}:`)
      for (const candidato of categoria.candidatos) {
        const etiquetaLista = candidato.siglaLista ?? candidato.nombreLista
        lineas.push(
          `- ${candidato.apellido}, ${candidato.nombre} (${etiquetaLista}): ${candidato.votos} votos`
        )
      }
    }
  }
  if (votoEnBlanco) {
    lineas.push(
      `Voto en blanco: ${votoEnBlanco.votos} votos (${votoEnBlanco.porcentaje}%)`
    )
  }
  return lineas.join('\n')
}

/**
 * Grupo + token + etiqueta de cada variable disponible para el editor de
 * formato personalizado del Acta de Cierre.
 */
export const ACTA_CIERRE_VARIABLES: Array<{
  grupo: string
  token: string
  label: string
}> = [
  { grupo: 'Comicio', token: 'nombreEleccion', label: 'Nombre del comicio' },
  { grupo: 'Comicio', token: 'descripcion', label: 'Descripción' },
  { grupo: 'Comicio', token: 'estado', label: 'Estado' },
  { grupo: 'Comicio', token: 'idEleccion', label: 'ID del comicio' },
  { grupo: 'Comicio', token: 'fechaFin', label: 'Cierre programado' },
  {
    grupo: 'Comicio',
    token: 'generadoEn',
    label: 'Fecha de generación del acta',
  },
  {
    grupo: 'Participación',
    token: 'participacion.totalVotos',
    label: 'Total de votos únicos emitidos',
  },
  {
    grupo: 'Participación',
    token: 'participacion.votosBlanco',
    label: 'Votos en blanco',
  },
  {
    grupo: 'Participación',
    token: 'participacion.votosNulo',
    label: 'Votos nulos',
  },
  {
    grupo: 'Participación',
    token: 'participacion.totalVotantesHabilitados',
    label: 'Total de votantes habilitados',
  },
  {
    grupo: 'Participación',
    token: 'participacion.porcentajeParticipacion',
    label: 'Porcentaje de participación',
  },
  {
    grupo: 'Resultados',
    token: 'resultados.texto',
    label: 'Resultados por lista/categoría (votos y blanco)',
  },
  {
    grupo: 'Verificación',
    token: 'merkleRoot.hash',
    label: 'Raíz de Merkle',
  },
  { grupo: 'Verificación', token: 'red', label: 'Red blockchain' },
  { grupo: 'Verificación', token: 'chainId', label: 'Chain ID' },
  {
    grupo: 'Verificación',
    token: 'contratos.auditView',
    label:
      'Dirección contrato de escrutinio (AuditView, consultable en Sepolia)',
  },
  {
    grupo: 'Verificación',
    token: 'contratos.ballot',
    label: 'Dirección contrato Ballot',
  },
  {
    grupo: 'Verificación',
    token: 'contratos.voteRegistry',
    label: 'Dirección contrato VoteRegistry',
  },
  {
    grupo: 'Verificación',
    token: 'contratos.merkleRootStore',
    label: 'Dirección contrato MerkleRootStore',
  },
]

/** Aplana `ActaCierreData` a los tokens de `ACTA_CIERRE_VARIABLES`. */
export const buildActaCierreViewModel = (
  data: ActaCierreData
): Record<string, string> => ({
  nombreEleccion: data.nombreEleccion,
  descripcion: data.descripcion ?? '',
  estado: data.estado,
  idEleccion: String(data.idEleccion),
  fechaFin: formatFecha(data.fechaFin),
  generadoEn: formatFecha(data.generadoEn),
  'participacion.totalVotos': String(data.participacion.totalVotos),
  'participacion.votosBlanco': String(data.participacion.votosBlanco),
  'participacion.votosNulo': String(data.participacion.votosNulo),
  'participacion.totalVotantesHabilitados': String(
    data.participacion.totalVotantesHabilitados
  ),
  'participacion.porcentajeParticipacion': `${data.participacion.porcentajeParticipacion}%`,
  'resultados.texto': buildResultadosTexto(data),
  'merkleRoot.hash': data.merkleRoot.hash,
  red: data.red,
  chainId: String(data.chainId),
  'contratos.auditView': data.contratos.auditView.direccion,
  'contratos.ballot': data.contratos.ballot.direccion,
  'contratos.voteRegistry': data.contratos.voteRegistry.direccion,
  'contratos.merkleRootStore': data.contratos.merkleRootStore.direccion,
})
