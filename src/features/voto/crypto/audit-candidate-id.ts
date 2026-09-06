import { maxUint256 } from 'viem'
import type { SelectionPayload } from '@/features/voto/crypto/selection-hash'

/**
 * Reserved candidate ids matching VoteRegistry.sol (VOTAR-346 / VOTAR-345).
 * `uint256.max - 1` (blanco) and `uint256.max` (nulo).
 */
export const VOTO_BLANCO = maxUint256 - 1n
export const VOTO_NULO = maxUint256

/**
 * Maps a BUD selection payload to on-chain audit `candidateIds` (VOTAR-474).
 *
 * Blank/null use a single reserved id; partisan votes include every category
 * selection (sorted by `idCategoria` / `idCandidato`) so VoteRegistry tallies
 * each cargo — not just the first.
 */
export const resolveAuditCandidateIds = (
  payload: SelectionPayload
): bigint[] => {
  if (payload.votoEnBlanco === true) {
    return [VOTO_BLANCO]
  }
  if (payload.votoNulo === true) {
    return [VOTO_NULO]
  }
  const sorted = [...payload.selecciones].sort(
    (a, b) => a.idCategoria - b.idCategoria || a.idCandidato - b.idCandidato
  )
  if (sorted.length === 0) {
    throw new Error('Selection payload has no candidate and is not blank/null')
  }
  return sorted.map((selection) => BigInt(selection.idCandidato))
}

/**
 * @deprecated Prefer {@link resolveAuditCandidateIds}. Returns the first id only.
 */
export const resolveAuditCandidateId = (payload: SelectionPayload): bigint =>
  resolveAuditCandidateIds(payload)[0]!
