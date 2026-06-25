import { ShieldCheck } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  VotarLoginBackground,
} from '@/features/auth/sign-in/components/login-screen-shared'
import { UserAuthForm } from '@/features/auth/sign-in/components/user-auth-form'

type AdminLoginScreenProps = {
  redirectTo?: string
}

export const AdminLoginScreen = ({ redirectTo }: AdminLoginScreenProps) => (
  <main className='relative min-h-svh overflow-hidden bg-[#fdfcfa] text-[#202124]'>
    <VotarLoginBackground />
    <section className='relative mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center px-4 py-4 sm:px-6'>
      <div className='mb-4 text-center'>
        <p className='text-2xl leading-none font-extrabold tracking-tight text-[#2f6f9f]'>
          VOTAR
        </p>
        <p className='mt-1 text-xs font-semibold tracking-[0.16em] text-[#315f7a] uppercase'>
          Panel de Gestión
        </p>
      </div>

      <Card className='w-full gap-0 rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] backdrop-blur-sm'>
        <CardHeader className='space-y-1 px-5 pt-6 pb-0 text-center sm:px-6'>
          <div className='mx-auto mb-2 flex size-9 items-center justify-center rounded-full bg-[#2f6f9f]/10 text-[#2f6f9f]'>
            <ShieldCheck className='size-4' aria-hidden='true' />
          </div>
          <CardTitle className='text-xl font-bold tracking-tight text-[#202124]'>
            Autoridad Electoral
          </CardTitle>
          <CardDescription className='mx-auto max-w-xs text-sm leading-snug text-[#55575d]'>
            Ingrese sus credenciales institucionales para acceder al panel.
          </CardDescription>
        </CardHeader>

        <CardContent className='px-5 pt-4 pb-6 sm:px-6'>
          <UserAuthForm redirectTo={redirectTo} variant='panel' />
        </CardContent>
      </Card>
    </section>
  </main>
)
