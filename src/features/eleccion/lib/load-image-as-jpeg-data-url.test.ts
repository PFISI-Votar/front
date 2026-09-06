import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadImageAsJpegDataUrl } from '@/features/eleccion/lib/load-image-as-jpeg-data-url'

/** Genera un PNG real (con transparencia) vía canvas, para ejercitar el decoder del navegador. */
const buildPngBlob = async (): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 4
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('2D context no disponible en el entorno de test')
  }
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = 'rgba(37, 99, 235, 0.5)'
  context.fillRect(0, 0, 2, 2)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('toBlob devolvió null'))
      }
    }, 'image/png')
  })
}

describe('loadImageAsJpegDataUrl — VOTAR-466', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('devuelve null cuando la respuesta HTTP no es ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    const result = await loadImageAsJpegDataUrl('/imagenes/inexistente')

    expect(result).toBeNull()
  })

  it('devuelve null cuando fetch lanza (red caída)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network error'))
    )

    const result = await loadImageAsJpegDataUrl('/imagenes/lo-que-sea')

    expect(result).toBeNull()
  })

  it('decodifica una imagen WebP/PNG servida por el backend y la reexporta como JPEG', async () => {
    const blob = await buildPngBlob()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) })
    )

    const result = await loadImageAsJpegDataUrl(
      '/imagenes/3f8c1c2a-5b1e-4a9d-9f0c-2b7e5d6a1c34'
    )

    // jsPDF solo acepta JPEG/PNG: el resultado tiene que quedar como JPEG,
    // aunque la fuente sea WebP o (como en este test) un PNG con alfa.
    expect(result).toMatch(/^data:image\/jpeg;base64,/)
  })
})
