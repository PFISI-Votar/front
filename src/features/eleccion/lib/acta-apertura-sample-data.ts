import type { ActaAperturaData } from '@/features/eleccion/data/acta-apertura-schema'

/**
 * Datos de prueba (ficticios) para la previsualización en vivo del editor
 * de formato personalizado en `/configuracion`. No representan ningún
 * comicio real.
 */
export const ACTA_APERTURA_SAMPLE_DATA: ActaAperturaData = {
  idEleccion: 1,
  nombreEleccion: 'Elección de prueba — Centro de Estudiantes 2026',
  descripcion: 'Comicio de ejemplo usado solo para la previsualización.',
  estado: 'ABIERTA',
  fechaInicio: '2026-09-01T10:00:00.000Z',
  fechaFin: '2026-09-01T18:00:00.000Z',
  generadoEn: '2026-09-01T10:05:00.000Z',
  datosApertura: {
    modo: 'MANUAL',
    realizadaEn: '2026-09-01T10:00:12.000Z',
    actorNombre: 'Ana Gómez',
    actorRol: 'ELECTION_ADMIN',
  },
  padron: {
    totalVotantesHabilitados: 1500,
    hashPadron:
      'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  },
  logoUrl: null,
  categorias: [
    {
      idCategoria: 1,
      nombre: 'Presidente',
      candidatos: [
        {
          idCandidato: 100,
          nombreCompleto: 'Pérez, Juan',
          listaNombre: 'Lista Celeste',
          listaSigla: 'LC',
          orden: 1,
        },
        {
          idCandidato: 101,
          nombreCompleto: 'Fernández, María',
          listaNombre: 'Lista Verde',
          listaSigla: 'LV',
          orden: 2,
        },
      ],
    },
  ],
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
    incluirDatosApertura: true,
    incluirResumenPadron: true,
    incluirOfertaElectoral: true,
    incluirVerificacionCriptografica: true,
    incluirLogo: true,
  },
  formatoPersonalizado: {
    modo: 'PERSONALIZADO',
    plantillaTexto: null,
  },
}

export const ACTA_APERTURA_SAMPLE_TEMPLATE = `Se deja constancia de la apertura del comicio "{{nombreEleccion}}".

Apertura realizada el {{datosApertura.realizadaEn}} por {{datosApertura.responsable}}.

Total de votantes habilitados: {{padron.totalVotantesHabilitados}}.

Oferta electoral:
{{ofertaElectoral.texto}}

Raíz de Merkle publicada on-chain: {{merkleRoot.hash}}.`
