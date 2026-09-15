import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import type { CategoriaElectoral } from '@/features/eleccion/categoria/data/schema'
import { PREVIOUS_ELECTORAL_IMAGE_NOTE } from '@/features/eleccion/shared/utils/image-file'
import { CandidatoForm } from './candidato-form'

const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

const pngFile = (name: string, size = 64) => {
  const bytes = new Uint8Array(size)
  bytes.set(PNG_HEADER)
  return new File([bytes], name, { type: 'image/png' })
}

const mockCategorias: CategoriaElectoral[] = [
  {
    idCategoria: 1,
    nombre: 'Presidente',
    minimoPostulantes: 1,
    maximoPostulantes: 1,
    orden: 1,
  },
]

describe('CandidatoForm', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function renderForm(
    props?: Partial<React.ComponentProps<typeof CandidatoForm>>
  ) {
    return render(
      <CandidatoForm
        categorias={mockCategorias}
        candidatosEnLista={[]}
        candidatosEnComicio={[]}
        camposConfig={[]}
        submitLabel='Registrar candidato'
        onSubmit={onSubmit}
        onCancel={onCancel}
        {...props}
      />
    )
  }

  it('renderiza Cancelar y Submit en el mismo contenedor de acciones', async () => {
    await renderForm()

    const cancelar = page.getByRole('button', { name: /Cancelar/i })
    const submit = page.getByRole('button', { name: /Registrar candidato/i })

    await expect.element(cancelar).toBeInTheDocument()
    await expect.element(submit).toBeInTheDocument()

    const actionsContainer = cancelar.element().parentElement
    expect(actionsContainer).not.toBeNull()
    expect(actionsContainer).toBe(submit.element().parentElement)
    expect(actionsContainer?.className).toContain('flex')
    expect(actionsContainer?.className).toContain('w-full')
    expect(cancelar.element().className).toContain('flex-1')
    expect(submit.element().className).toContain('flex-1')
  })

  it('invoca onCancel al hacer clic en Cancelar', async () => {
    await renderForm()

    await userEvent.click(page.getByRole('button', { name: /Cancelar/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('deshabilita Cancelar cuando isActionsDisabled es true', async () => {
    await renderForm({ isActionsDisabled: true })

    const cancelar = page.getByRole('button', { name: /Cancelar/i })
    await expect.element(cancelar).toBeDisabled()
  })

  it('limpia el input de archivo tras subir una imagen inválida y mantiene habilitado el botón (VOTAR-490)', async () => {
    await renderForm()

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement

    const archivoGrande = new File(
      [new Uint8Array(3 * 1024 * 1024)],
      'grande.png',
      { type: 'image/png' }
    )
    await userEvent.upload(fileInput, archivoGrande)

    await expect.element(page.getByRole('alert')).toBeInTheDocument()
    expect(
      (document.querySelector('input[type="file"]') as HTMLInputElement).value
    ).toBe('')

    await expect
      .element(page.getByRole('button', { name: /Registrar candidato/i }))
      .toBeEnabled()
  })

  it('si ya había una foto válida, un archivo inválido no reemplaza lo que se envía (VOTAR-490)', async () => {
    await renderForm({
      defaultValues: {
        nombre: 'Ana',
        apellido: 'Perez',
        idCategoria: 1,
        datosAdicionales: {},
      },
    })

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await userEvent.upload(fileInput, pngFile('ok.png'))
    await userEvent.upload(
      fileInput,
      new File([new TextEncoder().encode('%PDF-1.4')], 'falsa.jpg', {
        type: 'image/jpeg',
      })
    )

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent(PREVIOUS_ELECTORAL_IMAGE_NOTE)
    expect(
      (document.querySelector('input[type="file"]') as HTMLInputElement).value
    ).toBe('')

    await userEvent.click(
      page.getByRole('button', { name: /Registrar candidato/i })
    )
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0]?.[0].fotoFile?.name).toBe('ok.png')
  })

  it('mantiene el label Registrar candidato en el botón de envío', async () => {
    await renderForm()

    await expect
      .element(page.getByRole('button', { name: /Registrar candidato/i }))
      .toBeInTheDocument()
  })
})
