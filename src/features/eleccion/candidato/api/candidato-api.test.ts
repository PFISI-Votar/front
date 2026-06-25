/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { crearCandidato } from '@/features/eleccion/candidato/api/candidato-api'
import type { Candidato } from '@/features/eleccion/candidato/data/schema'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApiClient = vi.mocked(apiClient)

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
    mockedApiClient.post.mockResolvedValue({ data: candidato })
    mockedApiClient.patch.mockResolvedValue({
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

    expect(mockedApiClient.post).toHaveBeenCalledWith('/listas/42/candidatos', {
      nombre: 'Ana',
      apellido: 'López',
      idCategoria: 1,
      orden: 1,
      datosAdicionales: {},
    })
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/candidatos/101/foto',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    const formData = mockedApiClient.patch.mock.calls[0]?.[1] as FormData
    expect(formData.get('foto')).toBe(fotoFile)
    expect(result.fotoUrl).toBe('/fotos/101.jpg')
  })

  it('elimina el candidato creado si falla la subida de la foto', async () => {
    const uploadError = new Error('upload failed')
    mockedApiClient.post.mockResolvedValue({ data: candidato })
    mockedApiClient.patch.mockRejectedValue(uploadError)
    mockedApiClient.delete.mockResolvedValue({})

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

    expect(mockedApiClient.delete).toHaveBeenCalledWith('/candidatos/101')
  })
})
