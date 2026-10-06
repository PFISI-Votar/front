import { Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { GanadoresGrupo } from '@/features/dashboard-publico/lib/escrutinio-chart-data'

type EscrutinioGanadoresDialogProps = {
  grupos: GanadoresGrupo[]
}

export const EscrutinioGanadoresDialog = ({
  grupos,
}: EscrutinioGanadoresDialogProps) => {
  const hasEntries = grupos.some((grupo) => grupo.entradas.length > 0)
  if (!hasEntries) {
    return null
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='gap-1.5 border-[#c5d8e8] text-[#2f6f9f] hover:bg-[#eef5fa]'
        >
          <Trophy className='size-3.5' aria-hidden='true' />
          Ver ganadores
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Resultados destacados</DialogTitle>
          <DialogDescription>
            Ordenados por cantidad de votos. Los porcentajes se calculan sobre
            la base válida de cada grupo.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-6'>
          {grupos.map((grupo) => (
            <section
              key={grupo.titulo}
              aria-labelledby={`ganadores-${grupo.titulo}`}
            >
              <h3
                id={`ganadores-${grupo.titulo}`}
                className='mb-2 text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'
              >
                {grupo.titulo}
              </h3>
              {grupo.entradas.length === 0 ? (
                <p className='text-sm text-[#5f6368]'>Sin votos registrados.</p>
              ) : (
                <ol className='space-y-2'>
                  {grupo.entradas.map((entrada) => (
                    <li
                      key={`${grupo.titulo}-${entrada.puesto}-${entrada.label}`}
                      className='flex items-center gap-3 rounded-xl border border-[#e4e7eb] bg-[#f8fafc] px-3 py-2.5'
                    >
                      <span
                        className='flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white'
                        style={{ backgroundColor: entrada.fill }}
                        aria-hidden='true'
                      >
                        {entrada.puesto}
                      </span>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate font-medium text-[#202124]'>
                          {entrada.label}
                        </p>
                        {entrada.sublabel ? (
                          <p className='truncate text-xs text-[#5f6368]'>
                            {entrada.sublabel}
                          </p>
                        ) : null}
                      </div>
                      <div className='shrink-0 text-end'>
                        <p className='text-sm font-semibold text-[#202124] tabular-nums'>
                          {entrada.porcentaje.toLocaleString('es-AR')}%
                        </p>
                        <p className='text-xs text-[#5f6368] tabular-nums'>
                          {entrada.votos.toLocaleString('es-AR')} votos
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
