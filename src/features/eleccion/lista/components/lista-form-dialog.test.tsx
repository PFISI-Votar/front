import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import type { Lista } from '@/features/eleccion/lista/data/schema'
import { PREVIOUS_ELECTORAL_IMAGE_NOTE } from '@/features/eleccion/shared/utils/image-file'
import { ListaFormDialog } from './lista-form-dialog'

const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

const pngFile = (name: string) => {
  const bytes = new Uint8Array(64)
  bytes.set(PNG_HEADER)
  return new File([bytes], name, { type: 'image/png' })
}

const listaConLogo: Lista = {
  idLista: 7,
  idBoleta: 1,
  nombre: 'Lista Azul',
  sigla: 'LA',
  color: '#2563eb',
  logoUrl: '/imagenes/a1b2c3d4-e5f6-4789-a012-3456789abcde',
  estado: 'BORRADOR',
  listId: null,
  fechaOficializacion: null,
}

describe('ListaFormDialog', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function renderDialog(lista?: Lista | null) {
    return render(
      <ListaFormDialog
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        lista={lista}
      />
    )
  }

  it('un logo inválido no reemplaza el anterior y el submit no lo manda (VOTAR-490)', async () => {
    await renderDialog(listaConLogo)

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await userEvent.upload(
      fileInput,
      new File([new TextEncoder().encode('%PDF-1.4')], 'falso.jpg', {
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
      page.getByRole('button', { name: /Guardar cambios/i })
    )

    expect(onSubmit).toHaveBeenCalledOnce()
    const values = onSubmit.mock.calls[0]?.[0]
    expect(values.logoFile ?? null).toBeNull()
    expect(values.removeLogo).not.toBe(true)
  })

  it('si ya había un logo local válido, un archivo inválido no lo pisa (VOTAR-490)', async () => {
    await renderDialog(listaConLogo)

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await userEvent.upload(fileInput, pngFile('ok.png'))
    await userEvent.upload(
      fileInput,
      new File([new Uint8Array(3 * 1024 * 1024)], 'grande.png', {
        type: 'image/png',
      })
    )

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent(PREVIOUS_ELECTORAL_IMAGE_NOTE)

    await userEvent.click(
      page.getByRole('button', { name: /Guardar cambios/i })
    )

    expect(onSubmit.mock.calls[0]?.[0].logoFile?.name).toBe('ok.png')
  })
})
