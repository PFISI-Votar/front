import { resolveMediaUrl } from '@/lib/media-url'
import {
  getInitials,
  type ListaPublicaGroup,
} from '@/features/dashboard-publico/lib/candidato-display'

type ListaPublicaHeaderProps = {
  lista: ListaPublicaGroup
}

export const ListaPublicaHeader = ({ lista }: ListaPublicaHeaderProps) => {
  const initials = getInitials(lista.nombre)

  return (
    <div className='mb-3 flex items-center gap-3'>
      {lista.logoUrl ? (
        <img
          src={resolveMediaUrl(lista.logoUrl)}
          alt={`Logo de ${lista.nombre}`}
          className='size-10 shrink-0 rounded-lg object-cover'
        />
      ) : (
        <div
          className='flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white'
          style={{ backgroundColor: lista.color }}
          aria-hidden='true'
        >
          {initials}
        </div>
      )}
      <div className='min-w-0'>
        <p className='truncate text-sm font-semibold text-[#202124]'>
          Lista {lista.numeroLista} — {lista.nombre}
        </p>
        <div
          className='mt-1 h-1 w-16 rounded-full'
          style={{ backgroundColor: lista.color }}
          aria-hidden='true'
        />
      </div>
    </div>
  )
}
