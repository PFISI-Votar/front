import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import {
  TIPOS_VOTACION,
  type TipoVotacion,
} from '@/features/eleccion/lista/data/schema'
import { BUD_CATEGORY_GRID_CLASS } from '@/features/voto/components/bud-layout.constants'
import { BudVotingWizard } from '@/features/voto/components/bud-voting-wizard'
import { EphemeralWalletProvider } from '@/features/voto/crypto/ephemeral-wallet-context'
import { calcularNullifier } from '@/features/voto/crypto/nullifier'
import { VOTE_TX_MESSAGES } from '@/features/voto/crypto/vote-tx-error-catalog'
import type { BoletaDigital, EstadoRevoto } from '@/features/voto/data/schema'

const mmssToSeconds = (text: string | null): number => {
  const [minutes, seconds] = (text ?? '00:00').split(':').map(Number)
  return minutes * 60 + seconds
}

const toastWarningMock = vi.fn()
const toastErrorMock = vi.fn()
const logVoteTxErrorMock = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    warning: (...args: unknown[]) => toastWarningMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}))

vi.mock('@/features/voto/crypto/log-vote-tx-error', () => ({
  logVoteTxError: (...args: unknown[]) => logVoteTxErrorMock(...args),
}))

const registrarVotoEmitidoAnonimoMock = vi.fn().mockResolvedValue(undefined)
const registrarConsumoIntentoMock = vi.fn()
const obtenerEstadoRevotoMock = vi.fn()
const leerVoterStateMock = vi.fn()

vi.mock('@/features/voto/crypto/voter-state', () => ({
  leerVoterState: (...args: unknown[]) => leerVoterStateMock(...args),
}))

const defaultEstadoRevoto: EstadoRevoto = {
  revoteHabilitado: true,
  maxVotosPorVotante: 3,
  votosConsumidos: 0,
  intentosRestantes: 3,
  puedeVotar: true,
  minIntervaloSegundos: 0,
  politicaRevoto: 'LAST_VOTE_WINS',
}

vi.mock('@/features/voto/api/voto-api', () => ({
  solicitarMerkleProof: vi.fn().mockResolvedValue({
    hashHoja: 'a'.repeat(64),
    merkleProof: ['0x' + '1'.repeat(64)],
    root: '0x' + 'a'.repeat(64),
    ballotContractAddress: '0x' + '9'.repeat(40),
  }),
  registrarVotoEmitidoAnonimo: (...args: unknown[]) =>
    registrarVotoEmitidoAnonimoMock(...args),
  obtenerEstadoRevoto: (...args: unknown[]) => obtenerEstadoRevotoMock(...args),
  registrarConsumoIntento: (...args: unknown[]) =>
    registrarConsumoIntentoMock(...args),
}))

const clearVotanteSessionMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/features/voto/services/votante-session', () => ({
  clearVotanteSession: (...args: unknown[]) => clearVotanteSessionMock(...args),
}))

const transmitSignedVoteMock = vi.fn().mockResolvedValue({
  txHash: '0x' + 'f'.repeat(64),
  blockNumber: 42n,
})

vi.mock('@/features/voto/crypto/vote-transmitter', () => ({
  transmitSignedVote: (...args: unknown[]) => transmitSignedVoteMock(...args),
}))

const WALLET_PUBLIC_KEY = '0x02' + 'a'.repeat(64)

const signVotePayloadMock = vi.fn().mockResolvedValue({
  electionId: 7,
  nullifier: '0x' + 'b'.repeat(64),
  selectionHash: '0x' + 'c'.repeat(64),
  candidateId: 101n,
  timestamp: 1_700_000_000,
  expectedSigner: '0x' + 'd'.repeat(40),
  signature: '0x' + 'e'.repeat(130),
})

const initializeWalletMock = vi.fn().mockResolvedValue({
  idEleccion: 7,
  publicKeyHex: WALLET_PUBLIC_KEY,
  createdAt: Date.now(),
})

const walletState = {
  publicKeyHex: WALLET_PUBLIC_KEY as string | null,
}

vi.mock('@/features/voto/crypto/use-ephemeral-wallet', () => ({
  useEphemeralWallet: () => ({
    isSupported: true,
    isReady: true,
    get publicKeyHex() {
      return walletState.publicKeyHex
    },
    session: {
      idEleccion: 7,
      publicKeyHex: WALLET_PUBLIC_KEY,
      createdAt: Date.now(),
    },
    initialize: initializeWalletMock,
    signVotePayload: signVotePayloadMock,
    destroy: vi.fn(),
  }),
}))

const BALLOT_CONTRACT_ADDRESS = ('0x' + '9'.repeat(40)) as `0x${string}`

const boleta: BoletaDigital = {
  idEleccion: 7,
  nombreEleccion: 'Centro de Estudiantes',
  estadoEleccion: 'ABIERTA',
  idBoleta: 70,
  titulo: 'Boleta - Centro de Estudiantes',
  permitirVotoEnBlanco: true,
  permitirVotoNulo: true,
  ballotContractAddress: BALLOT_CONTRACT_ADDRESS,
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
          listId: 11,
          nombre: 'Ana',
          apellido: 'Lopez',
          nombreCompleto: 'Ana Lopez',
          agrupacionPolitica: 'Lista Azul',
          numeroLista: 1,
          colorLista: '#0ea5e9',
          fotoUrl: null,
        },
        {
          idCandidato: 102,
          idCategoria: 1,
          idLista: 12,
          listId: 12,
          nombre: 'Bruno',
          apellido: 'Paz',
          nombreCompleto: 'Bruno Paz',
          agrupacionPolitica: 'Lista Celeste',
          numeroLista: 2,
          colorLista: '#2563eb',
          fotoUrl: null,
        },
        {
          idCandidato: 103,
          idCategoria: 1,
          idLista: 11,
          listId: 11,
          nombre: 'Alicia',
          apellido: 'Sol',
          nombreCompleto: 'Alicia Sol',
          agrupacionPolitica: 'Lista Azul',
          numeroLista: 1,
          colorLista: '#0ea5e9',
          fotoUrl: null,
        },
      ],
    },
    {
      idCategoria: 2,
      nombre: 'Vocales',
      descripcion: null,
      orden: 2,
      estado: 'DISPONIBLE',
      candidatos: [
        {
          idCandidato: 201,
          idCategoria: 2,
          idLista: 11,
          listId: 11,
          nombre: 'Carla',
          apellido: 'Rio',
          nombreCompleto: 'Carla Rio',
          agrupacionPolitica: 'Lista Azul',
          numeroLista: 1,
          colorLista: '#0ea5e9',
          fotoUrl: null,
        },
      ],
    },
  ],
}

async function renderWizard(
  tipoVotacion: TipoVotacion = TIPOS_VOTACION.POR_CANDIDATO,
  onLogout: () => void = vi.fn()
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <EphemeralWalletProvider>
        <BudVotingWizard
          boleta={boleta}
          tipoVotacion={tipoVotacion}
          onLogout={onLogout}
        />
      </EphemeralWalletProvider>
    </QueryClientProvider>
  )

  await userEvent.click(
    screen.getByRole('button', { name: /Confirmar Identidad y Comenzar/i })
  )
  await expect
    .element(screen.getByText('Opciones especiales'))
    .toBeInTheDocument()

  return screen
}

describe('BudVotingWizard', () => {
  beforeEach(() => {
    walletState.publicKeyHex = WALLET_PUBLIC_KEY
    signVotePayloadMock.mockClear()
    transmitSignedVoteMock.mockClear()
    initializeWalletMock.mockClear()
    clearVotanteSessionMock.mockClear()
    registrarVotoEmitidoAnonimoMock.mockClear()
    registrarConsumoIntentoMock.mockClear()
    toastWarningMock.mockClear()
    toastErrorMock.mockClear()
    logVoteTxErrorMock.mockClear()
    obtenerEstadoRevotoMock.mockReset()
    leerVoterStateMock.mockReset()
    clearVotanteSessionMock.mockResolvedValue(undefined)
    registrarVotoEmitidoAnonimoMock.mockResolvedValue(undefined)
    obtenerEstadoRevotoMock.mockResolvedValue({ ...defaultEstadoRevoto })
    // VOTAR-325: por defecto simula que el contrato aún no tiene despliegue
    // alcanzable; los tests existentes (que asumen el estado off-chain como
    // única fuente) siguen valiendo sin cambios. Los tests on-chain overridean esto.
    leerVoterStateMock.mockRejectedValue(new Error('contract not reachable'))
    registrarConsumoIntentoMock.mockResolvedValue({
      ...defaultEstadoRevoto,
      votosConsumidos: 1,
      intentosRestantes: 2,
    })
    initializeWalletMock.mockResolvedValue({
      idEleccion: 7,
      publicKeyHex: WALLET_PUBLIC_KEY,
      createdAt: Date.now(),
    })
    signVotePayloadMock.mockResolvedValue({
      electionId: 7,
      nullifier: '0x' + 'b'.repeat(64),
      selectionHash: '0x' + 'c'.repeat(64),
      candidateId: 101n,
      timestamp: 1_700_000_000,
      expectedSigner: '0x' + 'd'.repeat(40),
      signature: '0x' + 'e'.repeat(130),
    })
    transmitSignedVoteMock.mockResolvedValue({
      txHash: '0x' + 'f'.repeat(64),
      blockNumber: 42n,
    })
  })

  it('aplica superficie clara en el shell bajo tema oscuro global (VOTAR-412)', async () => {
    document.documentElement.classList.add('dark')
    await renderWizard()

    const main = document.querySelector('main')
    expect(main?.className).toContain('votar-light-surface')
  })

  it('agrupa candidatos por partido en votación por candidato', async () => {
    const screen = await renderWizard()

    await expect
      .element(
        screen.getByRole('group', { name: /Agrupación Lista Azul/i }).first()
      )
      .toBeInTheDocument()
    await expect
      .element(
        screen.getByRole('group', { name: /Agrupación Lista Celeste/i }).first()
      )
      .toBeInTheDocument()
  })

  it('oculta candidatos por rol al seleccionar una opción especial', async () => {
    const screen = await renderWizard()

    await expect
      .element(screen.getByText('Candidatos por rol'))
      .toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )

    await expect
      .element(screen.getByText('Candidatos por rol'))
      .not.toBeInTheDocument()
  })

  it('VOTAR-356 UAT-03: inicia sin preseleccionar candidatos ni voto en blanco', async () => {
    const screen = await renderWizard()

    const blankPresidente = screen.getByRole('button', {
      name: /Voto en Blanco para Presidente/i,
    })
    const blankVocales = screen.getByRole('button', {
      name: /Voto en Blanco para Vocales/i,
    })
    const ana = screen.getByRole('button', { name: /Ana Lopez/i })

    expect(blankPresidente.element().getAttribute('aria-pressed')).toBe('false')
    expect(blankVocales.element().getAttribute('aria-pressed')).toBe('false')
    expect(ana.element().getAttribute('aria-pressed')).toBe('false')
  })

  it('VOTAR-356 UAT-01: voto en blanco por categoría desmarca candidatos y permite confirmar', async () => {
    const screen = await renderWizard()

    await userEvent.click(screen.getByRole('button', { name: /Ana Lopez/i }))
    expect(
      screen
        .getByRole('button', { name: /Ana Lopez/i })
        .element()
        .getAttribute('aria-pressed')
    ).toBe('true')

    await userEvent.click(
      screen.getByRole('button', {
        name: /Voto en Blanco para Presidente/i,
      })
    )

    expect(
      screen
        .getByRole('button', { name: /Ana Lopez/i })
        .element()
        .getAttribute('aria-pressed')
    ).toBe('false')
    expect(
      screen
        .getByRole('button', { name: /Voto en Blanco para Presidente/i })
        .element()
        .getAttribute('aria-pressed')
    ).toBe('true')

    await userEvent.click(
      screen.getByRole('button', {
        name: /Voto en Blanco para Vocales/i,
      })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))

    await expect.element(screen.getByText('Voto en blanco')).toBeInTheDocument()
    await expect.element(screen.getByText('Ana Lopez')).not.toBeInTheDocument()
  })

  it('VOTAR-356 UAT-02: elegir un candidato desmarca el voto en blanco de esa categoría', async () => {
    const screen = await renderWizard()

    await userEvent.click(
      screen.getByRole('button', {
        name: /Voto en Blanco para Presidente/i,
      })
    )
    expect(
      screen
        .getByRole('button', { name: /Voto en Blanco para Presidente/i })
        .element()
        .getAttribute('aria-pressed')
    ).toBe('true')

    await userEvent.click(screen.getByRole('button', { name: /Bruno Paz/i }))

    expect(
      screen
        .getByRole('button', { name: /Voto en Blanco para Presidente/i })
        .element()
        .getAttribute('aria-pressed')
    ).toBe('false')
    expect(
      screen
        .getByRole('button', { name: /Bruno Paz/i })
        .element()
        .getAttribute('aria-pressed')
    ).toBe('true')
  })

  it('VOTAR-438: el voto en blanco se muestra siempre, sin importar permitirVotoEnBlanco', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <EphemeralWalletProvider>
          <BudVotingWizard
            boleta={{ ...boleta, permitirVotoEnBlanco: false }}
            tipoVotacion={TIPOS_VOTACION.POR_CANDIDATO}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await userEvent.click(
      screen.getByRole('button', { name: /Confirmar Identidad y Comenzar/i })
    )

    await expect
      .element(
        screen.getByRole('button', { name: /Voto en Blanco para Presidente/i })
      )
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: /Votar en blanco/i }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: /Anular voto/i }))
      .toBeInTheDocument()
  })

  it('VOTAR-443: no renderiza "Anular voto" si permitirVotoNulo es false', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <EphemeralWalletProvider>
          <BudVotingWizard
            boleta={{ ...boleta, permitirVotoNulo: false }}
            tipoVotacion={TIPOS_VOTACION.POR_CANDIDATO}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await userEvent.click(
      screen.getByRole('button', { name: /Confirmar Identidad y Comenzar/i })
    )

    await expect
      .element(screen.getByRole('button', { name: /Anular voto/i }))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: /Votar en blanco/i }))
      .toBeInTheDocument()
  })

  it('VOTAR-443: con ambos flags en false, mantiene "Votar en blanco" pero no "Anular voto"', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <EphemeralWalletProvider>
          <BudVotingWizard
            boleta={{
              ...boleta,
              permitirVotoEnBlanco: false,
              permitirVotoNulo: false,
            }}
            tipoVotacion={TIPOS_VOTACION.POR_CANDIDATO}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await userEvent.click(
      screen.getByRole('button', { name: /Confirmar Identidad y Comenzar/i })
    )

    await expect
      .element(screen.getByRole('button', { name: /Votar en blanco/i }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: /Anular voto/i }))
      .not.toBeInTheDocument()
  })

  it('permite un solo candidato seleccionado por rol', async () => {
    const screen = await renderWizard()

    await userEvent.click(screen.getByRole('button', { name: /Ana Lopez/i }))
    await userEvent.click(screen.getByRole('button', { name: /Bruno Paz/i }))
    await userEvent.click(screen.getByRole('button', { name: /Carla Rio/i }))
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))

    await expect.element(screen.getByText('Bruno Paz')).toBeInTheDocument()
    await expect.element(screen.getByText('Carla Rio')).toBeInTheDocument()
    await expect.element(screen.getByText('Ana Lopez')).not.toBeInTheDocument()
  })

  it('en voto mixto no muestra candidatos por rol al confirmar voto especial', async () => {
    const screen = await renderWizard(TIPOS_VOTACION.MIXTO)

    await userEvent.click(
      screen.getByRole('button', { name: /^LA Lista Azul Lista LA/i })
    )
    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )

    await expect
      .element(screen.getByText('Candidatos por rol'))
      .not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))

    await expect.element(screen.getByText('Voto en blanco')).toBeInTheDocument()
    await expect.element(screen.getByText('Ana Lopez')).not.toBeInTheDocument()
    await expect
      .element(screen.getByText('Candidatos por rol'))
      .not.toBeInTheDocument()
  })

  it('en voto mixto autoselecciona un candidato por rol al elegir lista', async () => {
    const screen = await renderWizard(TIPOS_VOTACION.MIXTO)

    await userEvent.click(
      screen.getByRole('button', { name: /^LA Lista Azul Lista LA/i })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))

    await expect.element(screen.getByText('Ana Lopez')).toBeInTheDocument()
    await expect.element(screen.getByText('Carla Rio')).toBeInTheDocument()
    await expect.element(screen.getByText('Alicia Sol')).not.toBeInTheDocument()
  })

  it('UAT-01: firma localmente y transmite el voto a la blockchain', async () => {
    const expectedNullifier = calcularNullifier(
      WALLET_PUBLIC_KEY,
      boleta.idEleccion
    )
    const expectedTxHash = '0x' + 'f'.repeat(64)
    const screen = await renderWizard()

    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /Firmar y confirmar/i })
    )

    await expect
      .element(screen.getByText(/Voto registrado exitosamente/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByLabelText(`Hash de transacción ${expectedTxHash}`))
      .toBeInTheDocument()
    expect(signVotePayloadMock).toHaveBeenCalledOnce()
    expect(signVotePayloadMock).toHaveBeenCalledWith(
      expect.objectContaining({ votoEnBlanco: true }),
      expectedNullifier,
      BALLOT_CONTRACT_ADDRESS
    )
    expect(transmitSignedVoteMock).toHaveBeenCalledOnce()
    expect(document.body.innerHTML).not.toContain(expectedNullifier)
    expect(registrarConsumoIntentoMock).toHaveBeenCalledOnce()
    expect(clearVotanteSessionMock).toHaveBeenCalledOnce()
    expect(registrarVotoEmitidoAnonimoMock).toHaveBeenCalledWith(
      boleta.idEleccion
    )
  })

  it('VOTAR-379 UAT-03: tras el recibo limpia sesión SSO y no deja nullifier en storage', async () => {
    const expectedNullifier = calcularNullifier(
      WALLET_PUBLIC_KEY,
      boleta.idEleccion
    )
    localStorage.setItem('noise', 'keep-unrelated')
    const screen = await renderWizard()

    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /Firmar y confirmar/i })
    )

    await expect
      .element(screen.getByText(/Voto registrado exitosamente/i))
      .toBeInTheDocument()
    expect(clearVotanteSessionMock).toHaveBeenCalledOnce()
    expect(registrarVotoEmitidoAnonimoMock).toHaveBeenCalledWith(
      boleta.idEleccion
    )
    expect(sessionStorage.getItem('nullifier')).toBeNull()
    expect(localStorage.getItem('nullifier')).toBeNull()
    expect(document.cookie).not.toContain('votar_voter_access_token')
    expect(document.body.innerHTML).not.toContain(expectedNullifier)
  })

  it('UAT-02: ante fallo de red conserva la selección y permite reintentar envío', async () => {
    transmitSignedVoteMock.mockRejectedValueOnce({
      code: 'network',
      message:
        'No pudimos conectar con la red blockchain. Reintentá el envío cuando recuperes la conexión. Tu selección se conserva.',
      severity: 'warning',
      isTransient: true,
      canRetrySend: true,
      canResign: true,
    })
    transmitSignedVoteMock.mockResolvedValueOnce({
      txHash: '0x' + 'a'.repeat(64),
      blockNumber: 9n,
    })

    const screen = await renderWizard()
    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /Firmar y confirmar/i })
    )

    await expect
      .element(screen.getByText('Error de conexión'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Tu selección se conserva', { exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Voto en blanco', { exact: true }))
      .toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: /Reintentar envío/i })
    )
    await expect
      .element(screen.getByText(/Voto registrado exitosamente/i))
      .toBeInTheDocument()
    expect(transmitSignedVoteMock).toHaveBeenCalledTimes(2)
    expect(signVotePayloadMock).toHaveBeenCalledOnce()
  })

  it('UAT-04: interpreta RevoteDisabled / already_registered como voto ya registrado', async () => {
    transmitSignedVoteMock.mockRejectedValueOnce({
      code: 'already_registered',
      message:
        'Este voto ya está registrado en la blockchain. No es necesario volver a enviarlo.',
      severity: 'error',
      isTransient: false,
      canRetrySend: false,
      canResign: false,
    })

    const screen = await renderWizard()
    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /Firmar y confirmar/i })
    )

    await expect
      .element(screen.getByText('Voto ya registrado', { exact: true }))
      .toBeInTheDocument()
    await expect
      .element(
        screen.getByText(/Este voto ya está registrado en la blockchain/i)
      )
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: /Reintentar envío/i }))
      .not.toBeInTheDocument()
  })

  it('muestra error cuando falla la reinicialización de la billetera efímera', async () => {
    initializeWalletMock.mockRejectedValueOnce(new Error('wallet init failed'))
    const screen = await renderWizard()

    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /Firmar y confirmar/i })
    )

    await expect
      .element(screen.getByText('No se pudo firmar el voto'))
      .toBeInTheDocument()
    expect(signVotePayloadMock).not.toHaveBeenCalled()
    expect(transmitSignedVoteMock).not.toHaveBeenCalled()
  })

  it('muestra error cuando la firma local falla', async () => {
    signVotePayloadMock.mockRejectedValueOnce(new Error('sign failed'))
    const screen = await renderWizard()

    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /Firmar y confirmar/i })
    )

    await expect
      .element(screen.getByText('No se pudo firmar el voto'))
      .toBeInTheDocument()
    expect(transmitSignedVoteMock).not.toHaveBeenCalled()
  })

  it('VOTAR-379: tras el recibo, modificar voto cierra sesión (revoto requiere re-auth)', async () => {
    const expectedTxHash = '0x' + 'f'.repeat(64)
    const onLogout = vi.fn()
    const screen = await renderWizard(TIPOS_VOTACION.POR_CANDIDATO, onLogout)

    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /Firmar y confirmar/i })
    )

    await expect
      .element(screen.getByText(/Voto registrado exitosamente/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByLabelText(`Hash de transacción ${expectedTxHash}`))
      .toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: /Modificar mi voto/i })
    )

    expect(onLogout).toHaveBeenCalled()
  })

  it('VOTAR-328 UAT-01: con maxVotesPerVoter=3 y 1 voto consumido muestra Intentos restantes: 2', async () => {
    obtenerEstadoRevotoMock.mockResolvedValue({
      ...defaultEstadoRevoto,
      votosConsumidos: 1,
      intentosRestantes: 2,
      puedeVotar: true,
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <EphemeralWalletProvider>
          <BudVotingWizard
            boleta={boleta}
            tipoVotacion={TIPOS_VOTACION.POR_CANDIDATO}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await expect
      .element(screen.getByText('Intentos restantes: 2'))
      .toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: /Confirmar Identidad y Comenzar/i })
    )
    await userEvent.click(
      screen.getByRole('button', { name: /Modificar mi voto/i })
    )

    await expect
      .element(screen.getByText('Intentos restantes: 2'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Opciones especiales'))
      .toBeInTheDocument()
  })

  it('VOTAR-359 UAT-01: cooldown off-chain muestra panel de espera, no límite máximo', async () => {
    obtenerEstadoRevotoMock.mockResolvedValue({
      ...defaultEstadoRevoto,
      votosConsumidos: 1,
      intentosRestantes: 2,
      puedeVotar: false,
      minIntervaloSegundos: 180,
      proximoReintentoEnSegundos: 150,
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <EphemeralWalletProvider>
          <BudVotingWizard
            boleta={boleta}
            tipoVotacion={TIPOS_VOTACION.POR_CANDIDATO}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await expect
      .element(screen.getByTestId('retry-too-soon-panel'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/Debe esperar 3 minutos/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByTestId('max-votes-reached-panel'))
      .not.toBeInTheDocument()
    expect(toastWarningMock).toHaveBeenCalled()
    expect(logVoteTxErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        electionId: boleta.idEleccion,
        code: 'retry_too_soon',
      })
    )
  })

  it('VOTAR-325 UAT-01: cooldown on-chain muestra contador mm:ss que decrementa cada segundo', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    leerVoterStateMock.mockResolvedValue({
      votesUsed: 1,
      lastVoteAt: nowSeconds - 1,
      cooldownRemaining: 299,
      blockTimestamp: nowSeconds,
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <EphemeralWalletProvider>
          <BudVotingWizard
            boleta={boleta}
            tipoVotacion={TIPOS_VOTACION.POR_CANDIDATO}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await expect
      .element(screen.getByTestId('retry-too-soon-panel'))
      .toBeInTheDocument()

    const countdown = screen.getByTestId('retry-too-soon-countdown')
    // mm:ss format, sin fijar un valor exacto: el fetch de leerVoterState y el
    // polling de expect.element corren en tiempo real, así que unos segundos
    // ya pudieron transcurrir antes de esta primera lectura (no-flaky).
    await expect.element(countdown).toHaveTextContent(/^\d{2}:\d{2}$/)
    const initialText = countdown.element().textContent ?? ''

    // El ticker del panel usa un setInterval real (registrado antes de que el
    // test pudiera fake-earlo), así que se espera el tick real de 1s en vez de
    // vi.useFakeTimers() — avanzar timers falsos no mueve un interval ya real.
    await expect.element(countdown).not.toHaveTextContent(initialText)

    const laterSeconds = mmssToSeconds(countdown.element().textContent)
    expect(laterSeconds).toBeLessThan(mmssToSeconds(initialText))
  })

  it('VOTAR-325 UAT-02: getVoterState() rechazado por el nodo mantiene el fallback off-chain (sin datos on-chain confiables)', async () => {
    leerVoterStateMock.mockRejectedValue(new Error('network error'))
    obtenerEstadoRevotoMock.mockResolvedValue({
      ...defaultEstadoRevoto,
      puedeVotar: false,
      minIntervaloSegundos: 180,
      proximoReintentoEnSegundos: 150,
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <EphemeralWalletProvider>
          <BudVotingWizard
            boleta={boleta}
            tipoVotacion={TIPOS_VOTACION.POR_CANDIDATO}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await expect
      .element(screen.getByTestId('retry-too-soon-panel'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/Debe esperar 3 minutos/i))
      .toBeInTheDocument()
  })

  it('VOTAR-359 UAT-02: muestra mensaje NotEligible ante error de padrón on-chain', async () => {
    transmitSignedVoteMock.mockRejectedValueOnce({
      code: 'not_eligible',
      message: VOTE_TX_MESSAGES.notEligible,
      severity: 'error',
      revertName: 'InvalidMerkleProof',
      isTransient: false,
      canRetrySend: false,
      canResign: true,
    })

    const screen = await renderWizard()
    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /Firmar y confirmar/i })
    )

    await expect
      .element(screen.getByText(VOTE_TX_MESSAGES.notEligible))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('No habilitado en el padrón'))
      .toBeInTheDocument()
    expect(toastErrorMock).toHaveBeenCalledWith(
      VOTE_TX_MESSAGES.notEligible,
      expect.objectContaining({ duration: 8000 })
    )
    expect(logVoteTxErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        electionId: boleta.idEleccion,
        code: 'not_eligible',
      })
    )
  })

  it('VOTAR-328 UAT-02: con intentos agotados oculta la boleta y muestra panel de límite', async () => {
    obtenerEstadoRevotoMock.mockResolvedValue({
      ...defaultEstadoRevoto,
      maxVotosPorVotante: 3,
      votosConsumidos: 3,
      intentosRestantes: 0,
      puedeVotar: false,
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <EphemeralWalletProvider>
          <BudVotingWizard
            boleta={boleta}
            tipoVotacion={TIPOS_VOTACION.POR_CANDIDATO}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await expect
      .element(screen.getByText('Intentos restantes: 0'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByTestId('max-votes-reached-panel'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/Alcanzaste el límite máximo de votos/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Opciones especiales'))
      .not.toBeInTheDocument()
  })

  it('VOTAR-363 UAT-01: layout mobile-first en paso selección', async () => {
    const screen = await renderWizard()

    const main = document.querySelector('main')
    expect(main?.className).toContain('overflow-x-clip')

    const grid = screen.getByTestId('bud-category-grid').element()
    expect(grid.className).toContain('grid-cols-1')
    expect(grid.className).toContain('md:grid-cols-2')

    const continueButton = screen.getByRole('button', { name: /^Continuar/i })
    expect(continueButton.element().className).toContain('w-full')
    expect(continueButton.element().className).toContain('sm:w-auto')

    const stickyContainer = continueButton.element().parentElement
    expect(stickyContainer?.className).toContain('w-full')
    expect(stickyContainer?.className).toContain('justify-stretch')
  })

  it('VOTAR-363 UAT-02: grid de categorías declara columnas paralelas desde md', async () => {
    const screen = await renderWizard()

    const grid = screen.getByTestId('bud-category-grid').element()
    expect(grid.className).toBe(BUD_CATEGORY_GRID_CLASS)
    expect(grid.className).toContain('md:grid-cols-2')
    expect(grid.className).toContain('xl:grid-cols-3')
  })
})
