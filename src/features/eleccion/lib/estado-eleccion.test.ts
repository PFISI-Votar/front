import { describe, expect, it } from 'vitest'
import { getListaEstadoBadgeLabel } from '@/features/eleccion/lib/estado-eleccion'

describe('getListaEstadoBadgeLabel — VOTAR-476', () => {
  it('mantiene el estado de la lista mientras el comicio sigue activo', () => {
    expect(getListaEstadoBadgeLabel('OFICIALIZADA', 'BORRADOR')).toBe(
      'OFICIALIZADA'
    )
    expect(getListaEstadoBadgeLabel('OFICIALIZADA', 'CONFIGURADA')).toBe(
      'OFICIALIZADA'
    )
    expect(getListaEstadoBadgeLabel('OFICIALIZADA', 'ABIERTA')).toBe(
      'OFICIALIZADA'
    )
    expect(getListaEstadoBadgeLabel('BORRADOR', 'BORRADOR')).toBe('BORRADOR')
  })

  it('prioriza labels del comicio cuando ya finalizó', () => {
    expect(getListaEstadoBadgeLabel('OFICIALIZADA', 'CERRADA')).toBe(
      'Comicio cerrado'
    )
    expect(getListaEstadoBadgeLabel('OFICIALIZADA', 'ESCRUTADA')).toBe(
      'Resultados escrutados'
    )
    expect(getListaEstadoBadgeLabel('OFICIALIZADA', 'ARCHIVADA')).toBe(
      'Comicio archivado'
    )
  })

  it('usa el estado de la lista si aún no hay datos del comicio', () => {
    expect(getListaEstadoBadgeLabel('OFICIALIZADA', undefined)).toBe(
      'OFICIALIZADA'
    )
  })
})
