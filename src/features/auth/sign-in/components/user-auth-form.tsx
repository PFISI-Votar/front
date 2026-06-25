import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { login } from '@/features/auth/services/auth-api'
import { scheduleAccessTokenRefresh } from '@/features/auth/services/auth-session'
import { ELECTION_ADMIN_ROLE } from '@/features/auth/types/auth.types'
import { LoginField } from '@/features/auth/sign-in/components/login-screen-shared'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const formSchema = z.object({
  nick: z.string().min(1, 'Ingrese su usuario.'),
  password: z.string().min(1, 'Ingrese su contraseña.'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
  variant?: 'default' | 'panel'
}

export function UserAuthForm({
  className,
  redirectTo,
  variant = 'default',
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const isPanelVariant = variant === 'panel'

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nick: '',
      password: '',
    },
  })

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      const response = await login({
        nick: data.nick.trim(),
        password: data.password,
      })

      if (response.user.role !== ELECTION_ADMIN_ROLE) {
        toast.error(
          'Acceso denegado. Su cuenta no tiene privilegios de Autoridad Electoral.',
        )
        return
      }

      auth.setSession(response.user)
      scheduleAccessTokenRefresh()

      const targetPath = redirectTo || '/'
      navigate({ to: targetPath, replace: true })
      toast.success(
        `Bienvenido${response.user.name ? `, ${response.user.name}` : ''}.`,
      )
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string } | undefined)
              ?.message ?? 'Credenciales inválidas.')
          : 'No se pudo iniciar sesión.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isPanelVariant) {
    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={cn('space-y-4', className)}
          {...props}
        >
          <FormField
            control={form.control}
            name='nick'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <LoginField label='Usuario' htmlFor='admin-usuario' compact>
                  <User
                    className='pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#74777d]'
                    aria-hidden='true'
                  />
                  <FormControl>
                    <Input
                      id='admin-usuario'
                      autoComplete='username'
                      className='h-10 rounded-lg border-[#c9cdd2] bg-white pr-3 pl-10 text-sm shadow-none placeholder:text-[#8a8d93] focus-visible:border-[#2f6f9f] focus-visible:ring-[#2f6f9f]/20'
                      {...field}
                    />
                  </FormControl>
                </LoginField>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <LoginField label='Contraseña' htmlFor='admin-password' compact>
                  <LockKeyhole
                    className='pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#74777d]'
                    aria-hidden='true'
                  />
                  <FormControl>
                    <Input
                      id='admin-password'
                      type={showPassword ? 'text' : 'password'}
                      autoComplete='current-password'
                      className='h-10 rounded-lg border-[#c9cdd2] bg-white pr-10 pl-10 text-sm shadow-none focus-visible:border-[#2f6f9f] focus-visible:ring-[#2f6f9f]/20'
                      {...field}
                    />
                  </FormControl>
                  <button
                    type='button'
                    className='absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-[#74777d] transition hover:bg-slate-100 hover:text-[#2f6f9f] focus-visible:ring-3 focus-visible:ring-[#2f6f9f]/20 focus-visible:outline-none'
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className='size-4' aria-hidden='true' />
                    ) : (
                      <Eye className='size-4' aria-hidden='true' />
                    )}
                  </button>
                </LoginField>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type='submit'
            disabled={isLoading}
            className='mt-1 h-10 w-full rounded-lg bg-[#264a73] text-sm font-semibold text-white shadow-none hover:bg-[#1f3d5f]'
          >
            {isLoading ? (
              <Loader2 className='size-4 animate-spin' aria-hidden='true' />
            ) : (
              <>
                Ingresar al panel
                <ArrowRight className='size-4 stroke-[2.5]' aria-hidden='true' />
              </>
            )}
          </Button>
        </form>
      </Form>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='nick'
          render={({ field }) => (
            <FormItem>
              <label className='text-sm font-medium'>Usuario institucional</label>
              <FormControl>
                <Input
                  placeholder='Nick de Autogestión UTN'
                  autoComplete='username'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <label className='text-sm font-medium'>Contraseña</label>
              <FormControl>
                <Input
                  type='password'
                  placeholder='Contraseña de Autogestión'
                  autoComplete='current-password'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading} type='submit'>
          {isLoading ? <Loader2 className='animate-spin' /> : null}
          Ingresar al Panel de Gestión
        </Button>
      </form>
    </Form>
  )
}
