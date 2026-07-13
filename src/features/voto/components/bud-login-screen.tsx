import { useState } from 'react'
import { AxiosError } from 'axios'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  LockKeyhole,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  LoginField,
  VOTAR_LIGHT_SURFACE_CLASS,
  VotarBrandHeader,
  VotarLoginBackground,
} from '@/features/auth/sign-in/components/login-screen-shared'
import {
  METODOS_AUTENTICACION,
  type MetodoAutenticacion,
} from '@/features/eleccion/configuracion-comicio/data/constants'
import { loginVotante } from '@/features/voto/services/votante-auth-api'
import type { VotanteAuthUser } from '@/features/voto/types/votante-auth.types'

type BudLoginScreenProps = {
  idEleccion: number
  authMethod?: MetodoAutenticacion
  onAuthenticated: (user: VotanteAuthUser) => void
}

const GENERIC_LOGIN_ERROR =
  'No pudimos iniciar sesión. Verificá tus credenciales institucionales e intentá nuevamente.'

export const BudLoginScreen = ({
  idEleccion,
  authMethod = METODOS_AUTENTICACION.SSO_INSTITUCIONAL,
  onAuthenticated,
}: BudLoginScreenProps) => {
  const [legajo, setLegajo] = useState('')
  const [clave, setClave] = useState('')
  const [showClave, setShowClave] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isGoogleLogin = authMethod === METODOS_AUTENTICACION.GOOGLE

  const handleGoogleStub = () => {
    toast.info('El inicio de sesión con Google estará disponible próximamente.')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nick = legajo.trim()
    if (!nick || !clave) {
      setErrorMessage('Ingresá tu legajo y clave institucional.')
      return
    }
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await loginVotante({
        nick,
        password: clave,
        idEleccion,
      })
      onAuthenticated(response.user)
    } catch (error) {
      if (error instanceof AxiosError) {
        setErrorMessage(GENERIC_LOGIN_ERROR)
      } else {
        setErrorMessage(GENERIC_LOGIN_ERROR)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main
      className={`relative min-h-svh overflow-hidden bg-[#fdfcfa] ${VOTAR_LIGHT_SURFACE_CLASS}`}
    >
      <VotarLoginBackground />
      <section className='relative mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center px-4 py-8 sm:px-6'>
        <VotarBrandHeader className='mb-8' />

        <Card className='w-full gap-0 rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] backdrop-blur-sm'>
          <CardHeader className='space-y-1.5 px-6 pt-8 pb-0 text-center sm:px-8'>
            <CardTitle className='text-2xl font-bold tracking-tight text-[#202124]'>
              Bienvenido
            </CardTitle>
            <CardDescription className='mx-auto max-w-sm text-sm leading-relaxed text-[#55575d]'>
              Ingresá tus credenciales institucionales para comenzar
            </CardDescription>
          </CardHeader>

          <CardContent className='px-6 pt-6 pb-8 sm:px-8'>
            {errorMessage ? (
              <Alert variant='destructive' className='mb-5'>
                <AlertTitle>Error de autenticación</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            {isGoogleLogin ? (
              <Button
                type='button'
                variant='outline'
                className='h-12 w-full rounded-lg border-[#cfd3d7] bg-white text-sm font-semibold text-[#2f3337] shadow-none hover:bg-slate-50'
                onClick={handleGoogleStub}
                aria-label='Iniciar sesión con Google - próximamente'
              >
                <GoogleIcon className='size-5' />
                Iniciar sesión con Google
              </Button>
            ) : (
              <form className='flex flex-col gap-5' onSubmit={handleSubmit}>
                <LoginField label='Número de Legajo' htmlFor='legajo-votante'>
                  <IdCard
                    className='pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-[#74777d]'
                    aria-hidden='true'
                  />
                  <Input
                    id='legajo-votante'
                    value={legajo}
                    onChange={(event) => setLegajo(event.target.value)}
                    inputMode='numeric'
                    autoComplete='username'
                    disabled={isLoading}
                    placeholder='Ej. 14988'
                    className='h-11 rounded-lg border-[#c9cdd2] bg-white pr-4 pl-11 text-base shadow-none placeholder:text-[#9aa0a6] focus-visible:border-[#2f6f9f] focus-visible:ring-[#2f6f9f]/20'
                  />
                </LoginField>

                <LoginField label='Clave Institucional' htmlFor='clave-votante'>
                  <LockKeyhole
                    className='pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-[#74777d]'
                    aria-hidden='true'
                  />
                  <Input
                    id='clave-votante'
                    value={clave}
                    onChange={(event) => setClave(event.target.value)}
                    type={showClave ? 'text' : 'password'}
                    autoComplete='current-password'
                    disabled={isLoading}
                    placeholder='••••••••'
                    className='h-11 rounded-lg border-[#c9cdd2] bg-white pr-11 pl-11 text-base shadow-none placeholder:tracking-normal focus-visible:border-[#2f6f9f] focus-visible:ring-[#2f6f9f]/20'
                  />
                  <button
                    type='button'
                    className='absolute top-1/2 right-2.5 grid size-8 -translate-y-1/2 place-items-center rounded-md text-[#74777d] transition hover:bg-slate-100 hover:text-[#2f6f9f] focus-visible:ring-3 focus-visible:ring-[#2f6f9f]/20 focus-visible:outline-none'
                    onClick={() => setShowClave((current) => !current)}
                    aria-label={showClave ? 'Ocultar clave' : 'Mostrar clave'}
                  >
                    {showClave ? (
                      <EyeOff className='size-4' aria-hidden='true' />
                    ) : (
                      <Eye className='size-4' aria-hidden='true' />
                    )}
                  </button>
                </LoginField>

                <Button
                  type='submit'
                  size='lg'
                  disabled={isLoading}
                  className='mt-1 h-11 w-full rounded-lg bg-[#2f6f9f] text-base font-semibold text-white shadow-none hover:bg-[#285f88]'
                >
                  {isLoading ? (
                    <Loader2
                      className='size-5 animate-spin'
                      aria-hidden='true'
                    />
                  ) : (
                    <>
                      Ingresar
                      <ArrowRight
                        className='size-5 stroke-[2.5]'
                        aria-hidden='true'
                      />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox='0 0 24 24'
    aria-hidden='true'
    className={cn('size-5', className)}
  >
    <path
      fill='#4285F4'
      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
    />
    <path
      fill='#34A853'
      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
    />
    <path
      fill='#FBBC05'
      d='M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z'
    />
    <path
      fill='#EA4335'
      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z'
    />
  </svg>
)

export const BudTopBar = () => (
  <header className='sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur'>
    <div className='flex items-center gap-2 font-bold'>
      <Building2 className='size-5 text-sky-800' />
      Registro Electoral
    </div>
    <KeyRound className='size-5 text-sky-800' />
  </header>
)

export const BudBottomNav = ({
  active,
}: {
  active: 'boleta' | 'progreso' | 'verificar'
}) => (
  <nav className='sticky bottom-0 z-20 grid h-16 grid-cols-3 border-t border-slate-200 bg-white/95 text-xs text-slate-700 backdrop-blur'>
    {[
      ['boleta', 'Boleta'],
      ['progreso', 'Progreso'],
      ['verificar', 'Verificar'],
    ].map(([key, label]) => (
      <div
        key={key}
        className={
          active === key
            ? 'mx-auto -mt-3 grid size-16 place-items-center rounded-full bg-sky-500 font-medium text-white shadow-lg shadow-sky-300/50'
            : 'grid place-items-center'
        }
      >
        <ShieldCheck className='size-5' />
        <span>{label}</span>
      </div>
    ))}
  </nav>
)
