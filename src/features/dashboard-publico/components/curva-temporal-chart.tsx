import { Activity } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { SerieTemporalPunto } from '@/features/dashboard-publico/api/participacion-publica-api'

type CurvaTemporalChartProps = {
  serieTemporal: SerieTemporalPunto[]
  className?: string
}

export const CurvaTemporalChart = ({
  serieTemporal,
  className,
}: CurvaTemporalChartProps) => (
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
        <Activity className='size-5' />
      </div>
      <div className='space-y-1.5'>
        <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
          Distribución temporal
        </CardTitle>
        <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
          Ritmo acumulado de sufragios emitidos durante las últimas 12 horas del
          comicio o durante todo su período, si su duración fue menor.
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className='px-2 pb-6 sm:px-4'>
      {serieTemporal.length === 0 ? (
        <p className='px-4 text-sm text-[#5f6368]'>
          Aún no hay eventos VoteCast para graficar la afluencia.
        </p>
      ) : (
        <div
          role='img'
          aria-label='Gráfico de participación acumulada por hora'
          className='h-[280px] w-full'
        >
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={serieTemporal} margin={{ left: 8, right: 12 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#e4e7eb' />
              <XAxis
                dataKey='etiqueta'
                stroke='#80868b'
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke='#80868b'
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  borderColor: '#e4e7eb',
                  fontSize: '0.875rem',
                }}
                formatter={(value, name) => {
                  const numeric =
                    typeof value === 'number' ? value : Number(value)
                  const label =
                    name === 'acumulado' ? 'Acumulado' : 'Nuevos en la hora'
                  return [numeric.toLocaleString('es-AR'), label]
                }}
              />
              <Area
                type='monotone'
                dataKey='acumulado'
                stroke='#2f6f9f'
                fill='#2f6f9f'
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardContent>
  </Card>
)
