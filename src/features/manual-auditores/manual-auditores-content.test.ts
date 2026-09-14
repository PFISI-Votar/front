import { describe, expect, it } from 'vitest'
import {
  MANUAL_AUDITORES_HREF,
  MANUAL_AUDITORES_SECTIONS,
  SIN_VOTO_PREVIO,
  VOTO_BLANCO,
  VOTO_NULO,
} from '@/features/manual-auditores/manual-auditores-content'

const section = (id: string) => {
  const found = MANUAL_AUDITORES_SECTIONS.find((item) => item.id === id)
  if (!found) {
    throw new Error(`Falta la sección ${id}`)
  }
  return found
}

const textOf = (id: string): string => {
  const item = section(id)
  return [item.title, ...item.body, ...(item.steps ?? []), item.note]
    .filter(Boolean)
    .join('\n')
}

describe('Manual para auditores — VOTAR-396', () => {
  it('publica el manual en una ruta anónima del front', () => {
    expect(MANUAL_AUDITORES_HREF).toBe('/manual/auditores')
  })

  it('UAT-01: indica cómo verificar un recibo en el verificador público', () => {
    const text = textOf('recibo')
    expect(section('recibo').uat).toBe('UAT-01')
    expect(text).toContain('/verificar')
    expect(text).toContain('TransactionHash')
    expect(text).toContain('Verificar inclusión')
    expect(text).toContain('SignedVoteCast')
  })

  it('UAT-02: indica cómo hallar apertura y cierre en el Audit Log', () => {
    const text = textOf('audit-log')
    expect(section('audit-log').uat).toBe('UAT-02')
    expect(text).toContain('/auditoria')
    expect(text).toContain('Apertura de comicio')
    expect(text).toContain('Cierre de comicio')
    expect(text).toContain('Eventos críticos')
    expect(text).toContain('INFO')
  })

  it('UAT-03: indica cómo cotejar la raíz Merkle en el explorador', () => {
    const text = textOf('etherscan')
    expect(section('etherscan').uat).toBe('UAT-03')
    expect(text).toContain('MerkleRootStore')
    expect(text).toContain('getMerkleRoot')
    expect(text).toContain('Hash del padrón')
    expect(text).toContain('Etherscan')
  })

  it('UAT-04: explica el recuento independiente con VoteUpdated', () => {
    const text = textOf('recuento')
    expect(section('recuento').uat).toBe('UAT-04')
    expect(text).toContain('VoteUpdated')
    expect(text).toContain('getVotesByCandidate')
    expect(text).toContain(SIN_VOTO_PREVIO)
    expect(text).toContain(VOTO_BLANCO)
    expect(text).toContain(VOTO_NULO)
    expect(text).toContain('eth_getLogs')
  })

  it('explica cómo leer resultados y participación del dashboard', () => {
    const text = textOf('escrutinio')
    expect(text).toContain('/comicios/{id}/dashboard')
    expect(text).toContain('getParticipationStats')
    expect(text).toContain('Resultados Definitivos e Inmutables')
    expect(text).toContain('CERRADA')
  })
})
