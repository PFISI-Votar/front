/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { validateElectoralImageFile } from '@/features/eleccion/shared/utils/image-file'

const ONE_MB = 1024 * 1024

const buildFile = (name: string, type: string, size = ONE_MB) =>
  new File([new Uint8Array(size)], name, { type })

describe('validateElectoralImageFile', () => {
  it.each([
    ['logo.png', 'image/png'],
    ['foto.jpg', 'image/jpeg'],
    ['foto.jpeg', 'image/jpeg'],
  ])('acepta %s con MIME %s hasta 2MB', (name, type) => {
    expect(
      validateElectoralImageFile(buildFile(name, type, 2 * ONE_MB))
    ).toBeNull()
  })

  it.each([
    ['documento.pdf', 'application/pdf'],
    ['animacion.gif', 'image/gif'],
    ['vector.svg', 'image/svg+xml'],
    ['programa.exe', 'application/x-msdownload'],
  ])('rechaza %s', (name, type) => {
    expect(validateElectoralImageFile(buildFile(name, type))).toBe(
      'El archivo debe estar en formato PNG o JPG/JPEG.'
    )
  })

  it('rechaza imágenes mayores a 2MB', () => {
    expect(
      validateElectoralImageFile(
        buildFile('logo.png', 'image/png', 2 * ONE_MB + 1)
      )
    ).toBe('La imagen no puede superar los 2MB.')
  })

  it.each([
    ['logo.png', 'application/pdf'],
    ['logo.pdf', 'image/png'],
  ])('rechaza cuando extensión y MIME no coinciden para %s', (name, type) => {
    expect(validateElectoralImageFile(buildFile(name, type))).toBe(
      'El archivo debe estar en formato PNG o JPG/JPEG.'
    )
  })
})
