/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { validateElectoralImageFile } from '@/features/eleccion/shared/utils/image-file'

const ONE_MB = 1024 * 1024
const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])
const JPEG_HEADER = new Uint8Array([0xff, 0xd8, 0xff])

const buildFile = (
  name: string,
  type: string,
  size = ONE_MB,
  content?: Uint8Array
) => {
  const body = content ?? new Uint8Array(size)
  if (!content) {
    const header = name.toLowerCase().endsWith('.png')
      ? PNG_HEADER
      : JPEG_HEADER
    body.set(header.subarray(0, Math.min(header.length, body.length)))
  }
  return new File([body], name, { type })
}

describe('validateElectoralImageFile', () => {
  it.each([
    ['logo.png', 'image/png'],
    ['foto.jpg', 'image/jpeg'],
    ['foto.jpeg', 'image/jpeg'],
  ])('acepta %s con MIME %s hasta 2MB', async (name, type) => {
    await expect(
      validateElectoralImageFile(buildFile(name, type, 2 * ONE_MB))
    ).resolves.toBeNull()
  })

  it.each([
    ['documento.pdf', 'application/pdf'],
    ['animacion.gif', 'image/gif'],
    ['vector.svg', 'image/svg+xml'],
    ['programa.exe', 'application/x-msdownload'],
  ])('rechaza %s', async (name, type) => {
    await expect(
      validateElectoralImageFile(buildFile(name, type))
    ).resolves.toBe('El archivo debe estar en formato PNG o JPG/JPEG.')
  })

  it('rechaza imágenes mayores a 2MB', async () => {
    await expect(
      validateElectoralImageFile(
        buildFile('logo.png', 'image/png', 2 * ONE_MB + 1)
      )
    ).resolves.toBe('La imagen no puede superar los 2MB.')
  })

  it.each([
    ['logo.png', 'application/pdf'],
    ['logo.pdf', 'image/png'],
  ])(
    'rechaza cuando extensión y MIME no coinciden para %s',
    async (name, type) => {
      await expect(
        validateElectoralImageFile(buildFile(name, type))
      ).resolves.toBe('El archivo debe estar en formato PNG o JPG/JPEG.')
    }
  )

  it('rechaza un JPEG real declarado como PNG', async () => {
    const jpegComoPng = buildFile('foto.png', 'image/png', 16, JPEG_HEADER)
    await expect(validateElectoralImageFile(jpegComoPng)).resolves.toBe(
      'La extensión o el tipo declarado no coincide con el formato real de la imagen.'
    )
  })

  it('rechaza un JPG cuyo contenido no tiene magic bytes de JPEG', async () => {
    const pdfComoJpg = buildFile(
      'foto.jpg',
      'image/jpeg',
      32,
      new TextEncoder().encode('%PDF-1.4 contenido falso')
    )

    await expect(validateElectoralImageFile(pdfComoJpg)).resolves.toBe(
      'El contenido del archivo no corresponde a una imagen PNG o JPG/JPEG válida.'
    )
  })
})
