/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearLista } from '@/features/eleccion/lista/api/lista-api'
import type { Lista } from '@/features/eleccion/lista/data/schema'

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
    postMock.mockResolvedValue({ data: lista })
    patchMock.mockResolvedValue({
      data: { ...lista, logoUrl: '/logos/42.png' },
    })

    const result = await crearLista(7, {
      nombre: 'Lista Azul',
      sigla: 'LA',
      color: '#2563eb',
      logoFile,
      removeLogo: true,
    })

    expect(postMock).toHaveBeenCalledWith('/elecciones/7/listas', {
      nombre: 'Lista Azul',
      sigla: 'LA',
      color: '#2563eb',
    })
    expect(patchMock).toHaveBeenCalledWith(
      '/listas/42/logo',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    const formData = patchMock.mock.calls[0]?.[1] as FormData
    expect(formData.get('logo')).toBe(logoFile)
    expect(result.logoUrl).toBe('/logos/42.png')
  })

  it('elimina la lista creada si falla la subida del logo', async () => {
    const uploadError = new Error('upload failed')
    postMock.mockResolvedValue({ data: lista })
    patchMock.mockRejectedValue(uploadError)
    deleteMock.mockResolvedValue({})

    await expect(
      crearLista(7, {
        nombre: 'Lista Azul',
        sigla: 'LA',
        color: '#2563eb',
        logoFile: new File(['logo'], 'logo.png', { type: 'image/png' }),
      })
    ).rejects.toBe(uploadError)

    expect(deleteMock).toHaveBeenCalledWith('/listas/42')
  })
})
