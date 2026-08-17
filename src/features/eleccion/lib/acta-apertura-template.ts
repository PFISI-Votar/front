import type {
  ActaAperturaCategoria,
  ActaAperturaData,
  ActaAperturaDatosApertura,
} from '@/features/eleccion/data/acta-apertura-schema'

export const formatFecha = (iso: string): string =>
  new Date(iso).toLocaleString('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

export const formatActorApertura = (
  datosApertura: ActaAperturaDatosApertura
): string => {
  if (datosApertura.modo === 'AUTOMATICO') {
    return 'Apertura automática (sistema)'
  }
  if (!datosApertura.actorNombre) {
    return 'No disponible'
  }
  return datosApertura.actorRol
    ? `${datosApertura.actorNombre} (${datosApertura.actorRol})`
    : datosApertura.actorNombre
}

const buildOfertaElectoralTexto = (
  categorias: ActaAperturaCategoria[]
): string => {
  if (categorias.length === 0) {
    return 'No hay candidatos oficializados para este comicio.'
  }
  return categorias
    .map((categoria) => {
      const candidatos = categoria.candidatos
        .map((candidato) => {
          const listaLabel = candidato.listaSigla ?? candidato.listaNombre
          return listaLabel
            ? `- ${candidato.nombreCompleto} (${listaLabel})`
            : `- ${candidato.nombreCompleto}`
        })
        .join('\n')
      return `${categoria.nombre}:\n${candidatos}`
    })
    .join('\n\n')
}

/**
 * Grupo + token + etiqueta de cada variable disponible para el editor de
 * formato personalizado del Acta de Apertura. El token es la clave plana
 * usada tanto en `buildActaAperturaViewModel` como en el texto de la
 * plantilla (`{{token}}`).
 */
export const ACTA_APERTURA_VARIABLES: Array<{
  grupo: string
  token: string
  label: string
}> = [
  { grupo: 'Comicio', token: 'nombreEleccion', label: 'Nombre del comicio' },
  { grupo: 'Comicio', token: 'descripcion', label: 'Descripción' },
  { grupo: 'Comicio', token: 'estado', label: 'Estado' },
  { grupo: 'Comicio', token: 'idEleccion', label: 'ID del comicio' },
  { grupo: 'Comicio', token: 'fechaInicio', label: 'Apertura programada' },
  { grupo: 'Comicio', token: 'fechaFin', label: 'Cierre programado' },
  {
    grupo: 'Comicio',
    token: 'generadoEn',
    label: 'Fecha de generación del acta',
  },
  {
    grupo: 'Apertura',
    token: 'datosApertura.modo',
    label: 'Modalidad de apertura (MANUAL/AUTOMATICO)',
  },
  {
    grupo: 'Apertura',
    token: 'datosApertura.realizadaEn',
    label: 'Fecha y hora real de apertura',
  },
  {
    grupo: 'Apertura',
    token: 'datosApertura.responsable',
    label: 'Responsable de la apertura (nombre y rol)',
  },
  {
    grupo: 'Padrón',
    token: 'padron.totalVotantesHabilitados',
    label: 'Total de votantes habilitados',
  },
  { grupo: 'Padrón', token: 'padron.hashPadron', label: 'Hash del padrón' },
  {
    grupo: 'Oferta electoral',
    token: 'ofertaElectoral.texto',
    label: 'Listado de candidatos por categoría',
  },
  {
    grupo: 'Verificación',
    token: 'merkleRoot.hash',
    label: 'Raíz de Merkle',
  },
  {
    grupo: 'Verificación',
    token: 'merkleRoot.publicado',
    label: 'Raíz anclada on-chain (Sí/No)',
  },
  { grupo: 'Verificación', token: 'red', label: 'Red blockchain' },
  { grupo: 'Verificación', token: 'chainId', label: 'Chain ID' },
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
    token: 'contratos.auditView',
    label: 'Dirección contrato AuditView',
  },
  {
    grupo: 'Verificación',
    token: 'contratos.merkleRootStore',
    label: 'Dirección contrato MerkleRootStore',
  },
]

/** Aplana `ActaAperturaData` a los tokens de `ACTA_APERTURA_VARIABLES`. */
export const buildActaAperturaViewModel = (
  data: ActaAperturaData
): Record<string, string> => ({
  nombreEleccion: data.nombreEleccion,
  descripcion: data.descripcion ?? '',
  estado: data.estado,
  idEleccion: String(data.idEleccion),
  fechaInicio: formatFecha(data.fechaInicio),
  fechaFin: formatFecha(data.fechaFin),
  generadoEn: formatFecha(data.generadoEn),
  'datosApertura.modo': data.datosApertura?.modo ?? '',
  'datosApertura.realizadaEn': data.datosApertura
    ? formatFecha(data.datosApertura.realizadaEn)
    : '',
  'datosApertura.responsable': data.datosApertura
    ? formatActorApertura(data.datosApertura)
    : '',
  'padron.totalVotantesHabilitados': String(
    data.padron.totalVotantesHabilitados
  ),
  'padron.hashPadron': data.padron.hashPadron,
  'ofertaElectoral.texto': buildOfertaElectoralTexto(data.categorias),
  'merkleRoot.hash': data.merkleRoot.hash,
  'merkleRoot.publicado': data.merkleRoot.publicado ? 'Sí' : 'No',
  red: data.red,
  chainId: String(data.chainId),
  'contratos.ballot': data.contratos.ballot.direccion,
  'contratos.voteRegistry': data.contratos.voteRegistry.direccion,
  'contratos.auditView': data.contratos.auditView.direccion,
  'contratos.merkleRootStore': data.contratos.merkleRootStore.direccion,
})

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g

/**
 * Interpola `{{token}}` en `template` usando `viewModel`. Un token no
 * reconocido se deja literal — así el admin nota un typo en el preview en
 * vez de perder el dato silenciosamente.
 */
export const interpolarPlantillaActaApertura = (
  template: string,
  viewModel: Record<string, string>
): string =>
  template.replace(TOKEN_PATTERN, (match, token: string) =>
    token in viewModel ? viewModel[token] : match
  )
