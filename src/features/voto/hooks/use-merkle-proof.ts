import { useMutation } from '@tanstack/react-query'
import { solicitarMerkleProof } from '@/features/voto/api/voto-api'
import type { VoterMerkleProof } from '@/features/voto/data/schema'

export const useSolicitarMerkleProof = (idEleccion: number) => {
  return useMutation<VoterMerkleProof, Error>({
    mutationFn: () => solicitarMerkleProof(idEleccion),
  })
}
