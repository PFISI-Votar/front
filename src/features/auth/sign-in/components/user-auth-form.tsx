import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { login } from '@/features/auth/services/auth-api'
import { ELECTION_ADMIN_ROLE } from '@/features/auth/types/auth.types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  nick: z
    .string()
    .min(1, 'Ingrese su usuario institucional de Autogestión UTN.'),
  password: z.string().min(1, 'Ingrese su contraseña.'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

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

      auth.setSession(response.user, response.accessToken)

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
              <FormLabel>Usuario institucional</FormLabel>
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
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <PasswordInput
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
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          Ingresar al Panel de Gestión
        </Button>
      </form>
    </Form>
  )
}
