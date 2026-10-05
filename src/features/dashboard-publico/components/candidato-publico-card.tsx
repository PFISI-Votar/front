import { resolveMediaUrl } from '@/lib/media-url'
import { toUntrustedPlainText } from '@/lib/untrusted-html'
import { getInitials } from '@/features/dashboard-publico/lib/candidato-display'
import type { CandidatoBoletaDigital } from '@/features/voto/data/schema'

type CandidatoPublicoCardProps = {
  candidato: CandidatoBoletaDigital
  categoriaNombre: string
}

export const CandidatoPublicoCard = ({
  candidato,
  categoriaNombre,
}: CandidatoPublicoCardProps) => {
  const nombreCompleto = toUntrustedPlainText(candidato.nombreCompleto)
  const categoria = toUntrustedPlainText(categoriaNombre)
  const agrupacion = toUntrustedPlainText(candidato.agrupacionPolitica)
  const initials = getInitials(nombreCompleto)
  const accent = candidato.colorLista || '#2f6f9f'

  return (
    <article
      className='flex items-center gap-3 rounded-xl border border-[#e4e7eb] bg-white px-3 py-3 shadow-sm'
      aria-label={`${nombreCompleto}, ${categoria}, ${agrupacion}`}
    >
      {candidato.fotoUrl ? (
        <img
          src={resolveMediaUrl(candidato.fotoUrl)}
          alt={`Foto de ${nombreCompleto}`}
          className='size-14 shrink-0 rounded-full object-cover'
        />
      ) : (
        <div
          className='flex size-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white'
          style={{ backgroundColor: accent }}
          aria-hidden='true'
        >
          {initials}
        </div>
      )}
      <div className='min-w-0 space-y-0.5'>
        <p className='truncate text-sm font-semibold text-[#202124]'>
          {nombreCompleto}
        </p>
        <p className='truncate text-xs text-[#5f6368]'>{categoria}</p>
        <p className='truncate text-xs font-medium text-[#2f6f9f]'>
          Lista {candidato.numeroLista} · {agrupacion}
        </p>
      </div>
    </article>
  )
}
