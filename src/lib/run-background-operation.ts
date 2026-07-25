import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'

export type BackgroundOperationAction = {
  label: string
  onClick: () => void
}

export type RunBackgroundOperationOptions<T> = {
  loadingMessage: string
  successMessage: string | ((result: T) => string)
  operation: () => Promise<T>
  errorTitle?: string
  onSuccess?: (result: T) => void
  onError?: (error: unknown) => BackgroundOperationAction | true | void
  onSettled?: () => void
}

const resolveSuccessMessage = <T>(
  successMessage: string | ((result: T) => string),
  result: T
): string =>
  typeof successMessage === 'function' ? successMessage(result) : successMessage

export const runBackgroundOperation = <T>({
  loadingMessage,
  successMessage,
  operation,
  errorTitle = 'Operación fallida',
  onSuccess,
  onError,
  onSettled,
}: RunBackgroundOperationOptions<T>): void => {
  const attempt = async (): Promise<void> => {
    const toastId = toast.loading(loadingMessage)

    try {
      const result = await operation()
      onSuccess?.(result)
      toast.success(resolveSuccessMessage(successMessage, result), {
        id: toastId,
      })
    } catch (error) {
      const customAction = onError?.(error)

      if (customAction === true) {
        toast.dismiss(toastId)
        return
      }

      const retryAction: BackgroundOperationAction = {
        label: 'Reintentar',
        onClick: () => {
          void attempt()
        },
      }

      toast.error(errorTitle, {
        id: toastId,
        description: getApiErrorMessage(error),
        action: customAction ?? retryAction,
        duration: 10_000,
      })
    } finally {
      onSettled?.()
    }
  }

  void attempt()
}
