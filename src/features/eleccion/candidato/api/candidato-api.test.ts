/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearCandidato } from '@/features/eleccion/candidato/api/candidato-api'
import type { Candidato } from '@/features/eleccion/candidato/data/schema'

const postMock = vi.fn()
const patchMock = vi.fn()
const deleteMock = vi.fn()

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}))

const candidato: Candidato = {
  idCandidato: 101,
  idLista: 42,
  idCategoria: 1,
  nombre: 'Ana',
  apellido: 'López',
  orden: 1,
  fotoUrl: null,
  datosAdicionales: {},
}

describe('candidato-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sube la foto como multipart después de crear el candidato', async () => {
    const fotoFile = new File(['foto'], 'foto.jpg', { type: 'image/jpeg' })
    postMock.mockResolvedValue({ data: candidato })
    patchMock.mockResolvedValue({
      data: { ...candidato, fotoUrl: '/fotos/101.jpg' },
    })

    const result = await crearCandidato(42, {
      nombre: 'Ana',
      apellido: 'López',
      idCategoria: 1,
      orden: 1,
      datosAdicionales: {},
      fotoFile,
      removeFoto: true,
    })

    expect(postMock).toHaveBeenCalledWith('/listas/42/candidatos', {
      nombre: 'Ana',
      apellido: 'López',
      idCategoria: 1,
      orden: 1,
      datosAdicionales: {},
    })
    expect(patchMock).toHaveBeenCalledWith(
      '/candidatos/101/foto',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    const formData = patchMock.mock.calls[0]?.[1] as FormData
    expect(formData.get('foto')).toBe(fotoFile)
    expect(result.fotoUrl).toBe('/fotos/101.jpg')
  })

  it('elimina el candidato creado si falla la subida de la foto', async () => {
    const uploadError = new Error('upload failed')
    postMock.mockResolvedValue({ data: candidato })
    patchMock.mockRejectedValue(uploadError)
    deleteMock.mockResolvedValue({})

    await expect(
      crearCandidato(42, {
        nombre: 'Ana',
        apellido: 'López',
        idCategoria: 1,
        orden: 1,
        datosAdicionales: {},
        fotoFile: new File(['foto'], 'foto.jpg', { type: 'image/jpeg' }),
      })
    ).rejects.toBe(uploadError)

    expect(deleteMock).toHaveBeenCalledWith('/candidatos/101')
  })
})
