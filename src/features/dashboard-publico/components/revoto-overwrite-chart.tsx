import { TrendingUp } from 'lucide-react'
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
import type { RevotoOverwriteTimelinePunto } from '@/features/dashboard-publico/api/revoto-stats-publica-api'

type RevotoOverwriteChartProps = {
  serieTemporal: RevotoOverwriteTimelinePunto[]
  className?: string
}

export const RevotoOverwriteChart = ({
  serieTemporal,
  className,
}: RevotoOverwriteChartProps) => (
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
        <TrendingUp className='size-5' />
      </div>
      <div className='space-y-1.5'>
        <CardTitle className='text-lg font-semibold tracking-tight text-[#202124]'>
          Tasa de sobreescritura acumulada
        </CardTitle>
        <CardDescription className='text-sm leading-relaxed text-[#5f6368]'>
          Evolución de la proporción de re-votos sobre el total de eventos
          VoteCast en las últimas horas.
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className='px-2 pb-6 sm:px-4'>
      {serieTemporal.length === 0 ? (
        <p className='px-4 text-sm text-[#5f6368]'>
          Aún no hay eventos VoteCast para graficar la tasa de sobreescritura.
        </p>
      ) : (
        <div
          role='img'
          aria-label='Gráfico acumulativo de tasa de sobreescritura por hora'
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
                domain={[0, 1]}
                tickFormatter={(value) =>
                  Number(value).toLocaleString('es-AR', {
                    style: 'percent',
                    maximumFractionDigits: 0,
                  })
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  borderColor: '#e4e7eb',
                  fontSize: '0.875rem',
                }}
                formatter={(value) => [
                  Number(value).toLocaleString('es-AR', {
                    style: 'percent',
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }),
                  'Tasa acumulada',
                ]}
              />
              <Area
                type='monotone'
                dataKey='overwriteRatio'
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
