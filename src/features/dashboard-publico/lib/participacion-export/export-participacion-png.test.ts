import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  toBlob: vi.fn(),
  descargarArchivo: vi.fn(),
}))

vi.mock('html-to-image', () => ({
  toBlob: mocks.toBlob,
}))

vi.mock(
  '@/features/dashboard-publico/lib/escrutinio-export/descargar-archivo',
  () => ({
    descargarArchivo: mocks.descargarArchivo,
  })
)

const { exportParticipacionPng } =
  await import('@/features/dashboard-publico/lib/participacion-export/export-participacion-png')

describe('export-participacion-png — VOTAR-376', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('captura el nodo con alta resolución y fondo blanco, y descarga el blob resultante', async () => {
    const fakeBlob = new Blob(['fake-png'], { type: 'image/png' })
    mocks.toBlob.mockResolvedValue(fakeBlob)
    const node = {} as HTMLElement

    await exportParticipacionPng({
      node,
      idEleccion: 9,
      nombreComicio: 'Elección Rectorado',
      exportadoEn: new Date('2026-08-17T00:00:00.000Z'),
    })

    expect(mocks.toBlob).toHaveBeenCalledWith(node, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    })
    expect(mocks.descargarArchivo).toHaveBeenCalledWith(
      fakeBlob,
      'participacion-9-eleccion-rectorado-20260817.png'
    )
  })

  it('lanza un error si toBlob no devuelve un blob válido', async () => {
    mocks.toBlob.mockResolvedValue(null)
    const node = {} as HTMLElement

    await expect(
      exportParticipacionPng({
        node,
        idEleccion: 9,
        nombreComicio: 'Elección Rectorado',
      })
    ).rejects.toThrow(
      'No se pudo generar la imagen PNG de la curva de participación.'
    )
    expect(mocks.descargarArchivo).not.toHaveBeenCalled()
  })
})
