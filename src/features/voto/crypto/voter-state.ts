import { BALLOT_CONTRACT_ABI } from '@/features/voto/crypto/ballot-abi'
import { createVotePublicClient } from '@/features/voto/crypto/rpc-client'

export type VoterStateOnChain = {
  votesUsed: number
  lastVoteAt: number
  /** Segundos restantes de cooldown según el reloj del nodo (0 = desbloqueado). */
  cooldownRemaining: number
  /** `block.timestamp` visto por esta lectura — ancla para el contador de la BUD (UAT-02). */
  blockTimestamp: number
}

/**
 * VOTAR-325 — Lee el estado de cooldown de un nullifier directamente del
 * BallotContract. Es la fuente de verdad del contador de la BUD: se basa en
 * el reloj del nodo, así que no puede ser burlado adelantando el reloj del
 * sistema operativo del cliente (UAT-02).
 */
export const leerVoterState = async (
  idEleccion: number,
  nullifier: `0x${string}`,
  ballotContractAddress: `0x${string}`
): Promise<VoterStateOnChain> => {
  const client = createVotePublicClient()
  const [votesUsed, lastVoteAt, cooldownRemaining, blockTimestamp] =
    await client.readContract({
      address: ballotContractAddress,
      abi: BALLOT_CONTRACT_ABI,
      functionName: 'getVoterState',
      args: [BigInt(idEleccion), nullifier],
    })

  return {
    votesUsed: Number(votesUsed),
    lastVoteAt: Number(lastVoteAt),
    cooldownRemaining: Number(cooldownRemaining),
    blockTimestamp: Number(blockTimestamp),
  }
}
