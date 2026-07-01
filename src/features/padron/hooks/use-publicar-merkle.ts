import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import { publicarMerkleOnChain } from '../api/padron-api'

export const usePublicarMerkle = (idEleccion: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => publicarMerkleOnChain(idEleccion),
    onSuccess: (resultado) => {
      toast.success('Raíz Merkle publicada on-chain correctamente.')
      queryClient.invalidateQueries({ queryKey: ['padron-merkle', idEleccion] })
      queryClient.invalidateQueries({ queryKey: ['padron-resumen', idEleccion] })
      if (resultado.explorerUrl) {
        toast.message('Transacción confirmada en Sepolia', {
          description: 'Verifique el evento RootPublished en el explorador.',
          action: {
            label: 'Abrir Etherscan',
            onClick: () => window.open(resultado.explorerUrl, '_blank', 'noopener'),
          },
        })
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
