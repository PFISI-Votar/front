import { describe, expect, it } from 'vitest'
import { ACTA_APERTURA_SAMPLE_DATA } from '@/features/eleccion/lib/acta-apertura-sample-data'
import {
  buildActaAperturaViewModel,
  interpolarPlantillaActaApertura,
} from '@/features/eleccion/lib/acta-apertura-template'

describe('acta-apertura-template — VOTAR-374', () => {
  describe('buildActaAperturaViewModel', () => {
    it('flattens scalar fields and formats dates/booleans', () => {
      const viewModel = buildActaAperturaViewModel(ACTA_APERTURA_SAMPLE_DATA)

      expect(viewModel.nombreEleccion).toBe(
        ACTA_APERTURA_SAMPLE_DATA.nombreEleccion
      )
      expect(viewModel['padron.totalVotantesHabilitados']).toBe('1500')
      expect(viewModel['merkleRoot.publicado']).toBe('Sí')
      expect(viewModel['contratos.ballot']).toBe(
        ACTA_APERTURA_SAMPLE_DATA.contratos.ballot.direccion
      )
    })

    it('formats the apertura responsable combining nombre y rol', () => {
      const viewModel = buildActaAperturaViewModel(ACTA_APERTURA_SAMPLE_DATA)

      expect(viewModel['datosApertura.responsable']).toBe(
        'Ana Gómez (ELECTION_ADMIN)'
      )
    })

    it('renders "Apertura automática (sistema)" when modo is AUTOMATICO', () => {
      const viewModel = buildActaAperturaViewModel({
        ...ACTA_APERTURA_SAMPLE_DATA,
        datosApertura: {
          modo: 'AUTOMATICO',
          realizadaEn: '2026-09-01T10:00:00.000Z',
          actorNombre: null,
          actorRol: null,
        },
      })

      expect(viewModel['datosApertura.responsable']).toBe(
        'Apertura automática (sistema)'
      )
    })

    it('builds a multiline block for ofertaElectoral.texto', () => {
      const viewModel = buildActaAperturaViewModel(ACTA_APERTURA_SAMPLE_DATA)

      expect(viewModel['ofertaElectoral.texto']).toContain('Presidente:')
      expect(viewModel['ofertaElectoral.texto']).toContain('- Pérez, Juan (LC)')
    })
  })

  describe('interpolarPlantillaActaApertura', () => {
    it('replaces known tokens with their view model values', () => {
      const resultado = interpolarPlantillaActaApertura(
        'Comicio: {{nombreEleccion}}',
        { nombreEleccion: 'Elección de prueba' }
      )

      expect(resultado).toBe('Comicio: Elección de prueba')
    })

    it('leaves unknown tokens literal so a typo is visible', () => {
      const resultado = interpolarPlantillaActaApertura(
        'Dato: {{tokenInexistente}}',
        { nombreEleccion: 'Elección de prueba' }
      )

      expect(resultado).toBe('Dato: {{tokenInexistente}}')
    })

    it('tolerates extra whitespace inside the braces', () => {
      const resultado = interpolarPlantillaActaApertura(
        'Comicio: {{  nombreEleccion  }}',
        { nombreEleccion: 'Elección de prueba' }
      )

      expect(resultado).toBe('Comicio: Elección de prueba')
    })
  })
})
