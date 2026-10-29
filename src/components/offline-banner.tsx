import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'

/**
 * VOTAR-519: aviso global cuando el dispositivo pierde la conexión. Mientras
 * está visible, las pantallas conservan el último dato cargado en lugar de
 * reemplazarlo por un error.
 */
export const OfflineBanner = () => {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      role='alert'
      className='fixed inset-x-0 bottom-0 z-[100] flex items-center justify-center gap-2 bg-[#202124] px-4 py-3 text-sm font-medium text-white shadow-lg'
    >
      <WifiOff className='size-4 shrink-0' aria-hidden='true' />
      <span>
        Sin conexión a internet. Los datos mostrados pueden estar
        desactualizados; se actualizarán al reconectar.
      </span>
    </div>
  )
}
