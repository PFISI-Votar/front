import { describe, expect, it } from 'vitest'
import {
  resolveAuditCandidateId,
  resolveAuditCandidateIds,
  VOTO_BLANCO,
  VOTO_NULO,
} from '@/features/voto/crypto/audit-candidate-id'

describe('resolveAuditCandidateIds — VOTAR-474', () => {
  it('maps blank ballots to [VOTO_BLANCO]', () => {
    expect(
      resolveAuditCandidateIds({ votoEnBlanco: true, selecciones: [] })
    ).toEqual([VOTO_BLANCO])
  })

  it('maps null ballots to [VOTO_NULO]', () => {
    expect(
      resolveAuditCandidateIds({ votoNulo: true, selecciones: [] })
    ).toEqual([VOTO_NULO])
  })

  it('returns every category selection sorted by idCategoria / idCandidato', () => {
    expect(
      resolveAuditCandidateIds({
        selecciones: [
          { idCategoria: 2, idCandidato: 201 },
          { idCategoria: 1, idCandidato: 101 },
          { idCategoria: 3, idCandidato: 303 },
        ],
      })
    ).toEqual([101n, 201n, 303n])
  })

  it('throws when selection is empty and not blank/null', () => {
    expect(() => resolveAuditCandidateIds({ selecciones: [] })).toThrow(
      /no candidate/
    )
  })
})

describe('resolveAuditCandidateId — legacy primary id', () => {
  it('returns the first sorted partisan selection', () => {
    expect(
      resolveAuditCandidateId({
        selecciones: [
          { idCategoria: 2, idCandidato: 201 },
          { idCategoria: 1, idCandidato: 101 },
        ],
      })
    ).toBe(101n)
  })
})
