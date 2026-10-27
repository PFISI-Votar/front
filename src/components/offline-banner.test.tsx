import { afterEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { OfflineBanner } from './offline-banner'

const setOnLine = (value: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', {
    value,
    configurable: true,
  })
  window.dispatchEvent(new Event(value ? 'online' : 'offline'))
}

afterEach(() => {
  Reflect.deleteProperty(window.navigator, 'onLine')
})

describe('OfflineBanner', () => {
  it('muestra el aviso al perder la conexión y lo oculta al recuperarla', async () => {
    const { getByRole } = await render(<OfflineBanner />)
    const alerta = getByRole('alert')

    await expect.element(alerta).not.toBeInTheDocument()

    setOnLine(false)
    await expect.element(alerta).toHaveTextContent('Sin conexión a internet')

    setOnLine(true)
    await expect.element(alerta).not.toBeInTheDocument()
  })
})
