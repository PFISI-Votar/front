import { useQuery } from '@tanstack/react-query'
import {
  leerVoterState,
  type VoterStateOnChain,
} from '@/features/voto/crypto/voter-state'

export const voterStateOnChainQueryKey = (
  idEleccion: number,
  nullifier: `0x${string}` | null,
  ballotContractAddress: `0x${string}` | undefined
) =>
  ['voter-state-onchain', idEleccion, nullifier, ballotContractAddress] as const

/**
 * VOTAR-325 — Estado de cooldown leído directamente del BallotContract.
 * Solo corre una vez se conoce el nullifier (billetera efímera lista) y la
 * address del BallotContract del comicio (resuelta por ElectionFactory en
 * el backend, no una constante fija por build).
 * Refetch cada 30s para reanclar el contador al reloj del nodo (UAT-02).
 */
export const useVoterStateOnChain = (
  idEleccion: number,
  nullifier: `0x${string}` | null,
  ballotContractAddress: `0x${string}` | undefined
) => {
  return useQuery<VoterStateOnChain, Error>({
    queryKey: voterStateOnChainQueryKey(
      idEleccion,
      nullifier,
      ballotContractAddress
    ),
    queryFn: () =>
      leerVoterState(
        idEleccion,
        nullifier as `0x${string}`,
        ballotContractAddress as `0x${string}`
      ),
    enabled: nullifier !== null && ballotContractAddress !== undefined,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  })
}
