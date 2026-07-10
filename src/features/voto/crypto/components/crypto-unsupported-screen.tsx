import { ShieldAlert } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { VotarLoginBackground } from '@/features/auth/sign-in/components/login-screen-shared'

export const CRYPTO_UNSUPPORTED_MESSAGE =
  'Tu navegador no cumple con los requisitos mínimos de seguridad'

export const CryptoUnsupportedScreen = () => (
  <main
    className='relative min-h-svh overflow-hidden bg-[#fdfcfa] text-[#202124]'
    role='alert'
    aria-live='assertive'
    aria-labelledby='crypto-unsupported-title'
  >
    <VotarLoginBackground />
    <section className='relative mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center px-4 py-8 sm:px-6'>
      <div className='mb-8 text-center'>
        <p className='text-2xl leading-none font-extrabold tracking-tight text-[#2f6f9f]'>
          VOTAR
        </p>
      </div>

      <Card className='w-full gap-0 rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] backdrop-blur-sm'>
        <CardHeader className='space-y-3 px-6 pt-8 pb-0 text-center sm:px-8'>
          <div
            className='mx-auto grid size-14 place-items-center rounded-full bg-[#d7e9f7] text-[#2f6f9f]'
            aria-hidden='true'
          >
            <ShieldAlert className='size-7' />
          </div>
          <CardTitle
            id='crypto-unsupported-title'
            className='text-2xl font-bold tracking-tight text-[#202124]'
          >
            Requisitos de seguridad no cumplidos
          </CardTitle>
          <CardDescription className='mx-auto max-w-sm text-sm leading-relaxed text-[#55575d]'>
            {CRYPTO_UNSUPPORTED_MESSAGE}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4 px-6 pt-5 pb-8 text-center sm:px-8'>
          <p className='text-sm leading-relaxed text-[#5f6368]'>
            Para proteger el secreto del sufragio, la Boleta Única Digital
            necesita un navegador actualizado con soporte de Web Crypto API y
            una conexión segura (HTTPS).
          </p>
          <p className='text-xs leading-relaxed text-[#80868b]'>
            Probá con la versión más reciente de Chrome, Firefox, Safari o Edge.
            El acceso al comicio permanece bloqueado hasta que se cumplan los
            requisitos mínimos.
          </p>
        </CardContent>
      </Card>
    </section>
  </main>
)
