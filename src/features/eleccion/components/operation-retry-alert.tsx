import { RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type OperationRetryAlertProps = {
  title: string
  message: string
  isRetrying?: boolean
  onRetry: () => void
  onDismiss?: () => void
}

export const OperationRetryAlert = ({
  title,
  message,
  isRetrying = false,
  onRetry,
  onDismiss,
}: OperationRetryAlertProps) => (
  <Alert variant='destructive'>
    <RefreshCw className='size-4' />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>
      <p>{message}</p>
      <div className='mt-3 flex flex-wrap gap-2'>
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={isRetrying}
          onClick={onRetry}
        >
          <RefreshCw className='size-3.5' />
          {isRetrying ? 'Reintentando...' : 'Reintentar'}
        </Button>
        {onDismiss ? (
          <Button
            type='button'
            size='sm'
            variant='ghost'
            disabled={isRetrying}
            onClick={onDismiss}
          >
            Descartar
          </Button>
        ) : null}
      </div>
    </AlertDescription>
  </Alert>
)
