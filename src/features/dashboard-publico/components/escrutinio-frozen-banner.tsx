import { Snowflake } from 'lucide-react'

type EscrutinioFrozenBannerProps = {
  resultadosDefinitivos?: boolean
}

export const EscrutinioFrozenBanner = ({
  resultadosDefinitivos = false,
}: EscrutinioFrozenBannerProps) => (
  <div
    className='flex items-start gap-3 rounded-2xl border border-[#c5d8e8] bg-[#2f6f9f]/8 px-4 py-3 text-sm text-[#1e4058]'
    role='status'
  >
    <Snowflake
      className='mt-0.5 size-4 shrink-0 text-[#2f6f9f]'
      aria-hidden='true'
    />
    <p>
      {resultadosDefinitivos
        ? 'El comicio está cerrado. Estos resultados son definitivos e inmutables; ya no se actualizan en tiempo real.'
        : 'La visualización en vivo está congelada para este comicio. Los gráficos muestran el último snapshot disponible.'}
    </p>
  </div>
)
