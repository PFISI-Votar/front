import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import type { CategoriaElectoral } from '@/features/eleccion/categoria/data/schema'
import { CandidatoForm } from './candidato-form'

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

  it('mantiene el label Registrar candidato en el botón de envío', async () => {
    await renderForm()

    await expect
      .element(page.getByRole('button', { name: /Registrar candidato/i }))
      .toBeInTheDocument()
  })
})
