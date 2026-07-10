import { describe, expect, it } from 'vitest'
import {
  buildSelectionPayload,
  computeSelectionHash,
} from '@/features/voto/crypto/selection-hash'

describe('selection-hash', () => {
  it('normalizes blank and null flags and sorts selecciones', () => {
    expect(
      buildSelectionPayload({
        selecciones: [
          { idCategoria: 2, idCandidato: 201 },
          { idCategoria: 1, idCandidato: 101 },
        ],
      })
    ).toEqual({
      votoEnBlanco: false,
      votoNulo: false,
      selecciones: [
        { idCategoria: 1, idCandidato: 101 },
        { idCategoria: 2, idCandidato: 201 },
      ],
    })
  })

  it('produces a stable hash regardless of selection order', () => {
    const a = computeSelectionHash({
      selecciones: [
        { idCategoria: 2, idCandidato: 201 },
        { idCategoria: 1, idCandidato: 101 },
      ],
    })
    const b = computeSelectionHash({
      selecciones: [
        { idCategoria: 1, idCandidato: 101 },
        { idCategoria: 2, idCandidato: 201 },
      ],
    })
    expect(a).toEqual(b)
    expect(a).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  it('hashes blank and null votes distinctly', () => {
    const blank = computeSelectionHash({ votoEnBlanco: true, selecciones: [] })
    const nulo = computeSelectionHash({ votoNulo: true, selecciones: [] })
    expect(blank).not.toEqual(nulo)
  })
})
