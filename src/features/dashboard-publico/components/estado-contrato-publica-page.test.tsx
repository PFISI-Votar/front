import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { EstadoContratoPublicaPage } from './estado-contrato-publica-page'

const mocks = vi.hoisted(() => ({
  obtenerConfiguracionBud: vi.fn(),
  obtenerContratoEstadoPublica: vi.fn(),
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

vi.mock('@/features/dashboard-publico/api/contrato-estado-publica-api', () => ({
  obtenerContratoEstadoPublica: mocks.obtenerContratoEstadoPublica,
}))

const contratoMock = {
  idEleccion: 6,
  snapshotCongelado: false,
  red: 'Sepolia',
  chainId: 11155111,
  estadoOnChain: { codigo: 2, etiqueta: 'ABIERTA' },
  merkleRoot: {
    hash: '0x' + 'ab'.repeat(32),
    publicado: true,
    publicadoEn: '2026-08-08T12:00:00.000Z',
  },
  revoto: {
    habilitado: true,
    maxVotosPorVotante: 3,
    minIntervaloSegundos: 60,
    politicaRevoto: 'LAST_VOTE_WINS' as const,
  },
  contratos: {
    ballot: {
      direccion: '0x1111111111111111111111111111111111111111',
      explorerUrl:
        'https://sepolia.etherscan.io/address/0x1111111111111111111111111111111111111111',
    },
    voteRegistry: {
      direccion: '0x2222222222222222222222222222222222222222',
      explorerUrl:
        'https://sepolia.etherscan.io/address/0x2222222222222222222222222222222222222222',
    },
    auditView: {
      direccion: '0x3333333333333333333333333333333333333333',
      explorerUrl:
        'https://sepolia.etherscan.io/address/0x3333333333333333333333333333333333333333',
    },
    merkleRootStore: {
      direccion: '0x4444444444444444444444444444444444444444',
      explorerUrl:
        'https://sepolia.etherscan.io/address/0x4444444444444444444444444444444444444444',
    },
  },
  fuenteDatos:
    'AuditViewContract.getElectionState + MerkleRootStore.getMerkleRoot + ElectionFactory.getElection',
}

const renderPage = async (idEleccion: number) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <EstadoContratoPublicaPage idEleccion={idEleccion} />
    </QueryClientProvider>
  )
}

describe('EstadoContratoPublicaPage — VOTAR-367', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elecciones UTN 2026',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
    })
    mocks.obtenerContratoEstadoPublica.mockResolvedValue(contratoMock)
  })

  it('UAT-01: muestra ficha técnica con dirección y enlace a Etherscan', async () => {
    const screen = await renderPage(6)

    await expect
      .element(screen.getByText('Ficha técnica del smart contract'))
      .toBeVisible()
    await expect
      .element(screen.getByText('AuditViewContract', { exact: true }))
      .toBeVisible()
    await expect
      .element(
        screen
          .getByRole('link', {
            name: /Etherscan/i,
          })
          .nth(2)
      )
      .toBeVisible()
    await expect
      .element(screen.getByText(contratoMock.merkleRoot.hash))
      .toBeVisible()
  })

  it('muestra error cuando el comicio no tiene contratos on-chain', async () => {
    mocks.obtenerContratoEstadoPublica.mockRejectedValue(
      new AxiosError('Unprocessable', undefined, undefined, undefined, {
        status: 422,
        data: {},
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as never,
      })
    )

    const screen = await renderPage(6)

    await expect
      .element(screen.getByText('Metadatos on-chain no disponibles'))
      .toBeVisible()
  })
})
