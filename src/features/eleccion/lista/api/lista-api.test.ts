/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { crearLista } from '@/features/eleccion/lista/api/lista-api'
import type { Lista } from '@/features/eleccion/lista/data/schema'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApiClient = vi.mocked(apiClient)

const lista: Lista = {
  idLista: 42,
  idBoleta: 7,
  nombre: 'Lista Azul',
  sigla: 'LA',
  color: '#2563eb',
  logoUrl: null,
  estado: 'BORRADOR',
  listId: null,
  fechaOficializacion: null,
}

describe('lista-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sube el logo como multipart después de crear la lista', async () => {
    const logoFile = new File(['logo'], 'logo.png', { type: 'image/png' })
    mockedApiClient.post.mockResolvedValue({ data: lista })
    mockedApiClient.patch.mockResolvedValue({
      data: { ...lista, logoUrl: '/logos/42.png' },
    })

    const result = await crearLista(7, {
      nombre: 'Lista Azul',
      sigla: 'LA',
      color: '#2563eb',
      logoFile,
      removeLogo: true,
    })

    expect(mockedApiClient.post).toHaveBeenCalledWith('/elecciones/7/listas', {
      nombre: 'Lista Azul',
      sigla: 'LA',
      color: '#2563eb',
    })
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/listas/42/logo',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    const formData = mockedApiClient.patch.mock.calls[0]?.[1] as FormData
    expect(formData.get('logo')).toBe(logoFile)
    expect(result.logoUrl).toBe('/logos/42.png')
  })

  it('elimina la lista creada si falla la subida del logo', async () => {
    const uploadError = new Error('upload failed')
    mockedApiClient.post.mockResolvedValue({ data: lista })
    mockedApiClient.patch.mockRejectedValue(uploadError)
    mockedApiClient.delete.mockResolvedValue({})

    await expect(
      crearLista(7, {
        nombre: 'Lista Azul',
        sigla: 'LA',
        color: '#2563eb',
        logoFile: new File(['logo'], 'logo.png', { type: 'image/png' }),
      })
    ).rejects.toBe(uploadError)

    expect(mockedApiClient.delete).toHaveBeenCalledWith('/listas/42')
  })
})
