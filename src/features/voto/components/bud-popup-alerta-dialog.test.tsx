import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { BudPopupAlertaDialog } from '@/features/voto/components/bud-popup-alerta-dialog'

const popupAlerta = {
  titulo: 'Aviso importante',
  descripcion: 'Texto del aviso',
}

describe('BudPopupAlertaDialog (VOTAR-524)', () => {
  it('no muestra nada cuando no hay pop-up configurado', async () => {
    await render(<BudPopupAlertaDialog popupAlerta={null} />)

    await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('no muestra nada cuando popupAlerta es undefined', async () => {
    await render(<BudPopupAlertaDialog />)

    await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('muestra titulo y descripcion al montar', async () => {
    await render(<BudPopupAlertaDialog popupAlerta={popupAlerta} />)

    await expect.element(page.getByRole('alertdialog')).toBeInTheDocument()
    await expect.element(page.getByText('Aviso importante')).toBeInTheDocument()
    await expect.element(page.getByText('Texto del aviso')).toBeInTheDocument()
  })

  it('el titulo se muestra en mayusculas por estilo, sin alterar el texto', async () => {
    await render(<BudPopupAlertaDialog popupAlerta={popupAlerta} />)

    const titulo = page.getByText('Aviso importante')
    await expect.element(titulo).toHaveClass('uppercase')
    await expect.element(titulo).toHaveTextContent('Aviso importante')
  })

  it('el boton OK cierra el pop-up', async () => {
    await render(<BudPopupAlertaDialog popupAlerta={popupAlerta} />)

    await userEvent.click(page.getByRole('button', { name: /^OK$/ }))

    await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('renderiza como texto plano y no interpreta HTML', async () => {
    await render(
      <BudPopupAlertaDialog
        popupAlerta={{
          titulo: 'Aviso',
          descripcion: '<b>negrita</b> & mas',
        }}
      />
    )

    await expect
      .element(page.getByText('<b>negrita</b> & mas'))
      .toBeInTheDocument()
    expect(document.body.querySelector('[role="alertdialog"] b')).toBeNull()
  })
})
