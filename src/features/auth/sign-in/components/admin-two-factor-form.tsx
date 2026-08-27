import { useEffect, useState } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import QRCode from 'qrcode'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'
import { verifyTwoFactor } from '@/features/auth/services/auth-api'
import type {
  AuthUser,
  TwoFactorChallenge,
} from '@/features/auth/types/auth.types'
import { LoginField } from '@/features/auth/sign-in/components/login-screen-shared'

const formSchema = z.object({
  code: z
    .string()
    .min(6, 'Ingrese el código de 6 dígitos.')
    .max(6, 'Ingrese el código de 6 dígitos.'),
})

type AdminTwoFactorFormProps = {
  challenge: TwoFactorChallenge
  onVerified: (user: AuthUser) => void
  onCancel: () => void
  className?: string
}

export function AdminTwoFactorForm({
  challenge,
  onVerified,
  onCancel,
  className,
}: AdminTwoFactorFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [qrState, setQrState] = useState<{
    otpauthUrl: string
    dataUrl: string
  } | null>(null)
  const isSetup = challenge.status === 'setup_required'
  const otpauthUrl = challenge.otpauthUrl
  const qrDataUrl =
    otpauthUrl && qrState?.otpauthUrl === otpauthUrl ? qrState.dataUrl : null

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: '' },
  })

  const code = useWatch({ control: form.control, name: 'code' })

  useEffect(() => {
    if (!otpauthUrl) {
      return
    }
    let cancelled = false
    void QRCode.toDataURL(otpauthUrl, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
    }).then((dataUrl) => {
      if (!cancelled) {
        setQrState({ otpauthUrl, dataUrl })
      }
    })
    return () => {
      cancelled = true
    }
  }, [otpauthUrl])

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      const response = await verifyTwoFactor({
        challengeToken: challenge.challengeToken,
        code: data.code,
      })
      if (!response.user) {
        toast.error('No se pudo completar la verificación 2FA.')
        return
      }
      onVerified(response.user)
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string } | undefined)
              ?.message ?? 'Código 2FA inválido.')
          : 'No se pudo verificar el código.'
      toast.error(message)
      form.reset({ code: '' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {isSetup ? (
        <div className='space-y-3 rounded-xl border border-[#e4e7eb] bg-[#f8fafc] p-4 text-center'>
          <p className='text-sm leading-snug text-[#55575d]'>
            Escanee el QR con Google Authenticator u otra app TOTP, o ingrese el
            secreto manualmente.
          </p>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt='Código QR para configurar autenticación en dos pasos'
              className='mx-auto size-44 rounded-lg bg-white p-2'
            />
          ) : null}
          {challenge.secret ? (
            <p className='break-all font-mono text-xs tracking-wide text-[#202124]'>
              {challenge.secret}
            </p>
          ) : null}
        </div>
      ) : (
        <p className='text-center text-sm leading-snug text-[#55575d]'>
          Ingrese el código de 6 dígitos de su aplicación autenticadora.
        </p>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className='space-y-4'
        >
          <FormField
            control={form.control}
            name='code'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <LoginField label='Código 2FA' htmlFor='admin-2fa-code' compact>
                  <FormControl>
                    <InputOTP
                      id='admin-2fa-code'
                      maxLength={6}
                      {...field}
                      containerClassName='justify-center gap-1'
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                </LoginField>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type='submit'
            disabled={isLoading || (code?.length ?? 0) < 6}
            className='h-10 w-full rounded-lg bg-[#264a73] text-sm font-semibold text-white shadow-none hover:bg-[#1f3d5f]'
          >
            {isLoading ? (
              <Loader2 className='size-4 animate-spin' aria-hidden='true' />
            ) : (
              'Verificar y continuar'
            )}
          </Button>
          <Button
            type='button'
            variant='ghost'
            disabled={isLoading}
            onClick={onCancel}
            className='h-9 w-full text-sm text-[#55575d]'
          >
            Volver
          </Button>
        </form>
      </Form>
    </div>
  )
}
