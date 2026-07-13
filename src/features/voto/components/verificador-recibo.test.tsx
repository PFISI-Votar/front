import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { VerificadorRecibo } from '@/features/voto/components/verificador-recibo'

const verificarReciboMock = vi.fn()

vi.mock('@/features/voto/api/recibo-api', () => ({
  verificarRecibo: (...args: unknown[]) => verificarReciboMock(...args),
}))

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

describe('VerificadorRecibo — VOTAR-360', () => {
  beforeEach(() => {
    verificarReciboMock.mockReset()
  })

  it('valida formato de TransactionHash', async () => {
    const screen = await renderVerificador()

    await userEvent.type(
      screen.getByLabelText(/transactionhash de verificación/i),
      'hash-invalido'
    )
    await userEvent.click(
      screen.getByRole('button', { name: /verificar participación/i })
    )

    await expect
      .element(screen.getByText(/hash Ethereum válido/i))
      .toBeInTheDocument()
    expect(verificarReciboMock).not.toHaveBeenCalled()
  })

  it('muestra confirmación de bloque sin revelar el voto (UAT-02)', async () => {
    const txHash = `0x${'ab'.repeat(32)}`
    verificarReciboMock.mockResolvedValue({
      confirmado: true,
      idEleccion: 7,
      nombreEleccion: 'Centro de Estudiantes 2026',
      txHash,
      blockNumber: 4582193,
      timestamp: '2026-07-11T14:30:00.000Z',
      contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
      estadoTx: 'CONFIRMADA',
      mensaje:
        'Su participación fue confirmada en el bloque 4582193. El contenido del sufragio no es revelado.',
    })

    const screen = await renderVerificador()
    await userEvent.type(
      screen.getByLabelText(/transactionhash de verificación/i),
      txHash
    )
    await userEvent.click(
      screen.getByRole('button', { name: /verificar participación/i })
    )

    await expect
      .element(screen.getByText(/participación confirmada/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/confirmada en el bloque 4582193/i))
      .toBeInTheDocument()
    expect(verificarReciboMock).toHaveBeenCalledWith(txHash)
  })

  it('auto-verifica desde QR / deep-link (UAT-01 / UAT-03)', async () => {
    const txHash = `0x${'cd'.repeat(32)}`
    verificarReciboMock.mockResolvedValue({
      confirmado: true,
      idEleccion: 7,
      nombreEleccion: 'Centro de Estudiantes 2026',
      txHash,
      blockNumber: 10,
      timestamp: '2026-07-11T14:30:00.000Z',
      contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
      estadoTx: 'CONFIRMADA',
      mensaje: 'Su participación fue confirmada en el bloque 10.',
    })

    const screen = await renderVerificador(txHash)

    await expect
      .element(screen.getByText(/participación confirmada/i))
      .toBeInTheDocument()
    expect(verificarReciboMock).toHaveBeenCalledWith(txHash)
  })
})
