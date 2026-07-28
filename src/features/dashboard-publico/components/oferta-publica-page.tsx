import { useEffect } from 'react'
import { isAxiosError } from 'axios'
import { Vote } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardPublicoHeader } from '@/features/dashboard-publico/components/dashboard-publico-header'
import {
  DashboardPublicoErrorPanel,
  DashboardPublicoShell,
} from '@/features/dashboard-publico/components/dashboard-publico-shell'
import { OfertaPublicaCatalog } from '@/features/dashboard-publico/components/oferta-publica-catalog'
import {
  isDashboardFrozen,
  useDashboardPublicoComicio,
} from '@/features/dashboard-publico/hooks/use-dashboard-publico-comicio'
import { useOfertaPublica } from '@/features/dashboard-publico/hooks/use-oferta-publica'

type OfertaPublicaPageProps = {
  idEleccion: number
}

export const OfertaPublicaPage = ({ idEleccion }: OfertaPublicaPageProps) => {
  const comicioQuery = useDashboardPublicoComicio(idEleccion)
  const ofertaQuery = useOfertaPublica(idEleccion)

  useEffect(() => {
    const previousTitle = document.title
    const nombre = comicioQuery.data?.nombre
    document.title = nombre
      ? `VOTAR - Oferta electoral · ${nombre}`
      : 'VOTAR - Oferta electoral'
    return () => {
      document.title = previousTitle
    }
  }, [comicioQuery.data?.nombre])

  if (!Number.isFinite(idEleccion) || idEleccion <= 0) {
    return (
      <DashboardPublicoShell idEleccion={0} activeSection='oferta'>
        <DashboardPublicoErrorPanel
          title='Identificador de comicio inválido'
          description='La dirección no corresponde a un comicio válido.'
        />
      </DashboardPublicoShell>
    )
  }

  if (comicioQuery.isLoading) {
    return (
      <DashboardPublicoShell idEleccion={idEleccion} activeSection='oferta'>
        <header className='mb-8 space-y-3'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-9 w-72 max-w-full' />
          <Skeleton className='h-6 w-24 rounded-full' />
        </header>
        <Skeleton className='h-48 w-full rounded-2xl' />
      </DashboardPublicoShell>
    )
  }

  if (comicioQuery.isError || !comicioQuery.data) {
    return (
      <DashboardPublicoShell idEleccion={idEleccion} activeSection='oferta'>
        <DashboardPublicoErrorPanel
          title='Comicio no encontrado'
          description='No existe un comicio público con este identificador, o aún no fue configurado.'
        />
      </DashboardPublicoShell>
    )
  }

  const { nombre, estado } = comicioQuery.data
  const isFrozen = isDashboardFrozen(comicioQuery.data)
  const isOfertaNotFound =
    ofertaQuery.isError &&
    isAxiosError(ofertaQuery.error) &&
    ofertaQuery.error.response?.status === 404

  return (
    <DashboardPublicoShell idEleccion={idEleccion} activeSection='oferta'>
      <DashboardPublicoHeader
        nombre={nombre}
        estado={estado}
        isFrozen={isFrozen}
        description='Catálogo público de listas y candidatos oficializados. Acceso libre sin iniciar sesión.'
      />

      <section aria-labelledby='oferta-publica-heading' className='space-y-4'>
        <div className='flex items-center gap-2'>
          <Vote className='size-4 text-[#2f6f9f]' aria-hidden='true' />
          <h2
            id='oferta-publica-heading'
            className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'
          >
            Oferta electoral
          </h2>
        </div>

        {ofertaQuery.isLoading ? (
          <div className='space-y-4' aria-busy='true' aria-live='polite'>
            <Skeleton className='h-32 w-full rounded-2xl' />
            <Skeleton className='h-32 w-full rounded-2xl' />
            <p className='sr-only'>Cargando oferta electoral…</p>
          </div>
        ) : null}

        {isOfertaNotFound ? (
          <DashboardPublicoErrorPanel
            title='Oferta aún no oficializada'
            description='La oferta electoral aún no fue oficializada. Vuelva a consultar cuando la autoridad electoral publique las listas.'
          />
        ) : null}

        {ofertaQuery.isError && !isOfertaNotFound ? (
          <DashboardPublicoErrorPanel
            title='No se pudo cargar la oferta'
            description='Ocurrió un error al consultar el catálogo de listas y candidatos. Intente nuevamente más tarde.'
          />
        ) : null}

        {ofertaQuery.data ? (
          <OfertaPublicaCatalog oferta={ofertaQuery.data} />
        ) : null}
      </section>
    </DashboardPublicoShell>
  )
}
