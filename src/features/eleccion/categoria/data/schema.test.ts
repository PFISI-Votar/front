/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { createCategoriaSchema } from '@/features/eleccion/categoria/data/schema'

describe('createCategoriaSchema', () => {
  it('acepta payload válido completo', () => {
    const result = createCategoriaSchema.safeParse({
      nombre: 'Presidente',
      descripcion: 'Cargo principal',
      cantidadCargos: 1,
      orden: 1,
    })
    expect(result.success).toBe(true)
  })

  it('acepta payload válido sin descripción', () => {
    const result = createCategoriaSchema.safeParse({
      nombre: 'Presidente',
      cantidadCargos: 1,
      orden: 1,
    })
    expect(result.success).toBe(true)
  })

  it('acepta nombre con exactamente 100 caracteres', () => {
    const result = createCategoriaSchema.safeParse({
      nombre: 'A'.repeat(100),
      cantidadCargos: 1,
      orden: 1,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza nombre vacío', () => {
    const result = createCategoriaSchema.safeParse({
      nombre: '',
      cantidadCargos: 1,
      orden: 1,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'nombre')
      expect(issue?.message).toContain('obligatorio')
    }
  })

  it('rechaza nombre con más de 100 caracteres', () => {
    const result = createCategoriaSchema.safeParse({
      nombre: 'A'.repeat(101),
      cantidadCargos: 1,
      orden: 1,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'nombre')
      expect(issue?.message).toContain('100 caracteres')
    }
  })

  it('rechaza cantidadCargos menor a 1', () => {
    const result = createCategoriaSchema.safeParse({
      nombre: 'Presidente',
      cantidadCargos: 0,
      orden: 1,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'cantidadCargos')
      expect(issue?.message).toContain('al menos 1')
    }
  })

  it('rechaza orden menor a 1', () => {
    const result = createCategoriaSchema.safeParse({
      nombre: 'Presidente',
      cantidadCargos: 1,
      orden: 0,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'orden')
      expect(issue?.message).toContain('al menos 1')
    }
  })

  it('rechaza cantidadCargos decimal', () => {
    const result = createCategoriaSchema.safeParse({
      nombre: 'Presidente',
      cantidadCargos: 1.5,
      orden: 1,
    })
    expect(result.success).toBe(false)
  })

  it('rechaza descripción con más de 500 caracteres', () => {
    const result = createCategoriaSchema.safeParse({
      nombre: 'Presidente',
      descripcion: 'A'.repeat(501),
      cantidadCargos: 1,
      orden: 1,
    })
    expect(result.success).toBe(false)
  })
})