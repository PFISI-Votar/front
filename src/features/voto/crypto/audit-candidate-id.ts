import type { SelectionPayload } from '@/features/voto/crypto/selection-hash'

/**
 * Reserved candidate ids matching VoteRegistry.sol (VOTAR-346 / VOTAR-345).
 * uint256.max - 1 and uint256.max respectively.
 */
export const VOTO_BLANCO =
  115792089237316195423570985008687907853269984665640564039457584007913129639934n
export const VOTO_NULO =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n

/**
 * Maps a BUD selection payload to the on-chain audit `candidateId` for VoteCast.
 * Blank/null use reserved ids; partisan votes use the first sorted selection.
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
