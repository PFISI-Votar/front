/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { createCandidatoFormSchema } from '@/features/eleccion/candidato/data/schema'

const camposConfig = [
  {
    clave: 'legajo_utn',
    etiqueta: 'Legajo UTN',
    tipo: 'texto' as const,
    obligatorio: true,
    orden: 1,
  },
]

const buildValidInput = () => ({
  nombre: 'Ana',
  apellido: 'López',
  idCategoria: 1,
  orden: 1,
  datosAdicionales: {
    legajo_utn: '14988',
  },
})

describe('createCandidatoFormSchema', () => {
  it('rechaza legajos duplicados en el mismo comicio', () => {
    const schema = createCandidatoFormSchema({
      camposConfig,
      candidatosEnComicio: [
        {
          idCandidato: 1,
          datosAdicionales: { legajo_utn: '14988' },
        },
      ],
    })

    const result = schema.safeParse(buildValidInput())

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual([
        'datosAdicionales',
        'legajo_utn',
      ])
    }
  })

  it('ignora el candidato en edición al validar duplicados', () => {
    const schema = createCandidatoFormSchema({
      camposConfig,
      candidatosEnComicio: [
        {
          idCandidato: 1,
          datosAdicionales: { legajo_utn: '14988' },
        },
      ],
      excludeCandidatoId: 1,
    })

    const result = schema.safeParse(buildValidInput())

    expect(result.success).toBe(true)
  })

  it('rechaza duplicados sin distinguir mayúsculas', () => {
    const schema = createCandidatoFormSchema({
      camposConfig,
      candidatosEnComicio: [
        {
          idCandidato: 1,
          datosAdicionales: { legajo_utn: '14988' },
        },
      ],
    })

    const result = schema.safeParse({
      ...buildValidInput(),
      datosAdicionales: { legajo_utn: ' 14988 ' },
    })

    expect(result.success).toBe(false)
  })
})
