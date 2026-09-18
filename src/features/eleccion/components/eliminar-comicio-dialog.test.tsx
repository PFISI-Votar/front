import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { EliminarComicioDialog } from './eliminar-comicio-dialog'

const NOMBRE_ELECCION = 'Elección Provincial 2025'

describe('EliminarComicioDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra título, aviso, input y botón de confirmar deshabilitado', async () => {
    const { getByRole, getByText } = await render(
      <EliminarComicioDialog
        open
        onOpenChange={vi.fn()}
        nombreEleccion={NOMBRE_ELECCION}
        onConfirm={vi.fn()}
      />
    )

    await expect
      .element(getByRole('heading', { name: '¿Eliminar el comicio?' }))
      .toBeInTheDocument()
    await expect.element(getByText(/Esta acción es/)).toBeInTheDocument()
    await expect
      .element(
        getByRole('textbox', {
          name: `Escribí ${NOMBRE_ELECCION} para confirmar`,
        })
      )
      .toBeInTheDocument()

    const confirmButton = getByRole('button', { name: 'Sí, eliminar comicio' })
    await expect.element(confirmButton).toBeDisabled()
  })

  it('mantiene el botón deshabilitado con texto incorrecto', async () => {
    const { getByRole } = await render(
      <EliminarComicioDialog
        open
        onOpenChange={vi.fn()}
        nombreEleccion={NOMBRE_ELECCION}
        onConfirm={vi.fn()}
      />
    )

    const confirmInput = getByRole('textbox', {
      name: `Escribí ${NOMBRE_ELECCION} para confirmar`,
    })
    const confirmButton = getByRole('button', { name: 'Sí, eliminar comicio' })

    await userEvent.fill(confirmInput, 'nombre incorrecto')
    await expect.element(confirmButton).toBeDisabled()
  })

  it('habilita confirmar con el nombre exacto y llama onConfirm', async () => {
    const onConfirm = vi.fn()
    const { getByRole } = await render(
      <EliminarComicioDialog
        open
        onOpenChange={vi.fn()}
        nombreEleccion={NOMBRE_ELECCION}
        onConfirm={onConfirm}
      />
    )

    const confirmInput = getByRole('textbox', {
      name: `Escribí ${NOMBRE_ELECCION} para confirmar`,
    })
    const confirmButton = getByRole('button', { name: 'Sí, eliminar comicio' })

    await userEvent.fill(confirmInput, NOMBRE_ELECCION)
    await expect.element(confirmButton).toBeEnabled()
    await userEvent.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('limpia el input al cerrar y reabrir el diálogo', async () => {
    const Harness = () => {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button type='button' onClick={() => setOpen(true)}>
            Reabrir
          </button>
          <EliminarComicioDialog
            open={open}
            onOpenChange={setOpen}
            nombreEleccion={NOMBRE_ELECCION}
            onConfirm={vi.fn()}
          />
        </>
      )
    }

    const { getByRole } = await render(<Harness />)

    const confirmInput = getByRole('textbox', {
      name: `Escribí ${NOMBRE_ELECCION} para confirmar`,
    })
    await userEvent.fill(confirmInput, NOMBRE_ELECCION)
    await expect.element(confirmInput).toHaveValue(NOMBRE_ELECCION)

    await userEvent.click(getByRole('button', { name: 'Cancelar' }))
    await userEvent.click(getByRole('button', { name: 'Reabrir' }))

    const reopenedInput = getByRole('textbox', {
      name: `Escribí ${NOMBRE_ELECCION} para confirmar`,
    })
    await expect.element(reopenedInput).toHaveValue('')
  })

  it('limpia el input cuando el diálogo se cierra externamente (ej. tras eliminar con éxito)', async () => {
    const OTRO_COMICIO = 'Elección Municipal 2026'

    // Simula que el padre cierra el modal directamente (como hace
    // eliminarMutation.onSuccess en comicios-list.tsx), sin pasar por el
    // onOpenChange interno del diálogo.
    const { getByRole, rerender } = await render(
      <EliminarComicioDialog
        open
        onOpenChange={vi.fn()}
        nombreEleccion={NOMBRE_ELECCION}
        onConfirm={vi.fn()}
      />
    )

    const confirmInput = getByRole('textbox', {
      name: `Escribí ${NOMBRE_ELECCION} para confirmar`,
    })
    await userEvent.fill(confirmInput, NOMBRE_ELECCION)
    await expect.element(confirmInput).toHaveValue(NOMBRE_ELECCION)

    await rerender(
      <EliminarComicioDialog
        open={false}
        onOpenChange={vi.fn()}
        nombreEleccion={NOMBRE_ELECCION}
        onConfirm={vi.fn()}
      />
    )
    await rerender(
      <EliminarComicioDialog
        open
        onOpenChange={vi.fn()}
        nombreEleccion={OTRO_COMICIO}
        onConfirm={vi.fn()}
      />
    )

    const reopenedInput = getByRole('textbox', {
      name: `Escribí ${OTRO_COMICIO} para confirmar`,
    })
    await expect.element(reopenedInput).toHaveValue('')
  })

  it('deshabilita cancelar y confirmar cuando isLoading es true', async () => {
    const { getByRole } = await render(
      <EliminarComicioDialog
        open
        onOpenChange={vi.fn()}
        nombreEleccion={NOMBRE_ELECCION}
        isLoading
        onConfirm={vi.fn()}
      />
    )

    await expect
      .element(getByRole('button', { name: 'Cancelar' }))
      .toBeDisabled()
    await expect
      .element(getByRole('button', { name: 'Sí, eliminar comicio' }))
      .toBeDisabled()
  })
})
