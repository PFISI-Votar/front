import { CandidatoPublicoCard } from '@/features/dashboard-publico/components/candidato-publico-card'
import { ListaPublicaHeader } from '@/features/dashboard-publico/components/lista-publica-header'
import { groupCandidatosByLista } from '@/features/dashboard-publico/lib/candidato-display'
import {
  CATEGORIA_BOLETA_ESTADO,
  type BoletaDigital,
} from '@/features/voto/data/schema'

type OfertaPublicaCatalogProps = {
  oferta: BoletaDigital
}

export const OfertaPublicaCatalog = ({ oferta }: OfertaPublicaCatalogProps) => {
  const categoriasConCandidatos = oferta.categorias
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .filter(
      (categoria) =>
        categoria.estado === CATEGORIA_BOLETA_ESTADO.DISPONIBLE &&
        categoria.candidatos.length > 0
    )

  if (categoriasConCandidatos.length === 0) {
    return (
      <div
        className='rounded-2xl border border-[#e4e7eb] bg-white/95 px-6 py-8 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]'
        role='status'
      >
        <p className='text-sm leading-relaxed text-[#5f6368]'>
          No hay candidatos oficializados disponibles para mostrar en este
          comicio.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {categoriasConCandidatos.map((categoria) => {
        const listas = groupCandidatosByLista(categoria.candidatos)
        const headingId = `categoria-publica-${categoria.idCategoria}`

        return (
          <section
            key={categoria.idCategoria}
            aria-labelledby={headingId}
            className='space-y-4'
          >
            <div className='space-y-1'>
              <h2
                id={headingId}
                className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'
              >
                {categoria.nombre}
              </h2>
              {categoria.descripcion ? (
                <p className='text-sm leading-relaxed text-[#5f6368]'>
                  {categoria.descripcion}
                </p>
              ) : null}
            </div>

            <div className='space-y-5'>
              {listas.map((lista) => (
                <div
                  key={lista.idLista}
                  className='rounded-2xl border border-[#e4e7eb] bg-white/95 px-4 py-4 shadow-[0_0.5rem_1.5rem_rgba(30,64,95,0.06)] sm:px-5'
                >
                  <ListaPublicaHeader lista={lista} />
                  <div className='grid gap-3 sm:grid-cols-2'>
                    {lista.candidatos.map((candidato) => (
                      <CandidatoPublicoCard
                        key={candidato.idCandidato}
                        candidato={candidato}
                        categoriaNombre={categoria.nombre}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
