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

describe('Manual para auditores (VOTAR-396)', () => {
  it('publica el manual en una ruta anónima del front', () => {
    expect(MANUAL_AUDITORES_HREF).toBe('/manual/auditores')
  })

  it('no expone badges UAT ni guiones largos en el texto del manual', () => {
    const allText = MANUAL_AUDITORES_SECTIONS.flatMap((item) => [
      item.title,
      ...item.body,
      ...(item.steps ?? []),
      item.note ?? '',
    ]).join('\n')

    expect(allText).not.toContain('—')
    expect(allText).not.toMatch(/UAT-\d+/)
    expect(MANUAL_AUDITORES_SECTIONS.every((item) => !('uat' in item))).toBe(
      true
    )
  })

  it('indica cómo verificar un recibo en el verificador público', () => {
    const text = textOf('recibo')
    expect(text).toContain('/verificar')
    expect(text).toContain('TransactionHash')
    expect(text).toContain('Verificar inclusión')
    expect(text).toContain('SignedVoteCast')
  })

  it('indica cómo hallar apertura y cierre en el Audit Log', () => {
    const text = textOf('audit-log')
    expect(text).toContain('/auditoria')
    expect(text).toContain('Apertura de comicio')
    expect(text).toContain('Cierre de comicio')
    expect(text).toContain('Eventos críticos')
    expect(text).toContain('INFO')
  })

  it('indica cómo cotejar la raíz Merkle en el explorador', () => {
    const text = textOf('etherscan')
    expect(text).toContain('MerkleRootStore')
    expect(text).toContain('getMerkleRoot')
    expect(text).toContain('Hash del padrón')
    expect(text).toContain('Etherscan')
  })

  it('explica el recuento independiente con VoteUpdated', () => {
    const text = textOf('recuento')
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
