/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { METODOS_AUTENTICACION } from '@/features/eleccion/configuracion-comicio/data/constants'
import { createComicioSchema } from '@/features/eleccion/data/schema'
import { TIPOS_VOTACION } from '@/features/eleccion/lista/data/schema'

const buildValidInput = () => ({
  nombre: 'Elección 2026',
  descripcion: '',
  fechaInicio: new Date(Date.now() + 86400000).toISOString(),
  fechaFin: new Date(Date.now() + 172800000).toISOString(),
  tipoVotacion: TIPOS_VOTACION.POR_LISTA,
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
        (issue) => issue.path[0] === 'fechaFin'
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
        (issue) => issue.path[0] === 'fechaInicio'
      )
      expect(fechaInicioIssue?.message).toContain('posterior al momento actual')
    }
  })

  it('rechaza cierre en el pasado', () => {
    const input = buildValidInput()
    input.fechaInicio = new Date(Date.now() + 172800000).toISOString()
    input.fechaFin = new Date(Date.now() - 86400000).toISOString()

    const result = createComicioSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      const fechaFinIssue = result.error.issues.find(
        (issue) =>
          issue.path[0] === 'fechaFin' &&
          issue.message.includes('posterior al momento actual')
      )
      expect(fechaFinIssue).toBeDefined()
    }
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

  it('VOTAR-454: rechaza observación de login demasiado larga', () => {
    const input = buildValidInput()
    const result = createComicioSchema.safeParse({
      ...input,
      observacionLogin: 'a'.repeat(1001),
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find(
        (item) => item.path[0] === 'observacionLogin'
      )
      expect(issue?.message).toContain('Máximo')
    }
  })
})
