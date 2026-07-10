import { keccak256, toBytes } from 'viem'
import type { SeleccionVoto } from '@/features/voto/data/schema'

export type SelectionPayload = {
  votoEnBlanco?: boolean
  votoNulo?: boolean
  selecciones: SeleccionVoto[]
}

const normalizeSelecciones = (selecciones: SeleccionVoto[]): SeleccionVoto[] =>
  selecciones
    .slice()
    .sort(
      (a, b) => a.idCategoria - b.idCategoria || a.idCandidato - b.idCandidato
    )

export const buildSelectionPayload = (
  payload: SelectionPayload
): SelectionPayload => ({
  votoEnBlanco: payload.votoEnBlanco === true,
  votoNulo: payload.votoNulo === true,
  selecciones: normalizeSelecciones(payload.selecciones),
})

/**
 * Canonical hash of the ballot selection used inside the EIP-712 Vote struct.
 * Must match BallotContract EIP-712 tests (JSON.stringify of normalized payload).
 */
export const computeSelectionHash = (
  payload: SelectionPayload
): `0x${string}` => {
  const normalized = buildSelectionPayload(payload)
  return keccak256(toBytes(JSON.stringify(normalized)))
}
