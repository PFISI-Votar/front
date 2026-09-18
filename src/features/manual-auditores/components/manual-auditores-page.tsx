import { type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  Calculator,
  ScrollText,
  Search,
  ShieldCheck,
} from 'lucide-react'
import {
  VOTAR_LIGHT_SURFACE_CLASS,
  VotarLoginBackground,
} from '@/features/auth/sign-in/components/login-screen-shared'
import { MANUAL_AUDITORES_SECTIONS } from '@/features/manual-auditores/manual-auditores-content'

/**
 * VOTAR-396: Manual técnico de transparencia para auditores.
 * Público: no requiere sesión. Accesible desde el Dashboard Público.
 */
export const ManualAuditoresPage = () => (
  <main
    className={`relative min-h-svh overflow-hidden bg-[#fdfcfa] ${VOTAR_LIGHT_SURFACE_CLASS}`}
  >
    <VotarLoginBackground />
    <div className='relative mx-auto flex min-h-svh w-full max-w-3xl flex-col px-4 py-10 sm:px-6 sm:py-14'>
      <div className='mb-8 flex items-center justify-between gap-4'>
        <p className='text-2xl leading-none font-extrabold tracking-tight text-[#2f6f9f]'>
          VOTAR
        </p>
        <p className='text-xs font-medium tracking-wide text-[#80868b] uppercase'>
          Transparencia electoral
        </p>
      </div>

      <header className='mb-8 space-y-4'>
        <div className='inline-flex items-center gap-1.5 rounded-full border border-[#d0e3f0] bg-[#2f6f9f]/8 px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide text-[#2f6f9f] uppercase'>
          <BookOpen className='size-3.5' aria-hidden='true' />
          Manual para auditores
        </div>
        <h1 className='text-3xl font-extrabold tracking-tight text-[#202124] sm:text-4xl'>
          Manual técnico de transparencia
        </h1>
        <p className='max-w-2xl text-sm leading-relaxed text-[#5f6368] sm:text-base'>
          Cómo leer el Dashboard Público, verificar un recibo criptográfico,
          inspeccionar el Audit Log y contrastar el escrutinio con los eventos
          del smart contract, sin depender de la Autoridad Electoral.
        </p>
      </header>

      <div className='mb-8 grid gap-3 sm:grid-cols-2'>
        <HighlightCard
          icon={<ShieldCheck className='size-4' aria-hidden='true' />}
          title='Escrutinio on-chain'
          text='Resultados y participación leídos de los eventos del contrato.'
        />
        <HighlightCard
          icon={<Calculator className='size-4' aria-hidden='true' />}
          title='Recuento propio'
          text='Los eventos VoteUpdated reconstruyen el cómputo exacto.'
        />
        <HighlightCard
          icon={<ScrollText className='size-4' aria-hidden='true' />}
          title='Audit Log'
          text='Apertura y cierre quedan en un registro que no se puede editar.'
        />
        <HighlightCard
          icon={<Search className='size-4' aria-hidden='true' />}
          title='Recibo y Etherscan'
          text='Inclusión individual, transacciones y raíz Merkle del padrón.'
        />
      </div>

      <nav
        aria-label='Contenido del manual'
        className='mb-8 rounded-2xl border border-[#e4e7eb] bg-white/95 px-6 py-5 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]'
      >
        <p className='text-xs font-semibold tracking-wide text-[#80868b] uppercase'>
          Contenido
        </p>
        <ol className='mt-3 space-y-2 text-sm'>
          {MANUAL_AUDITORES_SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className='font-medium text-[#2f6f9f] hover:underline'
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className='space-y-5'>
        {MANUAL_AUDITORES_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className='scroll-mt-6 rounded-2xl border border-[#e4e7eb] bg-white/95 px-6 py-6 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] sm:px-8'
          >
            <h2 className='text-lg font-bold tracking-tight text-[#202124]'>
              {section.title}
            </h2>
            <div className='mt-3 space-y-3 text-sm leading-relaxed text-[#5f6368]'>
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
            {section.steps ? (
              <ol className='mt-4 list-decimal space-y-2 ps-5 text-sm leading-relaxed text-[#5f6368]'>
                {section.steps.map((step) => (
                  <li key={step.slice(0, 48)}>{step}</li>
                ))}
              </ol>
            ) : null}
            {section.note ? (
              <p
                className={
                  section.noteMono
                    ? 'mt-4 rounded-xl border border-[#d0e3f0] bg-[#2f6f9f]/5 px-4 py-3 font-mono text-xs leading-relaxed break-all text-[#202124]'
                    : 'mt-4 rounded-xl border border-[#d0e3f0] bg-[#2f6f9f]/5 px-4 py-3 text-sm leading-relaxed text-[#202124]'
                }
              >
                {section.note}
              </p>
            ) : null}
          </section>
        ))}
      </div>

      <footer className='mt-10 flex flex-col gap-3 border-t border-[#e4e7eb] pt-6 text-sm'>
        <Link
          to='/verificar'
          className='inline-flex items-center gap-1.5 font-medium text-[#2f6f9f] hover:underline'
        >
          Ir al verificador de recibos
        </Link>
        <Link
          to='/cumplimiento/ley-25326'
          className='inline-flex items-center gap-1.5 font-medium text-[#2f6f9f] hover:underline'
        >
          Cómo se protegen los datos personales (Ley 25.326)
        </Link>
      </footer>
    </div>
  </main>
)

const HighlightCard = ({
  icon,
  title,
  text,
}: {
  icon: ReactNode
  title: string
  text: string
}) => (
  <div className='rounded-2xl border border-[#e4e7eb] bg-white/95 px-4 py-4 shadow-[0_0.5rem_1.5rem_rgba(30,64,95,0.06)]'>
    <div className='mb-2 inline-flex rounded-full bg-[#2f6f9f]/10 p-2 text-[#2f6f9f]'>
      {icon}
    </div>
    <p className='text-sm font-semibold text-[#202124]'>{title}</p>
    <p className='mt-1 text-xs leading-relaxed text-[#5f6368]'>{text}</p>
  </div>
)
