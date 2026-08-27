import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { ComicioForm } from './comicio-form'

vi.mock('@/components/datetime-picker', () => ({
  DateTimePicker: ({
    value,
    onChange,
    onBlur,
  }: {
    value: string
    onChange: (value: string) => void
    onBlur?: () => void
  }) => (
    <input
      data-testid='datetime-picker'
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  ),
}))

describe('ComicioForm', () => {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function renderForm(
    props?: Partial<React.ComponentProps<typeof ComicioForm>>
  ) {
    return render(
      <ComicioForm
        mode='create'
        submitLabel='Crear comicio'
        onSubmit={onSubmit}
        onCancel={onCancel}
        {...props}
      />
    )
  }

  it('muestra botón Cancelar con icono y lo invoca al hacer clic', async () => {
    await renderForm()

    const cancelar = page.getByRole('button', { name: /Cancelar/i })
    await expect.element(cancelar).toBeInTheDocument()
    expect(cancelar.element().querySelector('svg')).not.toBeNull()

    await userEvent.click(cancelar)
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('muestra el botón de envío con icono a la izquierda', async () => {
    await renderForm()

    const submit = page.getByRole('button', { name: /Crear comicio/i })
    await expect.element(submit).toBeInTheDocument()
    expect(submit.element().querySelector('svg')).not.toBeNull()
    expect(submit.element().firstElementChild?.tagName.toLowerCase()).toBe(
      'svg'
    )
  })

  it('expone las secciones del formulario aprovechando el layout horizontal', async () => {
    await renderForm()

    await expect
      .element(page.getByRole('heading', { name: 'Datos generales' }))
      .toBeInTheDocument()
    await expect
      .element(page.getByRole('heading', { name: 'Modalidad electoral' }))
      .toBeInTheDocument()
    await expect
      .element(page.getByRole('heading', { name: 'Acceso de votantes' }))
      .toBeInTheDocument()
    await expect.element(page.getByText('Nombre')).toBeInTheDocument()
    await expect
      .element(page.getByText('Descripción (opcional)'))
      .toBeInTheDocument()
    await expect
      .element(page.getByText('Observación de login (opcional)'))
      .toBeInTheDocument()
  })
})
