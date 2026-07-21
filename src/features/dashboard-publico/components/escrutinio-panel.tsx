import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { BarChart3, Info } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EscrutinioBarChart } from '@/features/dashboard-publico/components/escrutinio-bar-chart'
import { EscrutinioDonutChart } from '@/features/dashboard-publico/components/escrutinio-donut-chart'
import { EscrutinioFrozenBanner } from '@/features/dashboard-publico/components/escrutinio-frozen-banner'
import { ParticipacionStatsCards } from '@/features/dashboard-publico/components/participacion-stats-cards'
import { useDashboardResultadosWebSocket } from '@/features/dashboard-publico/hooks/use-dashboard-resultados-websocket'
import { useEscrutinio } from '@/features/dashboard-publico/hooks/use-escrutinio'
import {
  formatRelativeUpdate,
  toBarChartData,
  toDonutChartData,
} from '@/features/dashboard-publico/lib/escrutinio-chart-data'

type EscrutinioPanelProps = {
  idEleccion: number
  /** When false, only stats + mini bar chart (resumen embed). */
  fullCharts?: boolean
  /** Gate WS + queries when comicio metadata is not ready yet. */
  enabled?: boolean
  /** Comicio estado from BUD config — used for pre-open messaging. */
  estadoComicio?: string
}

export const EscrutinioPanel = ({
  idEleccion,
  fullCharts = true,
  enabled = true,
  estadoComicio,
}: EscrutinioPanelProps) => {
  const isPreOpen =
    estadoComicio === 'BORRADOR' || estadoComicio === 'CONFIGURADA'
  const queryEnabled = enabled && !isPreOpen
  const escrutinioQuery = useEscrutinio(idEleccion, queryEnabled)
  useDashboardResultadosWebSocket(
    idEleccion,
    queryEnabled && !escrutinioQuery.data?.congelado
  )
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!escrutinioQuery.data || escrutinioQuery.data.congelado) return
    const id = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(id)
  }, [escrutinioQuery.data])

  if (isPreOpen) {
    return (
      <div
        className='rounded-2xl border border-[#e4e7eb] bg-white/95 px-6 py-8 text-sm text-[#5f6368] shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]'
        role='status'
      >
        El escrutinio estará disponible cuando el comicio esté abierto.
      </div>
    )
  }

  if (escrutinioQuery.isLoading) {
    return (
      <div className='space-y-4' aria-busy='true' aria-live='polite'>
        <Skeleton className='h-28 w-full rounded-2xl' />
        <Skeleton className='h-64 w-full rounded-2xl' />
        <p className='sr-only'>Cargando resultados del escrutinio…</p>
      </div>
    )
  }

  if (escrutinioQuery.isError) {
    const status = isAxiosError(escrutinioQuery.error)
      ? escrutinioQuery.error.response?.status
      : undefined
    const title =
      status === 503
        ? 'Resultados on-chain no disponibles'
        : status === 422
          ? 'Escrutinio aún no disponible'
          : 'No se pudieron cargar los resultados'
    const description =
      status === 503
        ? 'El contrato AuditView no está configurado o el nodo RPC no responde. Reintentá más tarde.'
        : 'Hubo un problema al consultar el snapshot de resultados. Podés reintentar en unos segundos.'
    return (
      <div
        className='rounded-2xl border border-amber-200/80 bg-amber-50/50 px-6 py-6 shadow-[0_1rem_3rem_rgba(30,64,95,0.06)]'
        role='alert'
      >
        <div className='flex items-start gap-3'>
          <Info className='mt-0.5 size-5 text-amber-800' aria-hidden='true' />
          <div>
            <p className='font-semibold text-[#202124]'>{title}</p>
            <p className='mt-1 text-sm text-[#5f6368]'>{description}</p>
          </div>
        </div>
      </div>
    )
  }

  const data = escrutinioQuery.data
  if (!data) return null

  const barData = toBarChartData(data)
  const donutData = toDonutChartData(data)
  const hasVotes = data.participacion.totalVotos > 0

  return (
    <div className='space-y-6'>
      {data.congelado && (
        <EscrutinioFrozenBanner
          resultadosDefinitivos={
            data.estado === 'CERRADA' || data.estado === 'ESCRUTADA'
          }
        />
      )}

      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <BarChart3 className='size-4 text-[#2f6f9f]' aria-hidden='true' />
          <h2 className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'>
            Escrutinio provisional
          </h2>
        </div>
        <p className='text-xs text-[#80868b]' aria-live='polite'>
          Actualizado {formatRelativeUpdate(data.actualizadoEn, now)}
          {!data.congelado && ' · en vivo'}
        </p>
      </div>

      <ParticipacionStatsCards
        participacion={data.participacion}
        compact={!fullCharts}
      />

      {!hasVotes ? (
        <div
          className='rounded-2xl border border-dashed border-[#e4e7eb] bg-white/80 px-6 py-10 text-center text-sm text-[#5f6368]'
          role='status'
        >
          Aún no hay sufragios registrados on-chain para este comicio.
        </div>
      ) : (
        <>
          <EscrutinioBarChart data={barData} height={fullCharts ? 320 : 240} />
          {fullCharts && <EscrutinioDonutChart data={donutData} />}
          <p className='text-xs leading-relaxed text-[#80868b]'>
            Los tallies provienen de AuditView on-chain. En boletas multi-cargo,
            el registro proyecta un único candidateId de auditoría por sufragio.
          </p>
        </>
      )}
    </div>
  )
}
