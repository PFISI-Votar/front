import { describe, expect, it } from 'vitest'
import { puedeExportarEscrutinio } from '@/features/dashboard-publico/lib/escrutinio-export/export-escrutinio'

describe('puedeExportarEscrutinio — VOTAR-369', () => {
  it('allows export when comicio is CERRADA', () => {
    expect(puedeExportarEscrutinio('CERRADA')).toBe(true)
  })

  it('allows export when comicio is ESCRUTADA', () => {
    expect(puedeExportarEscrutinio('ESCRUTADA')).toBe(true)
  })

  it('blocks export when comicio is ABIERTA', () => {
    expect(puedeExportarEscrutinio('ABIERTA')).toBe(false)
  })

  it('blocks export when comicio is BORRADOR or CONFIGURADA', () => {
    expect(puedeExportarEscrutinio('BORRADOR')).toBe(false)
    expect(puedeExportarEscrutinio('CONFIGURADA')).toBe(false)
  })
})
