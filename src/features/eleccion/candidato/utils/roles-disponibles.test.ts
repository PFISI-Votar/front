import { describe, expect, it } from 'vitest'
import { getRolesDisponibles } from '@/features/eleccion/candidato/utils/roles-disponibles'
import type { RolCandidato } from '@/features/eleccion/data/schema'

const roles: RolCandidato[] = [
  { idCategoria: 1, nombre: 'Presidente', maximoPostulantes: 1, orden: 1 },
  { idCategoria: 2, nombre: 'Vicepresidente', maximoPostulantes: 2, orden: 2 },
]

describe('getRolesDisponibles', () => {
  it('excluye roles sin cupo en la lista', () => {
    const candidatos = [{ idCandidato: 10, idCategoria: 1 }]
    const disponibles = getRolesDisponibles(roles, candidatos)
    expect(disponibles).toHaveLength(1)
    expect(disponibles[0].idCategoria).toBe(2)
  })

  it('mantiene el rol actual en edición aunque esté al límite', () => {
    const candidatos = [{ idCandidato: 10, idCategoria: 1 }]
    const disponibles = getRolesDisponibles(roles, candidatos, {
      excludeCandidatoId: 10,
      includeCategoriaId: 1,
    })
    expect(disponibles.map((rol) => rol.idCategoria)).toEqual([1, 2])
  })
})
