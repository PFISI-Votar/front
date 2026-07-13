import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { VerificadorRecibo } from '@/features/voto/components/verificador-recibo'

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

const renderVerificador = async (initialTxHash?: string) => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <VerificadorRecibo initialTxHash={initialTxHash} />
    </QueryClientProvider>
  )
}

describe('VerificadorRecibo — VOTAR-366', () => {
  beforeEach(() => {
    verificarInclusionMock.mockReset()
  })

  it('valida formato de TransactionHash', async () => {
    const screen = await renderVerificador()

    await userEvent.type(
      screen.getByLabelText(/transactionhash de verificación/i),
      'hash-invalido'
    )
    await userEvent.click(
      screen.getByRole('button', { name: /verificar inclusión/i })
    )

    await expect
      .element(screen.getByText(/hash Ethereum válido/i))
      .toBeInTheDocument()
    expect(verificarInclusionMock).not.toHaveBeenCalled()
  })

  it('UAT-01: muestra confirmación verde de inclusión sin revelar el voto', async () => {
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

    const screen = await renderVerificador()
    await userEvent.type(
      screen.getByLabelText(/transactionhash de verificación/i),
      txHash
    )
    await userEvent.click(
      screen.getByRole('button', { name: /verificar inclusión/i })
    )

    await expect
      .element(screen.getByText(/inclusión confirmada/i))
      .toBeInTheDocument()
    await expect
      .element(
        screen.getByText(
          /incluido con éxito en el bloque número 4582193 de la blockchain de Sepolia/i
        )
      )
      .toBeInTheDocument()
    expect(screen.container.textContent).not.toMatch(
      /candidato\s*#|idCandidato|selectionHash|opción política elegida/i
    )
    expect(verificarInclusionMock).toHaveBeenCalledWith(txHash)
  })

  it('UAT-02: muestra advertencia roja si el recibo no existe', async () => {
    const { VoteInclusionNotFoundError, VOTO_NO_ENCONTRADO_MENSAJE } =
      await import('@/features/voto/crypto/verificar-voto-inclusion')
    const txHash = `0x${'cd'.repeat(32)}`
    verificarInclusionMock.mockRejectedValue(new VoteInclusionNotFoundError())

    const screen = await renderVerificador()
    await userEvent.type(
      screen.getByLabelText(/transactionhash de verificación/i),
      txHash
    )
    await userEvent.click(
      screen.getByRole('button', { name: /verificar inclusión/i })
    )

    await expect.element(screen.getByRole('alert')).toBeInTheDocument()
    await expect
      .element(screen.getByText(VOTO_NO_ENCONTRADO_MENSAJE))
      .toBeInTheDocument()
  })

  it('auto-verifica desde QR / deep-link', async () => {
    const txHash = `0x${'ef'.repeat(32)}`
    verificarInclusionMock.mockResolvedValue({
      confirmado: true,
      idEleccion: 7,
      txHash,
      blockNumber: 10,
      timestamp: '2026-07-11T14:30:00.000Z',
      contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
      networkName: 'Sepolia',
      mensaje:
        'Su voto ha sido incluido con éxito en el bloque número 10 de la blockchain de Sepolia',
    })

    const screen = await renderVerificador(txHash)

    await expect
      .element(screen.getByText(/inclusión confirmada/i))
      .toBeInTheDocument()
    expect(verificarInclusionMock).toHaveBeenCalledWith(txHash)
  })
})
