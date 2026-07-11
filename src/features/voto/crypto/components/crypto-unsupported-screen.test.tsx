import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import {
  CRYPTO_UNSUPPORTED_MESSAGE,
  CryptoUnsupportedScreen,
} from '@/features/voto/crypto/components/crypto-unsupported-screen'

describe('CryptoUnsupportedScreen (VOTAR-352 UAT-04)', () => {
  it('blocks access with the exact security requirements message', async () => {
    const screen = await render(<CryptoUnsupportedScreen />)

    await expect.element(screen.getByRole('alert')).toBeInTheDocument()
    await expect
      .element(screen.getByText('Requisitos de seguridad no cumplidos'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(CRYPTO_UNSUPPORTED_MESSAGE))
      .toBeInTheDocument()
    await expect
      .element(
        screen.getByText(/navegador actualizado con soporte de Web Crypto API/i)
      )
      .toBeInTheDocument()
  })
})
