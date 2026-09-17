import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { BoletaUnicaDigitalPage } from '@/features/voto/components/boleta-unica-digital-page'
import { SeedDecryptionError } from '@/features/voto/crypto/ephemeral-wallet-seed'
import type { BoletaDigital } from '@/features/voto/data/schema'

const mocks = vi.hoisted(() => ({
  obtenerBoletaDigital: vi.fn(),
  obtenerConfiguracionBud: vi.fn(),
  solicitarMerkleProof: vi.fn(),
  registrarVotoEmitidoAnonimo: vi.fn(),
  registrarTransaccionPublica: vi.fn(),
  obtenerEstadoRevoto: vi.fn(),
  registrarConsumoIntento: vi.fn(),
  ensureVotanteSession: vi.fn(),
  clearVotanteSession: vi.fn(),
  initialize: vi.fn(),
  discardElectionSeed: vi.fn(),
  purgeElectionIdentity: vi.fn(),
  leerHasVoted: vi.fn(),
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
  registrarTransaccionPublica: mocks.registrarTransaccionPublica,
  obtenerEstadoRevoto: mocks.obtenerEstadoRevoto,
  registrarConsumoIntento: mocks.registrarConsumoIntento,
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
    initialize: mocks.initialize,
    signVotePayload: vi.fn(),
    destroy: vi.fn(),
  }),
}))

vi.mock('@/features/voto/crypto/web-crypto-support', () => ({
  isWebCryptoSupported: () => true,
}))

// VOTAR-496 review: keep the real SeedDecryptionError class (production
// code does `instanceof SeedDecryptionError`) while intercepting
// discardElectionSeed / purgeElectionIdentity so tests can assert calls.
vi.mock(
  '@/features/voto/crypto/ephemeral-wallet-seed',
  async (importOriginal) => {
    const actual =
      (await importOriginal()) as typeof import('@/features/voto/crypto/ephemeral-wallet-seed')
    return {
      ...actual,
      discardElectionSeed: mocks.discardElectionSeed,
      purgeElectionIdentity: mocks.purgeElectionIdentity,
    }
  }
)

vi.mock('@/features/voto/crypto/voter-state', async (importOriginal) => {
  const actual =
    (await importOriginal()) as typeof import('@/features/voto/crypto/voter-state')
  return {
    ...actual,
    leerHasVoted: mocks.leerHasVoted,
  }
})

const BALLOT_ADDRESS = ('0x' + '9'.repeat(40)) as `0x${string}`

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
  permitirVotoNulo: true,
  categorias: [
    {
      idCategoria: 1,
      nombre: 'Presidente',
      descripcion: null,
      orden: 1,
      cantidadCargos: 1,
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

const boletaConBallotAddress: BoletaDigital = {
  ...boleta,
  ballotContractAddress: BALLOT_ADDRESS,
}

const newQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

describe('BoletaUnicaDigitalPage', () => {
  beforeEach(() => {
    mocks.obtenerBoletaDigital.mockReset()
    mocks.obtenerConfiguracionBud.mockReset()
    mocks.solicitarMerkleProof.mockReset()
    mocks.registrarVotoEmitidoAnonimo.mockReset()
    mocks.registrarTransaccionPublica.mockReset()
    mocks.obtenerEstadoRevoto.mockReset()
    mocks.registrarConsumoIntento.mockReset()
    mocks.ensureVotanteSession.mockReset()
    mocks.clearVotanteSession.mockReset()
    mocks.initialize.mockReset()
    mocks.discardElectionSeed.mockReset()
    mocks.purgeElectionIdentity.mockReset()
    mocks.leerHasVoted.mockReset()
    mocks.walletIsReady = true
    mocks.ensureVotanteSession.mockResolvedValue(null)
    mocks.clearVotanteSession.mockResolvedValue(undefined)
    mocks.registrarVotoEmitidoAnonimo.mockResolvedValue(undefined)
    mocks.registrarTransaccionPublica.mockResolvedValue(undefined)
    mocks.obtenerConfiguracionBud.mockResolvedValue(budConfig)
    mocks.initialize.mockResolvedValue(undefined)
    mocks.purgeElectionIdentity.mockResolvedValue(undefined)
    mocks.obtenerEstadoRevoto.mockResolvedValue({
      revoteHabilitado: true,
      maxVotosPorVotante: 3,
      votosConsumidos: 0,
      intentosRestantes: 3,
      puedeVotar: true,
      minIntervaloSegundos: 0,
      politicaRevoto: 'LAST_VOTE_WINS',
    })
    mocks.registrarConsumoIntento.mockResolvedValue({
      revoteHabilitado: true,
      maxVotosPorVotante: 3,
      votosConsumidos: 1,
      intentosRestantes: 2,
      puedeVotar: true,
      minIntervaloSegundos: 0,
      politicaRevoto: 'LAST_VOTE_WINS',
    })
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

    const queryClient = newQueryClient()
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

    const queryClient = newQueryClient()
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
    const queryClient = newQueryClient()
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
    const queryClient = newQueryClient()
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

    const queryClient = newQueryClient()
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

  it('VOTAR-496 review: bloquea permanentemente si el seed no descifra y el votante ya sufragó on-chain', async () => {
    mocks.ensureVotanteSession.mockResolvedValue(votanteSession)
    mocks.obtenerBoletaDigital.mockResolvedValue(boletaConBallotAddress)
    mocks.initialize.mockRejectedValue(new SeedDecryptionError(7))
    mocks.leerHasVoted.mockResolvedValue(true)

    const queryClient = newQueryClient()
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} />
      </QueryClientProvider>
    )

    await vi.waitFor(async () => {
      await expect
        .element(screen.getByText(/Ya registramos tu sufragio/i))
        .toBeInTheDocument()
    })
    expect(mocks.discardElectionSeed).not.toHaveBeenCalled()
    expect(mocks.initialize).toHaveBeenCalledTimes(1)
  })

  it('VOTAR-496 review: si nunca votó, descarta el seed corrupto, reintenta y muestra el wizard', async () => {
    mocks.ensureVotanteSession.mockResolvedValue(votanteSession)
    mocks.obtenerBoletaDigital.mockResolvedValue(boletaConBallotAddress)
    mocks.initialize
      .mockRejectedValueOnce(new SeedDecryptionError(7))
      .mockResolvedValueOnce(undefined)
    mocks.leerHasVoted.mockResolvedValue(false)

    const queryClient = newQueryClient()
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} />
      </QueryClientProvider>
    )

    await vi.waitFor(async () => {
      await expect
        .element(screen.getByText('Boleta - Centro de Estudiantes'))
        .toBeInTheDocument()
    })
    expect(mocks.discardElectionSeed).toHaveBeenCalledWith(
      7,
      votanteSession.sub
    )
    expect(mocks.initialize).toHaveBeenCalledTimes(2)
  })

  it('VOTAR-496 review: si no se puede verificar hasVoted, falla cerrado con mensaje distinto', async () => {
    mocks.ensureVotanteSession.mockResolvedValue(votanteSession)
    mocks.obtenerBoletaDigital.mockRejectedValue(new Error('network down'))
    mocks.initialize.mockRejectedValue(new SeedDecryptionError(7))

    const queryClient = newQueryClient()
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} />
      </QueryClientProvider>
    )

    await vi.waitFor(async () => {
      await expect
        .element(screen.getByText(/No pudimos verificar el estado de tu voto/i))
        .toBeInTheDocument()
    })
    expect(mocks.leerHasVoted).not.toHaveBeenCalled()
    expect(mocks.discardElectionSeed).not.toHaveBeenCalled()
  })

  it('mantiene el mensaje genérico para errores de inicialización que no son de descifrado', async () => {
    mocks.ensureVotanteSession.mockResolvedValue(votanteSession)
    mocks.initialize.mockRejectedValue(
      new Error('Web Crypto API is not supported in this browser')
    )

    const queryClient = newQueryClient()
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} />
      </QueryClientProvider>
    )

    await vi.waitFor(async () => {
      await expect
        .element(screen.getByText(/Reintentá iniciar sesión/i))
        .toBeInTheDocument()
    })
    expect(mocks.leerHasVoted).not.toHaveBeenCalled()
    expect(mocks.obtenerBoletaDigital).not.toHaveBeenCalled()
  })

  it('VOTAR-496 review (nosungam): purga la identidad al cerrar el comicio con sesión activa', async () => {
    mocks.ensureVotanteSession.mockResolvedValue(votanteSession)
    mocks.obtenerBoletaDigital.mockResolvedValue(boletaConBallotAddress)
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      ...budConfig,
      estado: 'CERRADA',
    })

    const queryClient = newQueryClient()
    await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} />
      </QueryClientProvider>
    )

    await vi.waitFor(() => {
      expect(mocks.purgeElectionIdentity).toHaveBeenCalledWith(
        7,
        votanteSession.sub
      )
    })
  })

  it('VOTAR-496 review (nosungam): no purga si el comicio está abierto', async () => {
    mocks.ensureVotanteSession.mockResolvedValue(votanteSession)
    mocks.obtenerBoletaDigital.mockResolvedValue(boletaConBallotAddress)

    const queryClient = newQueryClient()
    await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} />
      </QueryClientProvider>
    )

    await vi.waitFor(async () => {
      await expect.element(document.body).toBeInTheDocument()
    })
    expect(mocks.purgeElectionIdentity).not.toHaveBeenCalled()
  })
})
