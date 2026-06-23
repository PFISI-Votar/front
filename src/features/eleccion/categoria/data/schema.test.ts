/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { createCategoriaFormSchema } from '@/features/eleccion/categoria/data/schema'

const buildValidInput = () => ({
  nombre: 'Vicepresidente',
  descripcion: '',
  minimoPostulantes: 0,
  maximoPostulantes: 1,
})

describe('createCategoriaFormSchema', () => {
  it('rechaza nombres duplicados en el mismo comicio', () => {
    const schema = createCategoriaFormSchema({
      categorias: [{ idCategoria: 1, nombre: 'Presidente' }],
    })

    const result = schema.safeParse({
      ...buildValidInput(),
      nombre: 'Presidente',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['nombre'])
    }
  })

  it('ignora la categoría en edición al validar duplicados', () => {
    const schema = createCategoriaFormSchema({
      categorias: [{ idCategoria: 1, nombre: 'Presidente' }],
      excludeIdCategoria: 1,
    })

    const result = schema.safeParse({
      ...buildValidInput(),
      nombre: 'Presidente',
    })

    expect(result.success).toBe(true)
  })

  it('rechaza duplicados sin distinguir mayúsculas', () => {
    const schema = createCategoriaFormSchema({
      categorias: [{ idCategoria: 1, nombre: 'presidente' }],
    })

    const result = schema.safeParse({
      ...buildValidInput(),
      nombre: 'Presidente',
    })

    expect(result.success).toBe(false)
  })
})
