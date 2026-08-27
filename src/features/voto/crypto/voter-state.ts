import { BALLOT_CONTRACT_ABI } from '@/features/voto/crypto/ballot-abi'
import { createVotePublicClient } from '@/features/voto/crypto/rpc-client'
import { toBytes32 } from '@/features/voto/crypto/vote-transmitter'

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
      args: [BigInt(idEleccion), toBytes32(nullifier)],
    })

  return {
    votesUsed: Number(votesUsed),
    lastVoteAt: Number(lastVoteAt),
    cooldownRemaining: Number(cooldownRemaining),
    blockTimestamp: Number(blockTimestamp),
  }
}

/**
 * VOTAR-451 — True when this padron leaf already cast on-chain (any nullifier).
 * Used to short-circuit a retransmit after ephemeral key rotation (tab close).
 */
export const leerHasVoted = async (
  idEleccion: number,
  voterLeaf: `0x${string}`,
  ballotContractAddress: `0x${string}`
): Promise<boolean> => {
  const client = createVotePublicClient()
  return client.readContract({
    address: ballotContractAddress,
    abi: BALLOT_CONTRACT_ABI,
    functionName: 'hasVoted',
    args: [BigInt(idEleccion), toBytes32(voterLeaf)],
  })
}

/**
 * VOTAR-451 — True when this session nullifier already has signed votes on-chain.
 */
export const leerIsNullifierUsed = async (
  idEleccion: number,
  nullifier: `0x${string}`,
  ballotContractAddress: `0x${string}`
): Promise<boolean> => {
  const client = createVotePublicClient()
  return client.readContract({
    address: ballotContractAddress,
    abi: BALLOT_CONTRACT_ABI,
    functionName: 'isNullifierUsed',
    args: [BigInt(idEleccion), toBytes32(nullifier)],
  })
}
