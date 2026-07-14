import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { BoletaUnicaDigitalPage } from '@/features/voto/components/boleta-unica-digital-page'
import type { BoletaDigital } from '@/features/voto/data/schema'

const mocks = vi.hoisted(() => ({
  obtenerBoletaDigital: vi.fn(),
  obtenerConfiguracionBud: vi.fn(),
  solicitarMerkleProof: vi.fn(),
  registrarVotoEmitidoAnonimo: vi.fn(),
  ensureVotanteSession: vi.fn(),
  clearVotanteSession: vi.fn(),
  walletIsReady: true,
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
  obtenerBoletaDigital: mocks.obtenerBoletaDigital,
  obtenerConfiguracionBud: mocks.obtenerConfiguracionBud,
  solicitarMerkleProof: mocks.solicitarMerkleProof,
  registrarVotoEmitidoAnonimo: mocks.registrarVotoEmitidoAnonimo,
}))

vi.mock('@/features/voto/services/votante-session', () => ({
  ensureVotanteSession: mocks.ensureVotanteSession,
  clearVotanteSession: mocks.clearVotanteSession,
}))

vi.mock('@/features/voto/crypto/use-ephemeral-wallet', () => ({
  useEphemeralWallet: () => ({
    isSupported: true,
    get isReady() {
      return mocks.walletIsReady
    },
    publicKeyHex: '0x' + 'ab'.repeat(33),
    session: mocks.walletIsReady
      ? { publicKeyHex: '0x' + 'ab'.repeat(33), createdAt: Date.now() }
      : null,
    initialize: vi.fn().mockResolvedValue(undefined),
    signVotePayload: vi.fn(),
    destroy: vi.fn(),
  }),
}))

vi.mock('@/features/voto/crypto/web-crypto-support', () => ({
  isWebCryptoSupported: () => true,
}))

const budConfig = {
  idEleccion: 7,
  nombre: 'Centro de Estudiantes',
  estado: 'ABIERTA',
  tipoVotacion: 'POR_LISTA',
  metodosAutenticacion: ['SSO_INSTITUCIONAL'],
}

const votanteSession = {
  sub: '14988',
  role: 'voter' as const,
  idEleccion: 7,
}

const boleta: BoletaDigital = {
  idEleccion: 7,
  nombreEleccion: 'Centro de Estudiantes',
  estadoEleccion: 'ABIERTA',
  idBoleta: 70,
  titulo: 'Boleta - Centro de Estudiantes',
  permitirVotoEnBlanco: true,
  categorias: [
    {
      idCategoria: 1,
      nombre: 'Presidente',
      descripcion: null,
      orden: 1,
      estado: 'DISPONIBLE',
      candidatos: [
        {
          idCandidato: 101,
          idCategoria: 1,
          idLista: 11,
          listId: 1,
          nombre: 'Ana',
          apellido: 'López',
          nombreCompleto: 'Ana López',
          agrupacionPolitica: 'Lista Azul',
          numeroLista: 1,
          colorLista: '#0ea5e9',
          fotoUrl: null,
        },
      ],
    },
  ],
}

describe('BoletaUnicaDigitalPage', () => {
  beforeEach(() => {
    mocks.obtenerBoletaDigital.mockReset()
    mocks.obtenerConfiguracionBud.mockReset()
    mocks.solicitarMerkleProof.mockReset()
    mocks.registrarVotoEmitidoAnonimo.mockReset()
    mocks.ensureVotanteSession.mockReset()
    mocks.clearVotanteSession.mockReset()
    mocks.walletIsReady = true
    mocks.ensureVotanteSession.mockResolvedValue(null)
    mocks.clearVotanteSession.mockResolvedValue(undefined)
    mocks.registrarVotoEmitidoAnonimo.mockResolvedValue(undefined)
    mocks.obtenerConfiguracionBud.mockResolvedValue(budConfig)
    mocks.solicitarMerkleProof.mockResolvedValue({
      merkleProof: ['0x' + '1'.repeat(64)],
      root: '0x' + 'a'.repeat(64),
      hashHoja: 'b'.repeat(64),
    })
  })

  it('aplica superficie clara en el wizard bajo tema oscuro global (VOTAR-412)', async () => {
    document.documentElement.classList.add('dark')
    mocks.ensureVotanteSession.mockResolvedValue(votanteSession)
    mocks.obtenerBoletaDigital.mockResolvedValue(boleta)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} />
      </QueryClientProvider>
    )

    await vi.waitFor(() => {
      const main = document.querySelector('main')
      expect(main?.className).toContain('votar-light-surface')
    })
  })

  it('vuelve al login con aviso cuando la sesión del votante expira (401)', async () => {
    mocks.ensureVotanteSession.mockResolvedValue(votanteSession)
    mocks.obtenerBoletaDigital.mockRejectedValue(
      new AxiosError('Unauthorized', '401', undefined, undefined, {
        status: 401,
        data: { message: 'Unauthorized' },
        statusText: 'Unauthorized',
        headers: {},
        config: {} as never,
      })
    )

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} />
      </QueryClientProvider>
    )

    await vi.waitFor(async () => {
      await expect
        .element(screen.getByText('Sesión expirada'))
        .toBeInTheDocument()
    })
    await expect
      .element(
        screen.getByText(
          /Tu sesión expiró\. Volvé a iniciar sesión para continuar\./i
        )
      )
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: /Ingresar/i }))
      .toBeInTheDocument()
    expect(mocks.clearVotanteSession).toHaveBeenCalled()
  })

  it('muestra login cuando no hay sesión de votante', async () => {
    mocks.ensureVotanteSession.mockResolvedValue(null)
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} />
      </QueryClientProvider>
    )

    await expect
      .element(screen.getByRole('button', { name: /Ingresar/i }))
      .toBeInTheDocument()
    expect(mocks.obtenerBoletaDigital).not.toHaveBeenCalled()
  })

  it('con comicio cerrado ofrece enlace al Dashboard Público', async () => {
    mocks.ensureVotanteSession.mockResolvedValue(null)
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      ...budConfig,
      estado: 'CERRADA',
    })
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} />
      </QueryClientProvider>
    )

    await expect
      .element(screen.getByText(/El período de votación ha concluido/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('link', { name: /Ir al Dashboard Público/i }))
      .toBeInTheDocument()
  })

  it('VOTAR-379/418: tras zeroizar la wallet sigue mostrando el wizard (no el splash)', async () => {
    mocks.walletIsReady = false
    mocks.ensureVotanteSession.mockResolvedValue(votanteSession)
    mocks.obtenerBoletaDigital.mockResolvedValue(boleta)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} />
      </QueryClientProvider>
    )

    await expect
      .element(screen.getByText(/Preparando tu boleta/i))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByText('Boleta - Centro de Estudiantes'))
      .toBeInTheDocument()
  })
})
