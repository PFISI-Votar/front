import { useEffect, useState } from 'react'
import { BookOpen, Download, ExternalLink, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  VOTAR_LIGHT_SURFACE_CLASS,
  VotarLoginBackground,
} from '@/features/auth/sign-in/components/login-screen-shared'
import { CumplimientoLey25326Link } from '@/features/cumplimiento'
import { generarManualVotantePdf } from '@/features/manual-votante/lib/generar-manual-votante-pdf'
import {
  MANUAL_VOTANTE_SECTIONS,
  VERIFICADOR_HREF,
} from '@/features/manual-votante/manual-votante-content'

/**
 * VOTAR-389 — Guía interactiva del votante para la Boleta Única Digital.
 * Pública: no requiere sesión. Accesible desde el login y la cabina.
 */
export const ManualVotantePage = () => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'VOTAR - Manual del votante'
    return () => {
      document.title = previousTitle
    }
  }, [])

  const handleDownload = () => {
    setIsDownloading(true)
    setDownloadError(null)
    void (async () => {
      try {
        await generarManualVotantePdf()
      } catch {
        setDownloadError(
          'No se pudo generar el PDF. Podés seguir leyendo esta guía en la página.'
        )
      } finally {
        setIsDownloading(false)
      }
    })()
  }

  return (
    <main
      className={`relative min-h-svh overflow-hidden bg-[#fdfcfa] ${VOTAR_LIGHT_SURFACE_CLASS}`}
    >
      <a
        href='#contenido'
        className='sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-30 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#2f6f9f] focus:ring-2 focus:ring-[#2f6f9f]'
      >
        Saltar al contenido
      </a>
      <VotarLoginBackground />
      <div className='relative mx-auto flex min-h-svh w-full max-w-5xl flex-col px-4 py-8 sm:px-6 sm:py-12'>
        <div className='mb-8 flex flex-wrap items-center justify-between gap-4'>
          <p className='text-2xl leading-none font-extrabold tracking-tight text-[#2f6f9f]'>
            VOTAR
          </p>
          <Button
            type='button'
            variant='outline'
            className='rounded-full border-[#c9cdd2] bg-white/95'
            onClick={handleDownload}
            disabled={isDownloading}
            aria-busy={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className='size-4 animate-spin' aria-hidden='true' />
            ) : (
              <Download className='size-4' aria-hidden='true' />
            )}
            Descargar manual en PDF
          </Button>
        </div>

        <header className='mb-8 max-w-2xl space-y-4'>
          <div className='inline-flex items-center gap-1.5 rounded-full border border-[#d0e3f0] bg-[#2f6f9f]/8 px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide text-[#2f6f9f] uppercase'>
            <BookOpen className='size-3.5' aria-hidden='true' />
            Guía de la cabina
          </div>
          <h1 className='text-3xl font-extrabold tracking-tight text-[#202124] sm:text-4xl'>
            Manual del votante
          </h1>
          <p className='text-sm leading-relaxed text-[#3c4043] sm:text-base'>
            Cómo entrar a la Boleta Única Digital, elegir el voto, firmarlo,
            guardar el comprobante y comprobar en el Portal de Transparencia que
            fue contabilizado. Podés leerla acá o descargarla en PDF.
          </p>
        </header>

        {downloadError ? (
          <Alert variant='destructive' className='mb-6'>
            <AlertTitle>No se pudo descargar el PDF</AlertTitle>
            <AlertDescription>{downloadError}</AlertDescription>
          </Alert>
        ) : null}

        <div className='grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]'>
          <nav
            aria-label='Contenido del manual'
            className='rounded-2xl border border-[#e4e7eb] bg-white/95 px-5 py-4 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] lg:sticky lg:top-6'
          >
            <p className='text-xs font-semibold tracking-wide text-[#3c4043] uppercase'>
              Contenido
            </p>
            <ol className='mt-3 space-y-2 text-sm'>
              {MANUAL_VOTANTE_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className='font-medium text-[#2f6f9f] underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-[#2f6f9f]/30 focus-visible:outline-none'
                  >
                    {section.step ? `${section.step}. ` : ''}
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div id='contenido' className='space-y-5'>
            {MANUAL_VOTANTE_SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-titulo`}
                className='scroll-mt-6 rounded-2xl border border-[#e4e7eb] bg-white/95 px-5 py-6 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] sm:px-7'
              >
                <div className='flex items-start gap-3'>
                  {section.step ? (
                    <span
                      className='grid size-10 shrink-0 place-items-center rounded-full bg-[#2f6f9f] text-sm font-bold text-white'
                      aria-hidden='true'
                    >
                      {section.step}
                    </span>
                  ) : null}
                  <div className='min-w-0'>
                    <h2
                      id={`${section.id}-titulo`}
                      className='text-lg font-bold tracking-tight text-[#202124]'
                    >
                      {section.title}
                    </h2>
                  </div>
                </div>

                <div className='mt-4 space-y-3 text-sm leading-relaxed text-[#3c4043]'>
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>

                {section.steps ? (
                  <ol className='mt-4 list-decimal space-y-2 ps-5 text-sm leading-relaxed text-[#3c4043]'>
                    {section.steps.map((step) => (
                      <li key={step.slice(0, 48)}>{step}</li>
                    ))}
                  </ol>
                ) : null}

                {section.screenshots && section.screenshots.length > 0 ? (
                  <div className='mt-4 grid gap-4'>
                    {section.screenshots.map((shot) => (
                      <figure
                        key={shot.src}
                        className='overflow-hidden rounded-xl border border-[#d0e3f0] bg-[#f7fbfd]'
                      >
                        <img
                          src={shot.src}
                          alt={shot.alt}
                          className='h-auto w-full'
                          loading='lazy'
                        />
                        <figcaption className='border-t border-[#d0e3f0] px-4 py-2 text-xs leading-relaxed text-[#5f6368]'>
                          {shot.alt}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : null}

                {section.screen ? (
                  <details className='mt-4 rounded-xl border border-[#d0e3f0] bg-[#f7fbfd] px-4 py-3'>
                    <summary className='cursor-pointer text-sm font-semibold text-[#2f6f9f] focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-[#2f6f9f]/30 focus-visible:outline-none'>
                      Textos exactos de la pantalla
                    </summary>
                    <ul className='mt-3 space-y-1 text-sm text-[#202124]'>
                      {section.screen.map((label) => (
                        <li key={label}>{label}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                {section.note ? (
                  <p className='mt-4 rounded-xl border border-[#d0e3f0] bg-[#2f6f9f]/5 px-4 py-3 text-sm leading-relaxed text-[#202124]'>
                    {section.note}
                  </p>
                ) : null}
              </section>
            ))}
          </div>
        </div>

        <footer className='mt-10 flex flex-col gap-3 border-t border-[#e4e7eb] pt-6 text-sm'>
          <Button
            type='button'
            variant='outline'
            className='w-fit rounded-full border-[#c9cdd2] bg-white/95'
            onClick={handleDownload}
            disabled={isDownloading}
            aria-busy={isDownloading}
          >
            <Download className='size-4' aria-hidden='true' />
            Descargar manual en PDF
          </Button>
          <a
            href={VERIFICADOR_HREF}
            className='inline-flex items-center gap-1.5 font-medium text-[#2f6f9f] hover:underline focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-[#2f6f9f]/30 focus-visible:outline-none'
          >
            Ir al verificador del Portal de Transparencia
            <ExternalLink className='size-3.5' aria-hidden='true' />
          </a>
          <CumplimientoLey25326Link />
        </footer>
      </div>
    </main>
  )
}
