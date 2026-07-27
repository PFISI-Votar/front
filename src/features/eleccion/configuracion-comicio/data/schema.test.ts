/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { guardarConfiguracionRevotoSchema } from '@/features/eleccion/configuracion-comicio/data/schema'

describe('guardarConfiguracionRevotoSchema (VOTAR-324)', () => {
  it('acepta maxVotosPorVotante=10 (tope superior) con re-voto activo', () => {
    const result = guardarConfiguracionRevotoSchema.safeParse({
      permitirVotoMultiple: true,
      maxVotosPorVotante: 10,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza maxVotosPorVotante=11 (fuera de rango)', () => {
    const result = guardarConfiguracionRevotoSchema.safeParse({
      permitirVotoMultiple: true,
      maxVotosPorVotante: 11,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.find((i) => i.path[0] === 'maxVotosPorVotante')
      ).toBeDefined()
    }
  })

  it('rechaza maxVotosPorVotante=1 con re-voto activo (debe ser >= 2)', () => {
    const result = guardarConfiguracionRevotoSchema.safeParse({
      permitirVotoMultiple: true,
      maxVotosPorVotante: 1,
    })
    expect(result.success).toBe(false)
  })
})

describe('guardarConfiguracionRevotoSchema (VOTAR-325)', () => {
  it('acepta minIntervaloSegundos=3600 (tope superior) con re-voto activo', () => {
    const result = guardarConfiguracionRevotoSchema.safeParse({
      permitirVotoMultiple: true,
      maxVotosPorVotante: 2,
      minIntervaloSegundos: 3600,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza minIntervaloSegundos=3601 (fuera de rango)', () => {
    const result = guardarConfiguracionRevotoSchema.safeParse({
      permitirVotoMultiple: true,
      maxVotosPorVotante: 2,
      minIntervaloSegundos: 3601,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.find((i) => i.path[0] === 'minIntervaloSegundos')
      ).toBeDefined()
    }
  })

  it('rechaza minIntervaloSegundos negativo', () => {
    const result = guardarConfiguracionRevotoSchema.safeParse({
      permitirVotoMultiple: true,
      maxVotosPorVotante: 2,
      minIntervaloSegundos: -1,
    })
    expect(result.success).toBe(false)
  })
})
