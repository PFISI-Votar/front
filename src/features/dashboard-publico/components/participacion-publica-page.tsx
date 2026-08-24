import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { BarChart3, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CurvaTemporalChart } from '@/features/dashboard-publico/components/curva-temporal-chart'
import { DashboardPublicoHeader } from '@/features/dashboard-publico/components/dashboard-publico-header'
import {
  DashboardPublicoErrorPanel,
  DashboardPublicoShell,
} from '@/features/dashboard-publico/components/dashboard-publico-shell'
import { DesgloseCategoriaPanel } from '@/features/dashboard-publico/components/desglose-categoria-panel'
import { FormulaTransparentePanel } from '@/features/dashboard-publico/components/formula-transparente-panel'
import { ParticipacionHeroCard } from '@/features/dashboard-publico/components/participacion-hero-card'
import {
  isDashboardFrozen,
  useDashboardPublicoComicio,
} from '@/features/dashboard-publico/hooks/use-dashboard-publico-comicio'
import { useParticipacionPublica } from '@/features/dashboard-publico/hooks/use-participacion-publica'
import { exportParticipacionPng } from '@/features/dashboard-publico/lib/participacion-export/export-participacion-png'

type ParticipacionPublicaPageProps = {
  idEleccion: number
}

const formatFechaExportacion = (fecha: Date): string =>
  fecha.toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })

export const ParticipacionPublicaPage = ({
  idEleccion,
}: ParticipacionPublicaPageProps) => {
  const comicioQuery = useDashboardPublicoComicio(idEleccion)
  const isFrozen = comicioQuery.data
    ? isDashboardFrozen(comicioQuery.data)
    : false
  const participacionQuery = useParticipacionPublica(idEleccion, { isFrozen })

  const chartRef = useRef<HTMLDivElement>(null)
  const [isExportingPng, setIsExportingPng] = useState(false)
  const [fechaContexto] = useState(() => formatFechaExportacion(new Date()))

  const handleExportPng = async (): Promise<void> => {
    if (!chartRef.current || !comicioQuery.data || isExportingPng) {
      return
    }
    setIsExportingPng(true)
    try {
      await exportParticipacionPng({
        node: chartRef.current,
        idEleccion,
        nombreComicio: comicioQuery.data.nombre,
      })
    } catch {
      toast.error(
        'No se pudo generar la imagen PNG de la curva de participación.'
      )
    } finally {
      setIsExportingPng(false)
    }
  }

  if (!Number.isFinite(idEleccion) || idEleccion <= 0) {
    return (
      <DashboardPublicoShell idEleccion={0} activeSection='participacion'>
        <DashboardPublicoErrorPanel
          title='Identificador de comicio inválido'
          description='La dirección no corresponde a un comicio válido.'
        />
      </DashboardPublicoShell>
    )
  }

  if (comicioQuery.isLoading || participacionQuery.isLoading) {
    return (
      <DashboardPublicoShell
        idEleccion={idEleccion}
        activeSection='participacion'
      >
        <header className='mb-8 space-y-3'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-9 w-72 max-w-full' />
          <Skeleton className='h-6 w-24 rounded-full' />
        </header>
        <div className='space-y-4'>
          <Skeleton className='h-48 w-full rounded-2xl' />
          <Skeleton className='h-64 w-full rounded-2xl' />
        </div>
      </DashboardPublicoShell>
    )
  }

  if (comicioQuery.isError || !comicioQuery.data) {
    return (
      <DashboardPublicoShell
        idEleccion={idEleccion}
        activeSection='participacion'
      >
        <DashboardPublicoErrorPanel
          title='Comicio no encontrado'
          description='No existe un comicio público con este identificador, o aún no fue configurado.'
        />
      </DashboardPublicoShell>
    )
  }

  if (participacionQuery.isError || !participacionQuery.data) {
    const status = isAxiosError(participacionQuery.error)
      ? participacionQuery.error.response?.status
      : undefined
    const description =
      status === 422
        ? 'El comicio aún no tiene contratos electorales desplegados on-chain para consultar métricas.'
        : status === 503
          ? 'La consulta on-chain no está disponible en este momento. Reintentá más tarde.'
          : 'No se pudieron cargar las métricas de participación. Verificá que el padrón esté consolidado y los contratos desplegados.'

    return (
      <DashboardPublicoShell
        idEleccion={idEleccion}
        activeSection='participacion'
      >
        <DashboardPublicoHeader
          nombre={comicioQuery.data.nombre}
          estado={comicioQuery.data.estado}
          isFrozen={isFrozen}
          description='Analíticas públicas de afluencia electoral.'
        />
        <DashboardPublicoErrorPanel
          title='Métricas no disponibles'
          description={description}
        />
      </DashboardPublicoShell>
    )
  }

  const data = participacionQuery.data

  return (
    <DashboardPublicoShell
      idEleccion={idEleccion}
      activeSection='participacion'
    >
      <DashboardPublicoHeader
        nombre={comicioQuery.data.nombre}
        estado={comicioQuery.data.estado}
        isFrozen={isFrozen || data.snapshotCongelado}
        description={
          isFrozen || data.snapshotCongelado
            ? 'Snapshot congelado: las métricas reflejan el estado on-chain al cierre del comicio.'
            : 'Analíticas públicas sin autenticación. El porcentaje, la curva temporal y el desglose se actualizan periódicamente.'
        }
      />

      <section
        aria-labelledby='participacion-analytics-heading'
        className='space-y-6'
      >
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <BarChart3 className='size-4 text-[#2f6f9f]' aria-hidden='true' />
            <h2
              id='participacion-analytics-heading'
              className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'
            >
              Analíticas de participación
            </h2>
          </div>
        </div>

        <ParticipacionHeroCard
          porcentajeParticipacion={data.formula.porcentajeParticipacion}
          totalSufragios={data.formula.totalSufragios}
          totalPadron={data.formula.totalPadron}
        />
        <FormulaTransparentePanel
          formula={data.formula}
          permitirVotoNulo={data.permitirVotoNulo ?? true}
        />

        <div className='space-y-2'>
          <div className='flex justify-end'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={isExportingPng}
              aria-busy={isExportingPng}
              aria-label='Descargar curva de participación en PNG'
              onClick={() => void handleExportPng()}
              className='rounded-xl border-[#c5d8e8] bg-white/95 text-[#2f6f9f] shadow-sm hover:bg-[#2f6f9f]/5'
            >
              {isExportingPng ? (
                <Loader2 className='size-4 animate-spin' aria-hidden='true' />
              ) : (
                <Download className='size-4' aria-hidden='true' />
              )}
              Descargar PNG
            </Button>
          </div>
          <CurvaTemporalChart
            ref={chartRef}
            serieTemporal={data.serieTemporal}
            nombreComicio={comicioQuery.data.nombre}
            fecha={fechaContexto}
          />
        </div>

        <DesgloseCategoriaPanel
          desglosePorCategoria={data.desglosePorCategoria}
          verificacionTotales={data.verificacionTotales}
          permitirVotoNulo={data.permitirVotoNulo ?? true}
        />
        <p className='text-xs text-[#80868b]'>Fuente: {data.fuenteDatos}</p>
      </section>
    </DashboardPublicoShell>
  )
}
