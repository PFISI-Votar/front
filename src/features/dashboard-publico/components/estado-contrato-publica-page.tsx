import { isAxiosError } from 'axios'
import { ShieldCheck } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ContratoEstadoTecnicoPanel } from '@/features/dashboard-publico/components/contrato-estado-tecnico-panel'
import { DashboardPublicoHeader } from '@/features/dashboard-publico/components/dashboard-publico-header'
import {
  DashboardPublicoErrorPanel,
  DashboardPublicoShell,
} from '@/features/dashboard-publico/components/dashboard-publico-shell'
import { EstadoComicioCard } from '@/features/dashboard-publico/components/estado-comicio-card'
import { useContratoEstadoPublica } from '@/features/dashboard-publico/hooks/use-contrato-estado-publica'
import {
  isDashboardFrozen,
  useDashboardPublicoComicio,
} from '@/features/dashboard-publico/hooks/use-dashboard-publico-comicio'

type EstadoContratoPublicaPageProps = {
  idEleccion: number
}

export const EstadoContratoPublicaPage = ({
  idEleccion,
}: EstadoContratoPublicaPageProps) => {
  const comicioQuery = useDashboardPublicoComicio(idEleccion)
  const isFrozen = comicioQuery.data
    ? isDashboardFrozen(comicioQuery.data)
    : false
  const contratoQuery = useContratoEstadoPublica(idEleccion, { isFrozen })

  if (!Number.isFinite(idEleccion) || idEleccion <= 0) {
    return (
      <DashboardPublicoShell idEleccion={0} activeSection='estado'>
        <DashboardPublicoErrorPanel
          title='Identificador de comicio inválido'
          description='La dirección no corresponde a un comicio válido.'
        />
      </DashboardPublicoShell>
    )
  }

  if (comicioQuery.isLoading || contratoQuery.isLoading) {
    return (
      <DashboardPublicoShell idEleccion={idEleccion} activeSection='estado'>
        <header className='mb-8 space-y-3'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-9 w-72 max-w-full' />
          <Skeleton className='h-6 w-24 rounded-full' />
        </header>
        <div className='space-y-4'>
          <Skeleton className='h-32 w-full rounded-2xl' />
          <Skeleton className='h-64 w-full rounded-2xl' />
        </div>
      </DashboardPublicoShell>
    )
  }

  if (comicioQuery.isError || !comicioQuery.data) {
    return (
      <DashboardPublicoShell idEleccion={idEleccion} activeSection='estado'>
        <DashboardPublicoErrorPanel
          title='Comicio no encontrado'
          description='No existe un comicio público con este identificador, o aún no fue configurado.'
        />
      </DashboardPublicoShell>
    )
  }

  const { nombre, estado, tipoVotacion } = comicioQuery.data

  if (contratoQuery.isError || !contratoQuery.data) {
    const status = isAxiosError(contratoQuery.error)
      ? contratoQuery.error.response?.status
      : undefined
    const description =
      status === 422
        ? 'El comicio aún no tiene contratos electorales desplegados on-chain para consultar metadatos.'
        : status === 503
          ? 'La consulta on-chain no está disponible en este momento. Reintentá más tarde.'
          : 'No se pudieron cargar los metadatos técnicos del contrato. Verificá que los contratos estén desplegados.'

    return (
      <DashboardPublicoShell idEleccion={idEleccion} activeSection='estado'>
        <DashboardPublicoHeader
          nombre={nombre}
          estado={estado}
          isFrozen={isFrozen}
          description='Auditoría pública de variables técnicas del contrato inteligente.'
        />
        <EstadoComicioCard
          estado={estado}
          isFrozen={isFrozen}
          tipoVotacion={tipoVotacion}
          className='mb-6'
        />
        <DashboardPublicoErrorPanel
          title='Metadatos on-chain no disponibles'
          description={description}
        />
      </DashboardPublicoShell>
    )
  }

  const data = contratoQuery.data

  return (
    <DashboardPublicoShell idEleccion={idEleccion} activeSection='estado'>
      <DashboardPublicoHeader
        nombre={nombre}
        estado={estado}
        isFrozen={isFrozen || data.snapshotCongelado}
        description={
          isFrozen || data.snapshotCongelado
            ? 'Snapshot congelado: la ficha técnica refleja el estado on-chain al cierre del comicio.'
            : 'Inspección pública de direcciones, estado operativo, raíz Merkle y límites de re-voto.'
        }
      />

      <section aria-labelledby='estado-auditoria-heading' className='space-y-6'>
        <div className='flex items-center gap-2'>
          <ShieldCheck className='size-4 text-[#2f6f9f]' aria-hidden='true' />
          <h2
            id='estado-auditoria-heading'
            className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'
          >
            Auditoría del contrato
          </h2>
        </div>

        <EstadoComicioCard
          estado={estado}
          isFrozen={isFrozen || data.snapshotCongelado}
          tipoVotacion={tipoVotacion}
        />
        <ContratoEstadoTecnicoPanel
          red={data.red}
          chainId={data.chainId}
          estadoOnChain={data.estadoOnChain}
          merkleRoot={data.merkleRoot}
          revoto={data.revoto}
          contratos={data.contratos}
          fuenteDatos={data.fuenteDatos}
        />
      </section>
    </DashboardPublicoShell>
  )
}
