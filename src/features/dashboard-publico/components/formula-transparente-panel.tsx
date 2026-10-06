import { Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { FormulaParticipacion } from '@/features/dashboard-publico/api/participacion-publica-api'

type FormulaTransparentePanelProps = {
  formula: FormulaParticipacion
  className?: string
  /** VOTAR-447: blank votes always shown; null votes only when enabled. */
  permitirVotoNulo?: boolean
}

const Operand = ({ label, value }: { label: string; value: number }) => (
  <div className='rounded-xl border border-[#e4e7eb] bg-[#f8fafc] px-3 py-3'>
    <p className='text-xs font-medium tracking-wide text-[#80868b] uppercase'>
      {label}
    </p>
    <p className='mt-1 text-xl font-bold text-[#202124] tabular-nums'>
      {value.toLocaleString('es-AR')}
    </p>
  </div>
)

export const FormulaTransparentePanel = ({
  formula,
  className,
  permitirVotoNulo = true,
}: FormulaTransparentePanelProps) => (
  <Card
    className={cn(
      'gap-0 overflow-hidden rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]',
      className
    )}
  >
    <CardHeader className='space-y-3 px-6 pt-6 pb-2 sm:px-8'>
      <div
        className='flex size-11 items-center justify-center rounded-xl bg-[#2f6f9f]/10 text-[#2f6f9f]'
        aria-hidden='true'
      >
        <Calculator className='size-5' />
      </div>
      <div className='space-y-1.5'>
        <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
          Cálculo transparente
        </CardTitle>
        <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
          Operaciones detrás del porcentaje de participación electoral.
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className='space-y-4 px-6 pb-6 sm:px-8' aria-live='polite'>
      <div className='grid gap-3 sm:grid-cols-2'>
        <Operand label='Padrón habilitado' value={formula.totalPadron} />
        <Operand label='Votos afirmativos' value={formula.votosAfirmativos} />
        <Operand label='Votos en blanco' value={formula.votosEnBlanco} />
        {permitirVotoNulo && (
          <Operand label='Votos nulos' value={formula.votosNulos} />
        )}
      </div>
      <div className='rounded-xl border border-[#2f6f9f]/20 bg-[#2f6f9f]/5 px-4 py-3'>
        <p className='text-xs font-medium tracking-wide text-[#2f6f9f] uppercase'>
          Expresión
        </p>
        <p className='mt-1 font-mono text-sm leading-relaxed break-all text-[#202124]'>
          {formula.expresion}
        </p>
      </div>
    </CardContent>
  </Card>
)
