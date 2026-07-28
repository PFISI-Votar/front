import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'
import type { DonutChartDatum } from '@/features/dashboard-publico/lib/escrutinio-chart-data'

type EscrutinioDonutChartProps = {
  data: DonutChartDatum[]
  className?: string
  height?: number
}

export const EscrutinioDonutChart = ({
  data,
  className,
  height = 280,
}: EscrutinioDonutChartProps) => {
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
      aria-label='Gráfico de distribución relativa de votos'
    >
      <h3 className='mb-4 text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'>
        Distribución relativa
      </h3>
      <ResponsiveContainer width='100%' height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey='value'
            nameKey='name'
            cx='50%'
            cy='50%'
            innerRadius={58}
            outerRadius={90}
            paddingAngle={2}
            isAnimationActive
            animationDuration={600}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e4e7eb',
              boxShadow: '0 8px 24px rgba(30,64,95,0.08)',
            }}
            formatter={(value, name) => [
              Number(value).toLocaleString('es-AR'),
              String(name),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul
        className='mt-2 flex flex-wrap justify-center gap-3'
        aria-hidden='true'
      >
        {data.map((entry) => (
          <li
            key={entry.name}
            className='flex items-center gap-1.5 text-xs text-[#5f6368]'
          >
            <span
              className='inline-block size-2.5 rounded-full'
              style={{ backgroundColor: entry.fill }}
            />
            {entry.name}
          </li>
        ))}
      </ul>
      <table className='sr-only'>
        <caption>Distribución relativa de votos</caption>
        <thead>
          <tr>
            <th>Opción</th>
            <th>Votos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
