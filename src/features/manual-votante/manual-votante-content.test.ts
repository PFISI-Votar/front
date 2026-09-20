import { describe, expect, it } from 'vitest'
import {
  CABINA_HREF,
  MANUAL_VOTANTE_HREF,
  MANUAL_VOTANTE_PDF_FILENAME,
  MANUAL_VOTANTE_SECTIONS,
  PORTAL_TRANSPARENCIA_HREF,
  VERIFICADOR_HREF,
} from '@/features/manual-votante/manual-votante-content'

const section = (id: string) => {
  const found = MANUAL_VOTANTE_SECTIONS.find((item) => item.id === id)
  if (!found) {
    throw new Error(`Falta la sección ${id}`)
  }
  return found
}

const textOf = (id: string): string => {
  const item = section(id)
  const screenshotText = (item.screenshots ?? []).flatMap((shot) => [
    shot.alt,
    ...(shot.screen ?? []),
  ])
  return [
    item.title,
    ...item.body,
    ...(item.steps ?? []),
    ...screenshotText,
    item.note,
  ]
    .filter(Boolean)
    .join('\n')
}

const flowText = [
  'inicio-sesion',
  'seleccion',
  'firma',
  'recibo',
  'verificacion',
]
  .map((id) => textOf(id))
  .join('\n')

describe('Manual del votante — VOTAR-389', () => {
  it('publica la guía en una ruta anónima y ofrece el PDF', () => {
    expect(MANUAL_VOTANTE_HREF).toBe('/manual/votante')
    expect(MANUAL_VOTANTE_PDF_FILENAME).toBe('manual-votante-bud.pdf')
  })

  it('UAT-01: cubre el flujo completo sin jerga de implementación', () => {
    expect(section('inicio-sesion').uat).toBe('UAT-01')
    expect(section('seleccion').uat).toBe('UAT-01')
    expect(section('firma').uat).toBe('UAT-01')
    expect(section('recibo').uat).toBe('UAT-01')
    expect(flowText).toContain(CABINA_HREF)
    expect(flowText).toContain('Ingresar')
    expect(flowText).toContain('Continuar')
    expect(flowText).toContain('Firmar y confirmar')
    expect(flowText).toContain('Descargar comprobante PDF')
    expect(flowText).not.toContain('nullifier')
    expect(flowText).not.toContain('Keccak')
    expect(flowText).not.toContain('secp256k1')
  })

  it('UAT-02: los rótulos y las capturas coinciden con la cabina y el verificador', () => {
    expect(textOf('inicio-sesion')).toContain('Número de Legajo')
    expect(textOf('inicio-sesion')).toContain('Clave Institucional')
    expect(textOf('inicio-sesion')).toContain('Pantalla de inicio de sesión')
    expect(textOf('seleccion')).toContain('Comenzar a votar')
    expect(textOf('seleccion')).toContain('Votar en blanco')
    expect(textOf('seleccion')).toContain('Listas completas')
    expect(textOf('seleccion')).toContain('Pantalla Antes de votar')
    expect(textOf('seleccion')).toContain('Boleta con listas completas')
    expect(textOf('firma')).toContain('Confirmar Voto')
    expect(textOf('firma')).toContain('Firmar y continuar')
    expect(textOf('firma')).toContain('Firmando voto...')
    expect(textOf('firma')).toContain('Votación pausada')
    expect(textOf('recibo')).toContain('Voto Exitoso')
    expect(textOf('recibo')).toContain('Hash de la transacción')
    expect(textOf('verificacion')).toContain('Verificar inclusión')
    expect(textOf('verificacion')).toContain('Inclusión confirmada')
    expect(textOf('verificacion')).toContain('Verificador con Hash de transacción')

    const flowIds = [
      'inicio-sesion',
      'seleccion',
      'firma',
      'recibo',
      'verificacion',
    ] as const
    for (const id of flowIds) {
      const shots = section(id).screenshots
      expect(shots?.length).toBeGreaterThan(0)
      for (const shot of shots ?? []) {
        expect(shot.src).toMatch(/^\/manual-votante\/.+\.png$/)
        expect(shot.alt.length).toBeGreaterThan(10)
        expect(shot.screen?.length).toBeGreaterThan(0)
      }
    }
    expect(section('inicio-sesion').screenshots?.[0]?.src).toBe(
      '/manual-votante/01-inicio-sesion.png'
    )
    expect(section('verificacion').screenshots?.[0]?.src).toBe(
      '/manual-votante/05-verificacion.png'
    )
  })

  it('UAT-03: explica cómo usar el hash en el Portal de Transparencia', () => {
    const text = textOf('verificacion')
    expect(section('verificacion').uat).toBe('UAT-03')
    expect(section('verificacion').title).toContain('Portal de Transparencia')
    expect(text).toContain(VERIFICADOR_HREF)
    expect(text).toContain(PORTAL_TRANSPARENCIA_HREF)
    expect(text).toContain('Hash de transacción')
    expect(text).toContain('Verificar inclusión')
    expect(text).toContain('Inclusión confirmada')
    expect(text).toContain('no está contabilizado')
    expect(text).toContain('No vas a ver el candidato')
  })

  it('UAT-04: indica cómo recorrer la guía con lector de pantalla', () => {
    const text = textOf('accesibilidad')
    expect(section('accesibilidad').uat).toBe('UAT-04')
    expect(text).toContain('Saltar al contenido')
    expect(text).toContain('lector de pantalla')
    expect(text).toContain('Descargar manual en PDF')
    expect(text).toContain('no una foto')
  })

  it('ordena el flujo de la cabina antes de la verificación', () => {
    const ids = MANUAL_VOTANTE_SECTIONS.map((item) => item.id)
    expect(ids.indexOf('inicio-sesion')).toBeLessThan(ids.indexOf('seleccion'))
    expect(ids.indexOf('seleccion')).toBeLessThan(ids.indexOf('firma'))
    expect(ids.indexOf('firma')).toBeLessThan(ids.indexOf('recibo'))
    expect(ids.indexOf('recibo')).toBeLessThan(ids.indexOf('verificacion'))
  })
})
