/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { getCategoriasDisponibles } from '@/features/eleccion/candidato/utils/categorias-disponibles'
import type { CategoriaElectoral } from '@/features/eleccion/categoria/data/schema'

const categorias: CategoriaElectoral[] = [
  {
    idCategoria: 1,
    nombre: 'Presidente',
    minimoPostulantes: 0,
    maximoPostulantes: 1,
    orden: 1,
  },
  {
    idCategoria: 2,
    nombre: 'Vocal',
    minimoPostulantes: 0,
    maximoPostulantes: 2,
    orden: 2,
  },
]

describe('getCategoriasDisponibles', () => {
  it('excluye categorías sin cupo en la lista', () => {
    const candidatos = [{ idCategoria: 1, idCandidato: 10 }]
    const disponibles = getCategoriasDisponibles(categorias, candidatos)

    expect(disponibles).toHaveLength(1)
    expect(disponibles[0].nombre).toBe('Vocal')
  })

  it('incluye la categoría actual al editar aunque esté al límite', () => {
    const candidatos = [{ idCategoria: 1, idCandidato: 10 }]
    const disponibles = getCategoriasDisponibles(categorias, candidatos, {
      includeCategoriaId: 1,
      excludeCandidatoId: 10,
    })

    expect(disponibles.map((item) => item.idCategoria)).toContain(1)
  })
})
