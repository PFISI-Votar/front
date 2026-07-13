import type { CSSProperties } from 'react'
import { CircleOff } from 'lucide-react'
import { resolveMediaUrl } from '@/lib/media-url'
import { cn, getDisplayNameInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { RadioGroupItem } from '@/components/ui/radio-group'
import type { CandidatoBoletaDigital } from '@/features/voto/data/schema'

type CandidatoOptionCardProps = {
  candidato: CandidatoBoletaDigital
  selected: boolean
}

export const CandidatoOptionCard = ({
  candidato,
  selected,
}: CandidatoOptionCardProps) => {
  const optionId = `candidato-${candidato.idCategoria}-${candidato.idCandidato}`
  const accessibleName = `${candidato.nombreCompleto}, ${candidato.agrupacionPolitica}, lista ${candidato.numeroLista}`
  const accentColor = candidato.colorLista ?? '#0284c7'

  return (
    <Card
      className={cn(
        'relative h-full overflow-hidden border p-0 shadow-sm transition-all',
        'focus-within:ring-3 focus-within:ring-ring/50',
        selected
          ? 'scale-[1.01] bg-white text-slate-950 shadow-md'
          : 'border-slate-200 bg-white text-slate-950'
      )}
      style={{
        borderColor: selected ? accentColor : undefined,
        boxShadow: selected ? `0 16px 36px ${accentColor}22` : undefined,
      }}
    >
      <span
        className='absolute inset-y-0 left-0 w-1.5'
        style={{ backgroundColor: accentColor }}
        aria-hidden='true'
      />
      <label
        htmlFor={optionId}
        className='flex h-full min-w-0 cursor-pointer items-center gap-3 p-4 pl-5 sm:gap-4'
      >
        <Avatar className='size-16 shrink-0 rounded-xl border border-slate-200 bg-slate-100 grayscale sm:size-20'>
          {candidato.fotoUrl && (
            <AvatarImage
              src={resolveMediaUrl(candidato.fotoUrl)}
              alt={`Foto de ${candidato.nombreCompleto}`}
              className='object-cover'
            />
          )}
          <AvatarFallback
            aria-hidden='true'
            className='rounded-xl text-lg font-semibold text-slate-700'
          >
            {getDisplayNameInitials(candidato.nombreCompleto)}
          </AvatarFallback>
        </Avatar>

        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <p className='text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase'>
            Lista {candidato.numeroLista}
          </p>
          <h3 className='line-clamp-2 max-w-full text-lg leading-tight font-bold break-words sm:text-xl'>
            {candidato.nombreCompleto}
          </h3>
          <div className='flex min-w-0 items-center gap-2 text-sm text-slate-600'>
            {candidato.logoListaUrl ? (
              <img
                src={resolveMediaUrl(candidato.logoListaUrl)}
                alt={`Logotipo de ${candidato.agrupacionPolitica}`}
                className='h-8 w-16 shrink-0 rounded-md border border-slate-200 bg-white object-cover'
              />
            ) : (
              <span
                className='size-3 shrink-0 rounded-sm border border-white shadow-sm'
                style={{ backgroundColor: accentColor }}
                aria-hidden='true'
              />
            )}
            <span className='min-w-0 truncate'>
              {candidato.agrupacionPolitica}
            </span>
          </div>
        </div>

        <RadioGroupItem
          id={optionId}
          value={String(candidato.idCandidato)}
          aria-label={accessibleName}
          className='size-7 shrink-0 border-2 border-slate-400 data-[state=checked]:border-[var(--candidate-color)] data-[state=checked]:text-[var(--candidate-color)]'
          style={
            {
              '--candidate-color': accentColor,
            } as CSSProperties
          }
        />
      </label>
    </Card>
  )
}

export const VotoEnBlancoOptionCard = ({
  optionId,
  selected,
  categoryName,
}: {
  optionId: string
  selected: boolean
  categoryName?: string
}) => {
  const accessibleName = categoryName
    ? `Voto en Blanco para ${categoryName}, no seleccionar ningún candidato`
    : 'Voto en Blanco, no seleccionar ningún candidato'

  return (
    <Card
      className={cn(
        'relative overflow-hidden border border-dashed p-0 shadow-sm transition-all',
        'focus-within:ring-3 focus-within:ring-slate-400/40',
        selected
          ? 'border-slate-700 bg-white shadow-md'
          : 'border-slate-300 bg-slate-50'
      )}
    >
      <label
        htmlFor={optionId}
        className='flex h-full cursor-pointer items-center gap-4 p-4 pl-5'
      >
        <div className='grid size-20 place-items-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-500'>
          <CircleOff className='size-9' aria-hidden='true' />
        </div>
        <div className='flex flex-1 flex-col gap-1'>
          <h3 className='text-xl leading-tight font-bold'>Voto en Blanco</h3>
          <p className='text-sm text-slate-600'>
            No seleccionar ningún candidato
          </p>
        </div>
        <RadioGroupItem
          id={optionId}
          value='__blank__'
          aria-label={accessibleName}
          className='size-7 border-2 border-slate-400'
        />
      </label>
    </Card>
  )
}
