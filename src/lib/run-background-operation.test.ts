import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { runBackgroundOperation } from './run-background-operation'

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}))

describe('runBackgroundOperation', () => {
  it('muestra toast de éxito cuando la operación finaliza correctamente', async () => {
    const operation = vi.fn().mockResolvedValue({ ok: true })
    const onSuccess = vi.fn()

    runBackgroundOperation({
      loadingMessage: 'Procesando...',
      successMessage: 'Listo',
      operation,
      onSuccess,
      onSettled: vi.fn(),
    })

    await vi.waitFor(() => {
      expect(operation).toHaveBeenCalledOnce()
    })

    await vi.waitFor(() => {
      expect(toast.loading).toHaveBeenCalledWith('Procesando...')
      expect(onSuccess).toHaveBeenCalledWith({ ok: true })
      expect(toast.success).toHaveBeenCalledWith('Listo', { id: 'toast-id' })
    })
  })

  it('muestra botón Reintentar persistente cuando la operación falla', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(
        new AxiosError('falló', undefined, undefined, undefined, {
          status: 503,
          data: { message: 'Blockchain no disponible' },
        } as never)
      )
      .mockResolvedValueOnce({ ok: true })

    runBackgroundOperation({
      loadingMessage: 'Procesando...',
      successMessage: 'Listo',
      operation,
    })

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Operación fallida',
        expect.objectContaining({
          description: 'Blockchain no disponible',
          duration: Infinity,
          action: expect.objectContaining({ label: 'Reintentar' }),
        })
      )
    })

    const errorCall = vi.mocked(toast.error).mock.calls[0]?.[1] as {
      action?: { onClick: () => void }
    }
    errorCall.action?.onClick()

    await vi.waitFor(() => {
      expect(operation).toHaveBeenCalledTimes(2)
      expect(toast.loading).toHaveBeenLastCalledWith('Procesando...', {
        id: 'toast-id',
      })
    })
  })

  it('usa acción personalizada cuando onError la devuelve', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('412'))
    const customAction = {
      label: 'Ver padrón',
      onClick: vi.fn(),
    }

    runBackgroundOperation({
      loadingMessage: 'Abriendo...',
      successMessage: 'Abierto',
      operation,
      onError: () => customAction,
    })

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Operación fallida',
        expect.objectContaining({
          action: customAction,
          duration: Infinity,
        })
      )
    })
  })
})
