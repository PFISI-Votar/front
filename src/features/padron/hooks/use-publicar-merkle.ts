import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { runBackgroundOperation } from '@/lib/run-background-operation'
import { publicarMerkleOnChain } from '../api/padron-api'

export const usePublicarMerkle = (idEleccion: number) => {
  const queryClient = useQueryClient()
  const [isRunning, setIsRunning] = useState(false)
  const isRunningRef = useRef(false)

  const invalidatePadron = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['padron-merkle', idEleccion] })
    queryClient.invalidateQueries({ queryKey: ['padron-resumen', idEleccion] })
    queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
    queryClient.invalidateQueries({ queryKey: ['elecciones'] })
  }, [idEleccion, queryClient])

  const runInBackground = useCallback(() => {
    if (isRunningRef.current) {
      return
    }

    isRunningRef.current = true
    setIsRunning(true)

    runBackgroundOperation({
      loadingMessage: 'Publicando raíz Merkle on-chain...',
      successMessage: 'Raíz Merkle publicada on-chain correctamente.',
      errorTitle: 'No se pudo publicar la raíz on-chain',
      operation: () => publicarMerkleOnChain(idEleccion),
      onSuccess: (resultado) => {
        invalidatePadron()
        if (resultado.explorerUrl) {
          toast.message('Transacción confirmada en Sepolia', {
            description: 'Verifique el evento RootPublished en el explorador.',
            action: {
              label: 'Abrir Etherscan',
              onClick: () =>
                window.open(resultado.explorerUrl, '_blank', 'noopener'),
            },
          })
        }
      },
      onSettled: () => {
        isRunningRef.current = false
        setIsRunning(false)
      },
    })
  }, [idEleccion, invalidatePadron])

  return { runInBackground, isRunning }
}
