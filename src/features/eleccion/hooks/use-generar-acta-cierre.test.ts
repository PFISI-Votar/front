import { describe, expect, it, vi } from 'vitest'
import { generarYRegistrarActaCierre } from '@/features/eleccion/hooks/use-generar-acta-cierre'

const mocks = vi.hoisted(() => ({
  obtenerActaCierre: vi.fn(),
  registrarHashActaCierre: vi.fn(),
  construirActaCierrePdf: vi.fn(),
  buildActaCierreFilename: vi.fn(() => 'acta-cierre-7.pdf'),
  hashPdfBytesSha256: vi.fn(),
}))

vi.mock('@/features/eleccion/api/eleccion-api', () => ({
  obtenerActaCierre: mocks.obtenerActaCierre,
  registrarHashActaCierre: mocks.registrarHashActaCierre,
}))

vi.mock('@/features/eleccion/lib/generar-acta-cierre-pdf', () => ({
  construirActaCierrePdf: mocks.construirActaCierrePdf,
  buildActaCierreFilename: mocks.buildActaCierreFilename,
}))

vi.mock('@/features/eleccion/lib/pdf-integrity', () => ({
  hashPdfBytesSha256: mocks.hashPdfBytesSha256,
}))

describe('generarYRegistrarActaCierre', () => {
  it('registers the hash before saving, and saves with the derived filename', async () => {
    const callOrder: string[] = []
    const bytes = new ArrayBuffer(8)
    const save = vi.fn(() => callOrder.push('save'))
    const doc = { output: () => bytes, save }

    mocks.obtenerActaCierre.mockResolvedValue({ idEleccion: 7 })
    mocks.construirActaCierrePdf.mockResolvedValue(doc)
    mocks.hashPdfBytesSha256.mockImplementation(async () => {
      callOrder.push('hash')
      return 'a'.repeat(64)
    })
    mocks.registrarHashActaCierre.mockImplementation(async () => {
      callOrder.push('registrarHash')
    })

    await generarYRegistrarActaCierre(7)

    expect(callOrder).toEqual(['hash', 'registrarHash', 'save'])
    expect(mocks.registrarHashActaCierre).toHaveBeenCalledWith(
      7,
      'a'.repeat(64)
    )
    expect(save).toHaveBeenCalledWith('acta-cierre-7.pdf')
  })

  it('does not save the PDF when registering the hash fails', async () => {
    const save = vi.fn()
    const doc = { output: () => new ArrayBuffer(8), save }

    mocks.obtenerActaCierre.mockResolvedValue({ idEleccion: 7 })
    mocks.construirActaCierrePdf.mockResolvedValue(doc)
    mocks.hashPdfBytesSha256.mockResolvedValue('a'.repeat(64))
    mocks.registrarHashActaCierre.mockRejectedValue(new Error('network error'))

    await expect(generarYRegistrarActaCierre(7)).rejects.toThrow(
      'network error'
    )
    expect(save).not.toHaveBeenCalled()
  })
})
