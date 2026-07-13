import { maxUint256 } from 'viem'
import type { SelectionPayload } from '@/features/voto/crypto/selection-hash'

/**
 * Reserved candidate ids matching VoteRegistry.sol (VOTAR-346 / VOTAR-345).
 * `uint256.max - 1` (blanco) and `uint256.max` (nulo).
 */
export const VOTO_BLANCO = maxUint256 - 1n
export const VOTO_NULO = maxUint256

/**
 * Maps a BUD selection payload to the on-chain audit `candidateId` for VoteCast.
 *
 * Blank/null use reserved ids; partisan votes use the first category-sorted
 * selection. **Limitation (VOTAR-346 / VoteRegistry):** the registry stores a
 * single `candidateId` per anonymous `voterHash`, so multi-category ballots are
 * projected to one audit id. `VoteCast` / `getTally` are therefore not a full
 * multi-cargo escrutinio until a per-category on-chain model exists.
 */
export const resolveAuditCandidateId = (payload: SelectionPayload): bigint => {
  if (payload.votoEnBlanco === true) {
    return VOTO_BLANCO
  }
  if (payload.votoNulo === true) {
    return VOTO_NULO
  }
  const first = [...payload.selecciones].sort(
    (a, b) => a.idCategoria - b.idCategoria || a.idCandidato - b.idCandidato
  )[0]
  if (!first) {
    throw new Error('Selection payload has no candidate and is not blank/null')
  }
  return BigInt(first.idCandidato)
}
