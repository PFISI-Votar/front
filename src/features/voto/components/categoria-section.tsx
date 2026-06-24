import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RadioGroup } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CandidatoOptionCard,
  VotoEnBlancoOptionCard,
} from '@/features/voto/components/candidato-option-card'
import type { CategoriaBoletaDigital } from '@/features/voto/data/schema'

type CategoriaSectionProps = {
  categoria: CategoriaBoletaDigital
  nombreEleccion: string
  selectedCandidatoId?: number
  step: number
  totalSteps: number
  votoEnBlanco?: boolean
  permitirVotoEnBlanco?: boolean
  disabled?: boolean
  onSelect: (idCategoria: number, idCandidato: number) => void
  onVotoEnBlanco?: () => void
}

export const CategoriaSection = ({
  categoria,
  nombreEleccion,
  selectedCandidatoId,
  step,
  totalSteps,
  votoEnBlanco = false,
  permitirVotoEnBlanco = false,
  disabled = false,
  onSelect,
  onVotoEnBlanco,
}: CategoriaSectionProps) => {
  const titleId = `categoria-${categoria.idCategoria}-title`
  const progress = Math.round((step / totalSteps) * 100)
  const grid = (
    <RadioGroup
      aria-labelledby={titleId}
      value={
        votoEnBlanco
          ? '__blank__'
          : selectedCandidatoId
            ? String(selectedCandidatoId)
            : ''
      }
      onValueChange={(value) => {
        if (value === '__blank__') {
          onVotoEnBlanco?.()
          return
        }
        onSelect(categoria.idCategoria, Number(value))
      }}
      disabled={disabled || categoria.candidatos.length === 0}
      className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'
    >
      {categoria.candidatos.map((candidato) => (
        <CandidatoOptionCard
          key={candidato.idCandidato}
          candidato={candidato}
          selected={selectedCandidatoId === candidato.idCandidato}
        />
      ))}
      {permitirVotoEnBlanco && (
        <VotoEnBlancoOptionCard
          optionId={`voto-blanco-${categoria.idCategoria}`}
          selected={votoEnBlanco}
        />
      )}
    </RadioGroup>
  )

  return (
    <section aria-labelledby={titleId} className='space-y-6'>
      <div className='space-y-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='space-y-1'>
            <p className='text-xs font-semibold tracking-[0.22em] text-sky-700 uppercase'>
              {nombreEleccion}
            </p>
            <h2 id={titleId} className='text-3xl leading-tight font-bold'>
              Cargo: {categoria.nombre}
            </h2>
          </div>
          <p className='shrink-0 text-lg text-slate-600'>
            Paso {step} de {totalSteps}
          </p>
        </div>
        <div className='h-2 overflow-hidden rounded-full bg-slate-200'>
          <div
            className='h-full rounded-full bg-sky-500 transition-all'
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className='text-lg leading-relaxed text-slate-700'>
          {categoria.descripcion ??
            'Seleccione una opción para esta categoría. Una vez completada la boleta podrá revisar y confirmar su voto.'}
        </p>
      </div>

      {categoria.candidatos.length === 0 ? (
        <Alert variant='destructive'>
          <AlertCircle className='size-4' aria-hidden='true' />
          <AlertTitle>Sin candidatos disponibles</AlertTitle>
          <AlertDescription>
            Esta categoría no tiene candidatos oficializados en la boleta.
          </AlertDescription>
        </Alert>
      ) : categoria.candidatos.length > 20 ? (
        <ScrollArea className='max-h-[65vh] pe-3'>{grid}</ScrollArea>
      ) : (
        grid
      )}
    </section>
  )
}
