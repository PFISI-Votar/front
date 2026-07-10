// padron-preview-table.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { CAMPOS_PADRON_PREDEFINIDOS } from '../lib/campos-padron'
import type { RegistroPreview } from '../lib/parse-csv-padron'
import { PadronPreviewTable } from './padron-preview-table'

vi.mock('../hooks/use-importar-padron', () => ({
  useImportarPadron: () => ({ mutate: vi.fn(), isPending: false }),
}))

const registros: RegistroPreview[] = [
  { id: '1', linea: 2, dni: '12345678', email: 'a@a.com', adicionales: {} },
  { id: '2', linea: 3, dni: '', email: 'b@b.com', adicionales: {} },
]

async function renderTabla(
  props?: Partial<Parameters<typeof PadronPreviewTable>[0]>
) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <PadronPreviewTable
        idEleccion={7}
        registrosIniciales={registros}
        campos={['dni', 'email']}
        definiciones={CAMPOS_PADRON_PREDEFINIDOS}
        onConfirmado={vi.fn()}
        onCancelar={vi.fn()}
        {...props}
      />
    </QueryClientProvider>
  )
}

describe('PadronPreviewTable', () => {
  it('muestra el conteo de problemas inicial', async () => {
    const screen = await renderTabla()
    await expect
      .element(screen.getByText(/1 con problemas/i))
      .toBeInTheDocument()
  })

  it('borrar una fila actualiza el total', async () => {
    const screen = await renderTabla()
    await userEvent.click(
      screen.getByRole('button', { name: /Borrar fila 3/i })
    )
    await expect.element(screen.getByText(/1 registros/i)).toBeInTheDocument()
  })

  it('editar el DNI ausente recalcula problemas a 0', async () => {
    const screen = await renderTabla()
    const inputDni = screen.getByLabelText(/DNI línea 3/i)
    await userEvent.fill(inputDni, '87654321')
    await expect
      .element(screen.getByText(/0 con problemas/i))
      .toBeInTheDocument()
  })

  it('cancelar invoca onCancelar', async () => {
    const onCancelar = vi.fn()
    const screen = await renderTabla({ onCancelar })
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(onCancelar).toHaveBeenCalledOnce()
  })
})
