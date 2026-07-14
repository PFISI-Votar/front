import { describe, expect, it } from 'vitest'
import {
  resolveAuditCandidateId,
  VOTO_BLANCO,
  VOTO_NULO,
} from '@/features/voto/crypto/audit-candidate-id'

describe('resolveAuditCandidateId — VOTAR-346', () => {
  it('maps blank ballots to VOTO_BLANCO', () => {
    expect(
      resolveAuditCandidateId({ votoEnBlanco: true, selecciones: [] })
    ).toBe(VOTO_BLANCO)
  })

  it('maps null ballots to VOTO_NULO', () => {
    expect(resolveAuditCandidateId({ votoNulo: true, selecciones: [] })).toBe(
      VOTO_NULO
    )
  })

  it('uses the first sorted partisan selection as candidateId', () => {
    expect(
      resolveAuditCandidateId({
        selecciones: [
          { idCategoria: 2, idCandidato: 201 },
          { idCategoria: 1, idCandidato: 101 },
        ],
      })
    ).toBe(101n)
  })

  it('throws when selection is empty and not blank/null', () => {
    expect(() => resolveAuditCandidateId({ selecciones: [] })).toThrow(
      /no candidate/
    )
  })
})
