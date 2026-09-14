import { BookOpen, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MANUAL_AUTORIDAD_SECTIONS } from '@/features/manual-autoridad/manual-autoridad-content'

/**
 * VOTAR-395 — Manual operativo del Panel. Solo se monta bajo
 * `/_authenticated`, que exige sesión y rol `election_admin`.
 */
export const ManualAutoridadPage = () => (
  <>
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap items-center gap-2'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Manual de la Autoridad Electoral
        </h1>
        <Badge variant='secondary' className='gap-1'>
          <ShieldCheck className='size-3' aria-hidden='true' />
          Solo autoridad electoral
        </Badge>
      </div>
      <p className='max-w-3xl text-muted-foreground'>
        Cómo crear, oficializar, abrir, pausar, cerrar y archivar un comicio
        desde el Panel de Gestión. Visible únicamente con sesión de
        administrador.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <BookOpen className='size-4' aria-hidden='true' />
          Contenido
        </CardTitle>
        <CardDescription>
          Cada sección cita los botones y avisos reales del panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className='list-decimal space-y-2 ps-5 text-sm'>
          {MANUAL_AUTORIDAD_SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className='font-medium hover:underline'
              >
                {section.title}
                {section.uat ? ` (${section.uat})` : ''}
              </a>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>

    {MANUAL_AUTORIDAD_SECTIONS.map((section) => (
      <section key={section.id} id={section.id} className='scroll-mt-20'>
        <Card>
          <CardHeader>
            <div className='flex flex-wrap items-center gap-2'>
              <CardTitle className='text-lg'>{section.title}</CardTitle>
              {section.uat ? (
                <Badge variant='outline'>{section.uat}</Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className='space-y-4 text-sm leading-relaxed text-muted-foreground'>
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
            {section.steps ? (
              <ol className='list-decimal space-y-2 ps-5'>
                {section.steps.map((step) => (
                  <li key={step.slice(0, 48)}>{step}</li>
                ))}
              </ol>
            ) : null}
            {section.note ? (
              <p className='rounded-lg border bg-muted/40 px-4 py-3 text-foreground'>
                {section.note}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>
    ))}
  </>
)
