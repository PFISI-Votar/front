/**
 * VOTAR-389 / UAT-02 — Captura del verificador (inclusión confirmada).
 * Solo a demanda: describe.skipIf(!REGENERATE).
 */
import '@/styles/index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { VerificadorRecibo } from '@/features/voto/components/verificador-recibo'

const REGENERATE = false
const PUBLIC_DIR = '../../../public/manual-votante'

const verificarInclusionMock = vi.fn()

vi.mock('@/features/voto/crypto/verificar-voto-inclusion', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/voto/crypto/verificar-voto-inclusion')
  >('@/features/voto/crypto/verificar-voto-inclusion')
  return {
    ...actual,
    verificarInclusionVotoLocal: (...args: unknown[]) =>
      verificarInclusionMock(...args),
  }
})

describe.skipIf(!REGENERATE)(
  'VOTAR-389: captura verificador manual votante',
  () => {
    beforeEach(() => {
      verificarInclusionMock.mockReset()
      document.documentElement.classList.remove('dark')
    })

    it('captura inclusión confirmada', async () => {
      const txHash = `0x${'ab'.repeat(32)}`
      verificarInclusionMock.mockResolvedValue({
        confirmado: true,
        idEleccion: 7,
        txHash,
        blockNumber: 4582193,
        timestamp: '2026-07-11T14:30:00.000Z',
        contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
        networkName: 'Sepolia',
        mensaje:
          'Su voto ha sido incluido con éxito en el bloque número 4582193 de la blockchain de Sepolia',
      })

      const client = new QueryClient({
        defaultOptions: {
          mutations: { retry: false },
          queries: { retry: false },
        },
      })
      const screen = await render(
        <QueryClientProvider client={client}>
          <VerificadorRecibo />
        </QueryClientProvider>
      )

      await expect
        .element(screen.getByText('Verificador de voto individual'))
        .toBeInTheDocument()

      await userEvent.type(
        screen.getByLabelText(/transactionhash de verificación/i),
        txHash
      )
      await userEvent.click(
        screen.getByRole('button', { name: /verificar inclusión/i })
      )

      await expect
        .element(screen.getByText(/Inclusión confirmada/i))
        .toBeInTheDocument()

      const main = document.querySelector('main')
      expect(main).toBeTruthy()
      await page.screenshot({
        element: main as Element,
        path: `${PUBLIC_DIR}/05-verificacion.png`,
      })
    }, 60_000)
  }
)
