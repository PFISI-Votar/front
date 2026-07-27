import { useQuery } from '@tanstack/react-query'
import {
  leerVoterState,
  type VoterStateOnChain,
} from '@/features/voto/crypto/voter-state'

export const voterStateOnChainQueryKey = (
  idEleccion: number,
  nullifier: `0x${string}` | null
) => ['voter-state-onchain', idEleccion, nullifier] as const

/**
 * VOTAR-325 — Estado de cooldown leído directamente del BallotContract.
 * Solo corre una vez se conoce el nullifier (billetera efímera lista).
 * Refetch cada 30s para reanclar el contador al reloj del nodo (UAT-02).
 */
export const useVoterStateOnChain = (
  idEleccion: number,
  nullifier: `0x${string}` | null
) => {
  return useQuery<VoterStateOnChain, Error>({
    queryKey: voterStateOnChainQueryKey(idEleccion, nullifier),
    queryFn: () => leerVoterState(idEleccion, nullifier as `0x${string}`),
    enabled: nullifier !== null,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  })
}
