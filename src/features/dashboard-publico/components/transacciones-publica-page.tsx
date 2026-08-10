import { isAxiosError } from 'axios'
import { Link2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardPublicoHeader } from '@/features/dashboard-publico/components/dashboard-publico-header'
import {
  DashboardPublicoErrorPanel,
  DashboardPublicoShell,
} from '@/features/dashboard-publico/components/dashboard-publico-shell'
import { TransaccionesBlockchainTable } from '@/features/dashboard-publico/components/transacciones-blockchain-table'
import {
  isDashboardFrozen,
  useDashboardPublicoComicio,
} from '@/features/dashboard-publico/hooks/use-dashboard-publico-comicio'
import { useTransaccionesPublica } from '@/features/dashboard-publico/hooks/use-transacciones-publica'

type TransaccionesPublicaPageProps = {
  idEleccion: number
}

export const TransaccionesPublicaPage = ({
  idEleccion,
}: TransaccionesPublicaPageProps) => {
  const comicioQuery = useDashboardPublicoComicio(idEleccion)
  const isFrozen = comicioQuery.data
    ? isDashboardFrozen(comicioQuery.data)
    : false
  const transaccionesQuery = useTransaccionesPublica(idEleccion, { isFrozen })

  if (!Number.isFinite(idEleccion) || idEleccion <= 0) {
    return (
      <DashboardPublicoShell idEleccion={0} activeSection='transacciones'>
        <DashboardPublicoErrorPanel
          title='Identificador de comicio inválido'
          description='La dirección no corresponde a un comicio válido.'
        />
      </DashboardPublicoShell>
    )
  }

  if (comicioQuery.isLoading || transaccionesQuery.isLoading) {
    return (
      <DashboardPublicoShell
        idEleccion={idEleccion}
        activeSection='transacciones'
      >
        <header className='mb-8 space-y-3'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-9 w-72 max-w-full' />
          <Skeleton className='h-6 w-24 rounded-full' />
        </header>
        <Skeleton className='h-64 w-full rounded-2xl' />
      </DashboardPublicoShell>
    )
  }

  if (comicioQuery.isError || !comicioQuery.data) {
    return (
      <DashboardPublicoShell
        idEleccion={idEleccion}
        activeSection='transacciones'
      >
        <DashboardPublicoErrorPanel
          title='Comicio no encontrado'
          description='No existe un comicio público con este identificador, o aún no fue configurado.'
        />
      </DashboardPublicoShell>
    )
  }

  const { nombre, estado } = comicioQuery.data

  if (transaccionesQuery.isError || !transaccionesQuery.data) {
    const status = isAxiosError(transaccionesQuery.error)
      ? transaccionesQuery.error.response?.status
      : undefined
    const description =
      status === 422
        ? 'El comicio aún no tiene contratos electorales desplegados on-chain para consultar transacciones.'
        : status === 503
          ? 'La consulta on-chain no está disponible en este momento. Reintentá más tarde.'
          : 'No se pudo cargar el historial de transacciones blockchain.'

    return (
      <DashboardPublicoShell
        idEleccion={idEleccion}
        activeSection='transacciones'
      >
        <DashboardPublicoHeader
          nombre={nombre}
          estado={estado}
          isFrozen={isFrozen}
          description='Auditoría pública del historial transaccional de la urna digital.'
        />
        <DashboardPublicoErrorPanel
          title='Historial on-chain no disponible'
          description={description}
        />
      </DashboardPublicoShell>
    )
  }

  const data = transaccionesQuery.data

  return (
    <DashboardPublicoShell
      idEleccion={idEleccion}
      activeSection='transacciones'
    >
      <DashboardPublicoHeader
        nombre={nombre}
        estado={estado}
        isFrozen={isFrozen || data.snapshotCongelado}
        description={
          isFrozen || data.snapshotCongelado
            ? 'Snapshot congelado: el historial refleja las transacciones registradas al cierre del comicio.'
            : 'Listado de transacciones on-chain, de más recientes a más antiguas.'
        }
      />

      <section
        aria-labelledby='transacciones-blockchain-heading'
        className='space-y-4'
      >
        <div className='flex items-center gap-2'>
          <Link2 className='size-4 text-[#2f6f9f]' aria-hidden='true' />
          <h2
            id='transacciones-blockchain-heading'
            className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'
          >
            Transacciones de la Urna Digital
          </h2>
        </div>
        <p className='text-sm text-[#5f6368]'>
          Cada fila enlaza a {data.red} (chainId {data.chainId}) para cotejar
          bloque, contrato y eventos con el explorador externo.
        </p>
        <TransaccionesBlockchainTable
          transacciones={data.transacciones}
          red={data.red}
        />
        <p className='text-xs text-[#80868b]'>Fuente: {data.fuenteDatos}</p>
      </section>
    </DashboardPublicoShell>
  )
}
