import type { ActaCierreData } from '@/features/eleccion/data/acta-cierre-schema'

/**
 * Datos de prueba (ficticios) para la previsualización en vivo del editor
 * de formato personalizado del Acta de Cierre en `/configuracion`. No
 * representan ningún comicio real.
 */
export const ACTA_CIERRE_SAMPLE_DATA: ActaCierreData = {
  idEleccion: 1,
  nombreEleccion: 'Elección de prueba — Centro de Estudiantes 2026',
  descripcion: 'Comicio de ejemplo usado solo para la previsualización.',
  estado: 'CERRADA',
  tipoVotacion: 'POR_LISTA',
  fechaInicio: '2026-09-01T10:00:00.000Z',
  fechaFin: '2026-09-01T18:00:00.000Z',
  generadoEn: '2026-09-01T18:05:00.000Z',
  participacion: {
    totalVotos: 120,
    votosBlanco: 5,
    votosNulo: 2,
    totalVotantesHabilitados: 1500,
    porcentajeParticipacion: 8,
  },
  candidatos: [
    {
      idCandidato: 100,
      nombre: 'Juan',
      apellido: 'Pérez',
      idLista: 10,
      nombreLista: 'Lista Celeste',
      siglaLista: 'LC',
      colorLista: '#2f6f9f',
      idCategoria: 1,
      nombreCategoria: 'Presidente',
      votos: 66,
      porcentaje: 57.4,
    },
    {
      idCandidato: 101,
      nombre: 'María',
      apellido: 'Fernández',
      idLista: 20,
      nombreLista: 'Lista Verde',
      siglaLista: 'LV',
      colorLista: '#3f9f5f',
      idCategoria: 1,
      nombreCategoria: 'Presidente',
      votos: 47,
      porcentaje: 40.9,
    },
  ],
  logoUrl: null,
  merkleRoot: {
    hash: '0x' + 'ab'.repeat(32),
    publicado: true,
    publicadoEn: '2026-08-08T12:00:00.000Z',
  },
  red: 'Sepolia',
  chainId: 11155111,
  contratos: {
    ballot: {
      direccion: '0x1111111111111111111111111111111111111111',
      explorerUrl: 'https://sepolia.etherscan.io/address/0x1111',
    },
    voteRegistry: {
      direccion: '0x2222222222222222222222222222222222222222',
      explorerUrl: 'https://sepolia.etherscan.io/address/0x2222',
    },
    auditView: {
      direccion: '0x3333333333333333333333333333333333333333',
      explorerUrl: 'https://sepolia.etherscan.io/address/0x3333',
    },
    merkleRootStore: {
      direccion: '0x4444444444444444444444444444444444444444',
      explorerUrl: 'https://sepolia.etherscan.io/address/0x4444',
    },
  },
  plantilla: {
    incluirDescripcion: true,
    incluirParticipacion: true,
    incluirResultadosPorLista: true,
    incluirVerificacionCriptografica: true,
    incluirLogo: true,
  },
  formatoPersonalizado: {
    modo: 'PERSONALIZADO',
    plantillaTexto: null,
  },
}

export const ACTA_CIERRE_SAMPLE_TEMPLATE = `Se deja constancia del cierre y escrutinio final del comicio "{{nombreEleccion}}".

Total de votos emitidos: {{participacion.totalVotos}} ({{participacion.porcentajeParticipacion}} de participación sobre {{participacion.totalVotantesHabilitados}} votantes habilitados).
Votos en blanco: {{participacion.votosBlanco}}. Votos nulos: {{participacion.votosNulo}}.

Resultados:
{{resultados.texto}}

Raíz de Merkle publicada on-chain: {{merkleRoot.hash}}.
Contrato de escrutinio (AuditView): {{contratos.auditView}}.`
