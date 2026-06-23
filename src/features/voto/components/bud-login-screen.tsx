import { type ReactNode, useState } from 'react'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'
import budFingerprint from '@/assets/bud-fingerprint.png'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  METODOS_AUTENTICACION,
  type MetodoAutenticacion,
} from '@/features/eleccion/configuracion-comicio/data/constants'
import {
  createDemoVotanteToken,
  setVotanteToken,
} from '@/features/voto/api/voto-api'

const BACKGROUND_FINGERPRINTS = [
  { top: '8%', left: '12%', width: '7.5rem', opacity: 0.05, rotate: '-18deg' },
  { top: '12%', left: '82%', width: '8rem', opacity: 0.045, rotate: '21deg' },
  { top: '30%', left: '28%', width: '7rem', opacity: 0.04, rotate: '8deg' },
  { top: '38%', left: '72%', width: '8.5rem', opacity: 0.05, rotate: '-26deg' },
  { top: '58%', left: '14%', width: '8rem', opacity: 0.045, rotate: '24deg' },
  { top: '64%', left: '88%', width: '7rem', opacity: 0.04, rotate: '-10deg' },
  { top: '82%', left: '34%', width: '8.75rem', opacity: 0.05, rotate: '-22deg' },
  { top: '88%', left: '70%', width: '7.5rem', opacity: 0.04, rotate: '16deg' },
] as const

type BudLoginScreenProps = {
  idEleccion: number
  authMethod?: MetodoAutenticacion
  onAuthenticated: (token: string) => void
}

export const BudLoginScreen = ({
  idEleccion,
  authMethod = METODOS_AUTENTICACION.SSO_INSTITUCIONAL,
  onAuthenticated,
}: BudLoginScreenProps) => {
  const [legajo, setLegajo] = useState('')
  const [clave, setClave] = useState('')
  const [showClave, setShowClave] = useState(false)
  const isGoogleLogin = authMethod === METODOS_AUTENTICACION.GOOGLE

  const handleAuthenticate = () => {
    const token = createDemoVotanteToken()
    setVotanteToken(idEleccion, token)
    onAuthenticated(token)
  }

  return (
    <main className='relative min-h-svh overflow-hidden bg-[#fdfcfa] text-[#202124]'>
      <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
        {BACKGROUND_FINGERPRINTS.map((fingerprint) => (
          <img
            key={`${fingerprint.top}-${fingerprint.left}`}
            src={budFingerprint}
            alt=''
            className='absolute select-none'
            style={{
              top: fingerprint.top,
              left: fingerprint.left,
              width: fingerprint.width,
              opacity: fingerprint.opacity,
              transform: `translate(-50%, -50%) rotate(${fingerprint.rotate})`,
            }}
          />
        ))}
      </div>
      <section className='relative mx-auto flex min-h-svh w-full max-w-[32rem] flex-col items-center px-6 py-8 sm:px-8'>
        <p className='text-3xl leading-none font-extrabold tracking-tight text-[#2f6f9f]'>
          VOTAR
        </p>

        <Card className='mt-12 w-full gap-0 rounded-[1.35rem] border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1.5rem_5rem_rgba(30,64,95,0.07)] backdrop-blur-sm'>
          <CardHeader className='px-7 pt-10 text-center sm:px-10'>
            <CardTitle className='text-3xl leading-tight font-bold tracking-[-0.03em] text-[#202124]'>
              Bienvenido
            </CardTitle>
            <CardDescription className='mx-auto max-w-xs text-base leading-relaxed text-[#55575d]'>
              Ingrese sus credenciales para comenzar
            </CardDescription>
          </CardHeader>

          <CardContent className='px-7 pt-9 sm:px-10'>
            {isGoogleLogin ? (
              <Button
                type='button'
                variant='outline'
                className='h-12 w-full rounded-lg border-[#cfd3d7] bg-white text-sm font-semibold text-[#2f3337] shadow-none hover:bg-slate-50'
                onClick={handleAuthenticate}
              >
                <GoogleIcon className='size-5' />
                Iniciar sesión con Google
              </Button>
            ) : (
              <form
                className='space-y-6'
                onSubmit={(event) => {
                  event.preventDefault()
                  handleAuthenticate()
                }}
              >
                <LoginField label='Número de Legajo' htmlFor='legajo-votante'>
                  <IdCard
                    className='pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#74777d]'
                    aria-hidden='true'
                  />
                  <Input
                    id='legajo-votante'
                    value={legajo}
                    onChange={(event) => setLegajo(event.target.value)}
                    placeholder='Ej: 99887766'
                    inputMode='numeric'
                    className='h-12 rounded-lg border-[#c9cdd2] bg-white pr-4 pl-12 text-base shadow-none placeholder:text-[#2f3337] focus-visible:border-[#2f6f9f] focus-visible:ring-[#2f6f9f]/20'
                  />
                </LoginField>

                <LoginField label='Clave Institucional' htmlFor='clave-votante'>
                  <LockKeyhole
                    className='pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#74777d]'
                    aria-hidden='true'
                  />
                  <Input
                    id='clave-votante'
                    value={clave}
                    onChange={(event) => setClave(event.target.value)}
                    type={showClave ? 'text' : 'password'}
                    className='h-12 rounded-lg border-[#c9cdd2] bg-white pr-12 pl-12 text-base tracking-[0.28em] shadow-none focus-visible:border-[#2f6f9f] focus-visible:ring-[#2f6f9f]/20'
                  />
                  <button
                    type='button'
                    className='absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[#74777d] transition hover:bg-slate-100 hover:text-[#2f6f9f] focus-visible:ring-3 focus-visible:ring-[#2f6f9f]/20 focus-visible:outline-none'
                    onClick={() => setShowClave((current) => !current)}
                    aria-label={showClave ? 'Ocultar clave' : 'Mostrar clave'}
                  >
                    {showClave ? (
                      <EyeOff className='size-5' aria-hidden='true' />
                    ) : (
                      <Eye className='size-5' aria-hidden='true' />
                    )}
                  </button>
                </LoginField>

                <Button
                  type='submit'
                  size='lg'
                  className='mt-8 h-12 w-full rounded-lg bg-[#2f6f9f] text-base font-semibold text-white shadow-none hover:bg-[#285f88]'
                >
                  Ingresar
                  <ArrowRight className='size-6 stroke-[3]' aria-hidden='true' />
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className='mx-7 mt-10 justify-center border-t border-[#d8d8d8] px-0 py-6 sm:mx-10'>
            <div className='flex items-center justify-center gap-5 text-sm font-medium text-[#315f7a]'>
              <a href='mailto:soporte@votar.local' className='hover:underline'>
                Soporte Técnico
              </a>
              <span className='h-5 w-px bg-[#6c6f73]' aria-hidden='true' />
              <a href='#privacidad' className='hover:underline'>
                Privacidad
              </a>
            </div>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}

const LoginField = ({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) => (
  <div className='space-y-2'>
    <Label
      htmlFor={htmlFor}
      className='text-sm font-semibold text-[#4b4f56]'
    >
      {label}
    </Label>
    <div className='relative'>{children}</div>
  </div>
)

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
