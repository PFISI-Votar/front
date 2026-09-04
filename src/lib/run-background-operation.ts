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
  /** Duration of the error toast in ms. Defaults to 8s (not persistent). */
  errorDuration?: number
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
  errorDuration = 8_000,
  onSuccess,
  onError,
  onSettled,
}: RunBackgroundOperationOptions<T>): void => {
  let toastId: string | number | undefined

  const attempt = async (): Promise<void> => {
    toastId =
      toastId === undefined
        ? toast.loading(loadingMessage)
        : toast.loading(loadingMessage, { id: toastId })

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
        duration: errorDuration,
      })
    } finally {
      onSettled?.()
    }
  }

  void attempt()
}
