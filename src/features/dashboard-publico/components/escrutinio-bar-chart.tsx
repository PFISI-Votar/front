import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { BarChartDatum } from '@/features/dashboard-publico/lib/escrutinio-chart-data'

type EscrutinioBarChartProps = {
  data: BarChartDatum[]
  className?: string
  height?: number
}

export const EscrutinioBarChart = ({
  data,
  className,
  height = 320,
}: EscrutinioBarChartProps) => {
  if (data.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#e4e7eb] bg-white/95 p-4 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] sm:p-6',
        className
      )}
      role='img'
      aria-label='Gráfico de barras con votos por candidato'
    >
      <h3 className='mb-4 text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'>
        Votos por candidato
      </h3>
      <ResponsiveContainer width='100%' height={height}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
        >
          <CartesianGrid
            strokeDasharray='3 3'
            stroke='#e4e7eb'
            vertical={false}
          />
          <XAxis
            dataKey='name'
            stroke='#80868b'
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-25}
            textAnchor='end'
            height={60}
          />
          <YAxis
            stroke='#80868b'
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(47, 111, 159, 0.06)' }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e4e7eb',
              boxShadow: '0 8px 24px rgba(30,64,95,0.08)',
            }}
            formatter={(value) => [
              Number(value).toLocaleString('es-AR'),
              'Votos',
            ]}
          />
          <Bar
            dataKey='votos'
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={600}
          >
            {data.map((entry) => (
              <Cell key={entry.idCandidato} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <table className='sr-only'>
        <caption>Tabla de votos por candidato</caption>
        <thead>
          <tr>
            <th>Candidato</th>
            <th>Votos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.idCandidato}>
              <td>{row.name}</td>
              <td>{row.votos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
