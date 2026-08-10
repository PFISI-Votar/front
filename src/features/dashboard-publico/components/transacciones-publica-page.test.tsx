import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { TransaccionesPublicaPage } from './transacciones-publica-page'

const mocks = vi.hoisted(() => ({
  obtenerConfiguracionBud: vi.fn(),
  obtenerTransaccionesPublica: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    ...props
  }: {
    children: React.ReactNode
    to?: string
    params?: Record<string, string>
    className?: string
  }) => (
    <a href={props.to ?? '#'} className={props.className}>
      {children}
    </a>
  ),
}))

vi.mock('@/features/voto/api/voto-api', () => ({
  obtenerConfiguracionBud: mocks.obtenerConfiguracionBud,
}))

vi.mock('@/features/dashboard-publico/api/transacciones-publica-api', () => ({
  obtenerTransaccionesPublica: mocks.obtenerTransaccionesPublica,
}))

const txHash = '0x' + 'aa'.repeat(32)

const transaccionesMock = {
  idEleccion: 6,
  snapshotCongelado: false,
  red: 'Sepolia',
  chainId: 11155111,
  transacciones: [
    {
      hashTransaccion: txHash,
      numeroBloque: 4582193,
      marcaTiempo: '2026-08-08T15:30:00.000Z',
      contratoEtiqueta: 'VoteRegistry',
      nombreEvento: 'VoteCast',
      descripcionLegible: 'Sufragio contabilizado',
      explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
    },
  ],
  fuenteDatos: 'BlockScanner',
}

const renderPage = async (idEleccion: number) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <TransaccionesPublicaPage idEleccion={idEleccion} />
    </QueryClientProvider>
  )
}

describe('TransaccionesPublicaPage — VOTAR-373', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Comicio Demo',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
      snapshotCongelado: false,
      resultadosDefinitivos: false,
    })
    mocks.obtenerTransaccionesPublica.mockResolvedValue(transaccionesMock)
  })

  it('UAT-01: muestra el listado cronológico con enlace a Sepolia', async () => {
    const screen = await renderPage(6)

    await expect
      .element(screen.getByText('Transacciones de la Urna Digital'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Sufragio contabilizado'))
      .toBeInTheDocument()

    const explorerLink = screen.getByRole('link', { name: /Sepolia/i })
    await expect
      .element(explorerLink)
      .toHaveAttribute('href', transaccionesMock.transacciones[0].explorerUrl)
    await expect.element(explorerLink).toHaveAttribute('target', '_blank')
  })

  it('muestra error cuando el comicio no tiene contratos on-chain', async () => {
    mocks.obtenerTransaccionesPublica.mockRejectedValue(
      new AxiosError('Unprocessable', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as never,
        data: { message: 'Sin contratos' },
      })
    )

    const screen = await renderPage(6)

    await expect
      .element(screen.getByText('Historial on-chain no disponible'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/contratos electorales desplegados/i))
      .toBeInTheDocument()
  })
})
