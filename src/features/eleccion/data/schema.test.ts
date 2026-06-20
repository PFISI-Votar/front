/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { createComicioSchema } from '@/features/eleccion/data/schema'
import { METODOS_AUTENTICACION } from '@/features/eleccion/configuracion-comicio/data/constants'
import { TIPOS_VOTACION } from '@/features/eleccion/lista/data/schema'

const buildValidInput = () => ({
  nombre: 'Elección 2026',
  descripcion: '',
  fechaInicio: new Date(Date.now() + 86400000).toISOString(),
  fechaFin: new Date(Date.now() + 172800000).toISOString(),
  tipoVotacion: TIPOS_VOTACION.POR_LISTA,
  roles: [{ nombre: 'Presidente', maximoPostulantes: 1 }],
  metodosAutenticacion: [METODOS_AUTENTICACION.SSO_INSTITUCIONAL],
})

describe('createComicioSchema', () => {
  it('UAT-02: rechaza cierre anterior a apertura', () => {
    const input = buildValidInput()
    input.fechaInicio = new Date(Date.now() + 172800000).toISOString()
    input.fechaFin = new Date(Date.now() + 86400000).toISOString()

    const result = createComicioSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      const fechaFinIssue = result.error.issues.find(
        (issue) => issue.path[0] === 'fechaFin',
      )
      expect(fechaFinIssue?.message).toContain('posterior a la de inicio')
    }
  })

  it('UAT-03: rechaza apertura en el pasado', () => {
    const input = buildValidInput()
    input.fechaInicio = new Date(Date.now() - 86400000).toISOString()

    const result = createComicioSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      const fechaInicioIssue = result.error.issues.find(
        (issue) => issue.path[0] === 'fechaInicio',
      )
      expect(fechaInicioIssue?.message).toContain('posterior al momento actual')
    }
  })

  it('UAT-04: rechaza roles vacíos', () => {
    const input = buildValidInput()
    input.roles = []

    const result = createComicioSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('UAT-04: rechaza sin métodos de autenticación', () => {
    const input = buildValidInput()
    input.metodosAutenticacion = []

    const result = createComicioSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('acepta payload válido completo', () => {
    const result = createComicioSchema.safeParse(buildValidInput())
    expect(result.success).toBe(true)
  })
})
