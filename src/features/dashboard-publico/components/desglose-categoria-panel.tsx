import { CheckCircle2, AlertTriangle, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  DesgloseCategoria,
  ParticipacionPublica,
} from '@/features/dashboard-publico/api/participacion-publica-api'

type DesgloseCategoriaPanelProps = {
  desglosePorCategoria: DesgloseCategoria[]
  verificacionTotales: ParticipacionPublica['verificacionTotales']
  className?: string
  /** VOTAR-447: blank votes always shown; null votes only when enabled. */
  permitirVotoNulo?: boolean
}

export const DesgloseCategoriaPanel = ({
  desglosePorCategoria,
  verificacionTotales,
  className,
  permitirVotoNulo = true,
}: DesgloseCategoriaPanelProps) => (
  <Card
    className={cn(
      'gap-0 overflow-hidden rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]',
      className
    )}
  >
    <CardHeader className='space-y-3 px-6 pt-6 pb-2 sm:px-8'>
      <div className='flex items-start justify-between gap-3'>
        <div
          className='flex size-11 items-center justify-center rounded-xl bg-[#2f6f9f]/10 text-[#2f6f9f]'
          aria-hidden='true'
        >
          <ListOrdered className='size-5' />
        </div>
        <Badge
          variant='outline'
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            verificacionTotales.coherente
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          )}
        >
          {verificacionTotales.coherente ? (
            <span className='inline-flex items-center gap-1.5'>
              <CheckCircle2 className='size-3.5' aria-hidden='true' />
              Totales coherentes
            </span>
          ) : (
            <span className='inline-flex items-center gap-1.5'>
              <AlertTriangle className='size-3.5' aria-hidden='true' />
              Discrepancia detectada
            </span>
          )}
        </Badge>
      </div>
      <div className='space-y-1.5'>
        <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
          Participación detallada por categoría
        </CardTitle>
        <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
          Sumatoria de votos afirmativos por lista. Blanco
          {permitirVotoNulo ? ' y nulo se reportan' : ' se reporta'} como
          tallies globales on-chain (limitación VOTAR-346: un candidateId por
          nullifier).
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className='space-y-6 px-6 pb-6 sm:px-8'>
      {desglosePorCategoria.length === 0 ? (
        <p className='text-sm text-[#5f6368]'>
          No hay oferta oficializada disponible para el desglose.
        </p>
      ) : (
        desglosePorCategoria.map((categoria) => (
          <section
            key={categoria.idCategoria}
            aria-labelledby={`categoria-${categoria.idCategoria}-heading`}
            className='space-y-3'
          >
            <h3
              id={`categoria-${categoria.idCategoria}-heading`}
              className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'
            >
              {categoria.nombreCategoria}
            </h3>
            <div className='overflow-hidden rounded-xl border border-[#e4e7eb]'>
              <table className='w-full text-sm'>
                <caption className='sr-only'>
                  Votos por lista en {categoria.nombreCategoria}
                </caption>
                <thead className='bg-[#f8fafc] text-left text-[#5f6368]'>
                  <tr>
                    <th scope='col' className='px-4 py-2.5 font-medium'>
                      Lista
                    </th>
                    <th
                      scope='col'
                      className='px-4 py-2.5 text-right font-medium'
                    >
                      Votos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoria.listas.map((lista) => (
                    <tr
                      key={lista.idLista}
                      className='border-t border-[#e4e7eb]'
                    >
                      <td className='px-4 py-2.5 text-[#202124]'>
                        {lista.nombreLista}
                      </td>
                      <td className='px-4 py-2.5 text-right font-semibold text-[#202124] tabular-nums'>
                        {lista.votos.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                  <tr className='border-t border-[#e4e7eb] bg-[#f8fafc]'>
                    <td className='px-4 py-2.5 text-[#5f6368]'>
                      En blanco (global)
                    </td>
                    <td className='px-4 py-2.5 text-right text-[#5f6368] tabular-nums'>
                      {categoria.votosEnBlancoGlobales.toLocaleString('es-AR')}
                    </td>
                  </tr>
                  {permitirVotoNulo && (
                    <tr className='border-t border-[#e4e7eb] bg-[#f8fafc]'>
                      <td className='px-4 py-2.5 text-[#5f6368]'>
                        Nulos (global)
                      </td>
                      <td className='px-4 py-2.5 text-right text-[#5f6368] tabular-nums'>
                        {categoria.votosNulosGlobales.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
      <p className='text-xs text-[#80868b]'>
        Verificación: on-chain{' '}
        {verificacionTotales.totalOnChain.toLocaleString('es-AR')} · calculado{' '}
        {verificacionTotales.totalCalculado.toLocaleString('es-AR')}
      </p>
    </CardContent>
  </Card>
)
