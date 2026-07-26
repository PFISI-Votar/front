import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { VoteTxError } from '@/features/voto/crypto/vote-tx-errors'

const ERROR_TITLES: Partial<Record<VoteTxError['code'], string>> = {
  already_registered: 'Voto ya registrado',
  election_closed: 'Votación finalizada',
  election_paused: 'Comicio pausado',
  not_eligible: 'No habilitado en el padrón',
  retry_too_soon: 'Debe esperar antes de volver a votar',
  invalid_signature: 'Firma no válida',
  network: 'Error de conexión',
  timeout: 'Tiempo de confirmación agotado',
  insufficient_funds: 'Fondos insuficientes',
  merkle_root_missing: 'Padrón no publicado',
  user_rejected: 'Envío cancelado',
}

const getErrorTitle = (error: VoteTxError): string =>
  ERROR_TITLES[error.code] ?? 'Error de transmisión'

type VoteTransmitErrorAlertProps = {
  error: VoteTxError
}

export const VoteTransmitErrorAlert = ({
  error,
}: VoteTransmitErrorAlertProps) => {
  const isWarning = error.severity === 'warning'

  return (
    <Alert
      variant={isWarning ? 'default' : 'destructive'}
      className={cn(isWarning && 'border-amber-200 bg-amber-50 text-amber-950')}
      role='alert'
      aria-live='assertive'
    >
      <AlertTriangle className='size-4' />
      <AlertTitle>{getErrorTitle(error)}</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  )
}
