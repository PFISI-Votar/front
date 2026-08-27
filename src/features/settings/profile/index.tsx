import { useEffect, useState } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  getTwoFactorStatus,
  resetTwoFactor,
} from '@/features/auth/services/auth-api'
import { ContentSection } from '../components/content-section'

const resetSchema = z.object({
  password: z.string().min(1, 'Ingrese su contraseña institucional.'),
})

export function SettingsProfile() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [isResetting, setIsResetting] = useState(false)

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '' },
  })

  useEffect(() => {
    let cancelled = false
    void getTwoFactorStatus()
      .then((status) => {
        if (!cancelled) {
          setEnabled(status.enabled)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEnabled(null)
          toast.error('No se pudo obtener el estado del 2FA.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingStatus(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleReset = async (data: z.infer<typeof resetSchema>) => {
    setIsResetting(true)
    try {
      await resetTwoFactor({ password: data.password })
      setEnabled(false)
      form.reset({ password: '' })
      toast.success(
        'Setup 2FA invalidado. En el próximo login deberá vincular una app nuevamente.'
      )
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string } | undefined)
              ?.message ?? 'No se pudo resetear el 2FA.')
          : 'No se pudo resetear el 2FA.'
      toast.error(message)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <ContentSection
      title='Seguridad'
      desc='Gestione la autenticación en dos pasos (TOTP) de su cuenta de autoridad electoral.'
    >
      <div className='space-y-6'>
        <div className='rounded-lg border border-border p-4'>
          <div className='flex items-start gap-3'>
            <ShieldAlert className='mt-0.5 size-5 text-[#2f6f9f]' />
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Autenticación en dos pasos</p>
              {isLoadingStatus ? (
                <p className='text-sm text-muted-foreground'>
                  Consultando estado…
                </p>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  Estado:{' '}
                  <span className='font-medium text-foreground'>
                    {enabled ? 'Activo' : 'No configurado'}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {enabled ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleReset)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resetear setup 2FA</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        autoComplete='current-password'
                        placeholder='Contraseña de Autogestión'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Confirme su contraseña institucional para invalidar el
                      setup actual. En el siguiente acceso deberá escanear un QR
                      nuevo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type='submit'
                variant='destructive'
                disabled={isResetting}
              >
                {isResetting ? (
                  <Loader2 className='size-4 animate-spin' aria-hidden='true' />
                ) : null}
                Resetear setup
              </Button>
            </form>
          </Form>
        ) : null}
      </div>
    </ContentSection>
  )
}
