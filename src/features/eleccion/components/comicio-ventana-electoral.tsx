import { formatDateTimeForDisplay } from '@/lib/datetime'

type ComicioVentanaElectoralProps = {
  fechaInicio: string
  fechaFin: string
}

export const ComicioVentanaElectoral = ({
  fechaInicio,
  fechaFin,
}: ComicioVentanaElectoralProps) => (
  <p className='text-sm text-muted-foreground'>
    Apertura {formatDateTimeForDisplay(fechaInicio)} · Cierre{' '}
    {formatDateTimeForDisplay(fechaFin)}
  </p>
)
