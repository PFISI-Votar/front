import { describe, expect, it } from 'vitest'
import { ACTA_CIERRE_SAMPLE_DATA } from '@/features/eleccion/lib/acta-cierre-sample-data'
import { buildActaCierreViewModel } from '@/features/eleccion/lib/acta-cierre-template'
import { interpolarPlantilla } from '@/features/eleccion/lib/plantilla-interpolacion'

describe('acta-cierre-template', () => {
  describe('buildActaCierreViewModel', () => {
    it('flattens participacion fields', () => {
      const viewModel = buildActaCierreViewModel(ACTA_CIERRE_SAMPLE_DATA)

      expect(viewModel.nombreEleccion).toBe(
        ACTA_CIERRE_SAMPLE_DATA.nombreEleccion
      )
      expect(viewModel['participacion.totalVotos']).toBe('120')
      expect(viewModel['participacion.votosBlanco']).toBe('5')
      expect(viewModel['participacion.votosNulo']).toBe('2')
    })

    it('builds resultados.texto grouped by lista for POR_LISTA voting', () => {
      const viewModel = buildActaCierreViewModel(ACTA_CIERRE_SAMPLE_DATA)

      expect(viewModel['resultados.texto']).toContain('Lista Celeste (LC)')
      expect(viewModel['resultados.texto']).toContain('Lista Verde (LV)')
      expect(viewModel['resultados.texto']).toContain('Voto en blanco')
    })

    it('groups by categoria for POR_CANDIDATO voting', () => {
      const viewModel = buildActaCierreViewModel({
        ...ACTA_CIERRE_SAMPLE_DATA,
        tipoVotacion: 'POR_CANDIDATO',
      })

      expect(viewModel['resultados.texto']).toContain('Presidente:')
      expect(viewModel['resultados.texto']).toContain('- Pérez, Juan (LC)')
    })

    it('exposes the AuditView contract address for on-chain verification', () => {
      const viewModel = buildActaCierreViewModel(ACTA_CIERRE_SAMPLE_DATA)

      expect(viewModel['contratos.auditView']).toBe(
        ACTA_CIERRE_SAMPLE_DATA.contratos.auditView.direccion
      )
    })
  })

  it('interpolates the sample template end-to-end without leftover tokens', () => {
    const viewModel = buildActaCierreViewModel(ACTA_CIERRE_SAMPLE_DATA)
    const resultado = interpolarPlantilla(
      'Comicio {{nombreEleccion}} — {{participacion.totalVotos}} votos',
      viewModel
    )

    expect(resultado).toBe(
      `Comicio ${ACTA_CIERRE_SAMPLE_DATA.nombreEleccion} — 120 votos`
    )
  })
})
