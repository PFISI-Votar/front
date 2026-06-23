import type { CSSProperties } from 'react'
import { CircleOff } from 'lucide-react'
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
        className='flex h-full cursor-pointer items-center gap-4 p-4 pl-5'
      >
        <Avatar className='size-20 rounded-xl border border-slate-200 bg-slate-100 grayscale'>
          {candidato.fotoUrl && (
            <AvatarImage
              src={candidato.fotoUrl}
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
          <p className='text-[0.65rem] font-semibold tracking-[0.18em] text-slate-500 uppercase'>
            Lista {candidato.numeroLista}
          </p>
          <h3 className='text-xl leading-tight font-bold sm:text-2xl'>
            {candidato.nombreCompleto}
          </h3>
          <div className='flex items-center gap-2 text-sm text-slate-600'>
            <span
              className='size-3 rounded-sm border border-white shadow-sm'
              style={{ backgroundColor: accentColor }}
              aria-hidden='true'
            />
            <span>{candidato.agrupacionPolitica}</span>
          </div>
        </div>

        <RadioGroupItem
          id={optionId}
          value={String(candidato.idCandidato)}
          aria-label={accessibleName}
          className='size-7 border-2 border-slate-400 data-[state=checked]:border-[var(--candidate-color)] data-[state=checked]:text-[var(--candidate-color)]'
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
}: {
  optionId: string
  selected: boolean
}) => (
  <Card
    className={cn(
      'relative overflow-hidden border p-0 shadow-sm transition-all',
      selected ? 'border-slate-700 bg-white shadow-md' : 'border-slate-200 bg-white'
    )}
  >
    <label
      htmlFor={optionId}
      className='flex h-full cursor-pointer items-center gap-4 p-4 pl-5'
    >
      <div className='grid size-20 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-100 text-slate-500'>
        <CircleOff className='size-9' />
      </div>
      <div className='flex flex-1 flex-col gap-1'>
        <h3 className='text-xl leading-tight font-bold'>Voto en Blanco</h3>
        <p className='text-sm text-slate-600'>No seleccionar ningún candidato</p>
      </div>
      <RadioGroupItem
        id={optionId}
        value='__blank__'
        aria-label='Voto en Blanco, no seleccionar ningún candidato'
        className='size-7 border-2 border-slate-400'
      />
    </label>
  </Card>
)
