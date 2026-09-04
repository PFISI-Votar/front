import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import {
  TIPOS_VOTACION,
  type TipoVotacion,
} from '@/features/eleccion/lista/data/schema'
import { BUD_LIST_GRID_CLASS } from '@/features/voto/components/bud-layout.constants'
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
const registrarTransaccionPublicaMock = vi.fn().mockResolvedValue(undefined)
const registrarConsumoIntentoMock = vi.fn()
const obtenerEstadoRevotoMock = vi.fn()
const leerVoterStateMock = vi.fn()
const leerHasVotedMock = vi.fn()
const leerIsNullifierUsedMock = vi.fn()

vi.mock('@/features/voto/crypto/voter-state', () => ({
  leerVoterState: (...args: unknown[]) => leerVoterStateMock(...args),
  leerHasVoted: (...args: unknown[]) => leerHasVotedMock(...args),
  leerIsNullifierUsed: (...args: unknown[]) => leerIsNullifierUsedMock(...args),
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
  registrarTransaccionPublica: (...args: unknown[]) =>
    registrarTransaccionPublicaMock(...args),
  obtenerEstadoRevoto: (...args: unknown[]) => obtenerEstadoRevotoMock(...args),
  registrarConsumoIntento: (...args: unknown[]) =>
    registrarConsumoIntentoMock(...args),
}))

const clearVotanteSessionMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/features/voto/services/votante-session', () => ({
  clearVotanteSession: (...args: unknown[]) => clearVotanteSessionMock(...args),
}))

const transmitSignedVoteMock = vi.fn()
const waitForVoteTxReceiptMock = vi.fn()

vi.mock('@/features/voto/crypto/vote-transmitter', () => ({
  transmitSignedVote: (...args: unknown[]) => transmitSignedVoteMock(...args),
  waitForVoteTxReceipt: (...args: unknown[]) =>
    waitForVoteTxReceiptMock(...args),
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

const VOTANTE_SCOPE = 'test-voter-sub'

async function renderWizard(
  tipoVotacion: TipoVotacion = TIPOS_VOTACION.POR_CANDIDATO,
  onLogout: () => void = vi.fn(),
  boletaOverride: BoletaDigital = boleta
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <EphemeralWalletProvider>
        <BudVotingWizard
          boleta={boletaOverride}
          tipoVotacion={tipoVotacion}
          votanteScope={VOTANTE_SCOPE}
          onLogout={onLogout}
        />
      </EphemeralWalletProvider>
    </QueryClientProvider>
  )

  await userEvent.click(
    screen.getByRole('button', { name: /Comenzar a votar/i })
  )
  await expect
    .element(screen.getByText('Opciones especiales'))
    .toBeInTheDocument()

  return screen
}

describe('BudVotingWizard', () => {
  beforeEach(() => {
    walletState.publicKeyHex = WALLET_PUBLIC_KEY
    localStorage.clear()
    signVotePayloadMock.mockClear()
    transmitSignedVoteMock.mockReset()
    waitForVoteTxReceiptMock.mockReset()
    initializeWalletMock.mockClear()
    clearVotanteSessionMock.mockClear()
    registrarVotoEmitidoAnonimoMock.mockClear()
    registrarTransaccionPublicaMock.mockClear()
    registrarConsumoIntentoMock.mockClear()
    toastWarningMock.mockClear()
    toastErrorMock.mockClear()
    logVoteTxErrorMock.mockClear()
    obtenerEstadoRevotoMock.mockReset()
    leerVoterStateMock.mockReset()
    leerHasVotedMock.mockReset()
    leerIsNullifierUsedMock.mockReset()
    clearVotanteSessionMock.mockResolvedValue(undefined)
    registrarVotoEmitidoAnonimoMock.mockResolvedValue(undefined)
    registrarTransaccionPublicaMock.mockResolvedValue(undefined)
    obtenerEstadoRevotoMock.mockResolvedValue({ ...defaultEstadoRevoto })
    // VOTAR-325: por defecto simula que el contrato aún no tiene despliegue
    // alcanzable; los tests existentes (que asumen el estado off-chain como
    // única fuente) siguen valiendo sin cambios. Los tests on-chain overridean esto.
    leerVoterStateMock.mockRejectedValue(new Error('contract not reachable'))
    // VOTAR-451: leaf libre por defecto → el camino feliz sigue transmitiendo.
    leerHasVotedMock.mockResolvedValue(false)
    leerIsNullifierUsedMock.mockResolvedValue(false)
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
    transmitSignedVoteMock.mockImplementation(
      async (
        _input: unknown,
        options?: { onTxHash?: (hash: string) => void }
      ) => {
        const result = {
          txHash: ('0x' + 'f'.repeat(64)) as `0x${string}`,
          blockNumber: 42n,
        }
        options?.onTxHash?.(result.txHash)
        return result
      }
    )
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

    // VOTAR-464: por cargo muestra un cargo a la vez — Presidente es el
    // primero, Vocales recién aparece al navegar a esa tab.
    const blankPresidente = screen.getByRole('button', {
      name: /Voto en Blanco para Presidente/i,
    })
    const ana = screen.getByRole('button', { name: /Ana Lopez/i })
    expect(blankPresidente.element().getAttribute('aria-pressed')).toBe('false')
    expect(ana.element().getAttribute('aria-pressed')).toBe('false')

    await userEvent.click(screen.getByRole('tab', { name: /Vocales/i }))
    const blankVocales = screen.getByRole('button', {
      name: /Voto en Blanco para Vocales/i,
    })
    expect(blankVocales.element().getAttribute('aria-pressed')).toBe('false')
  })

  it('VOTAR-356 UAT-01: voto en blanco por categoría desmarca candidatos y permite confirmar', async () => {
    const screen = await renderWizard()

    // Elegir un candidato avanza automáticamente al siguiente cargo
    // (VOTAR-464), así que volvemos a la tab de Presidente para verificar.
    await userEvent.click(screen.getByRole('button', { name: /Ana Lopez/i }))
    await userEvent.click(screen.getByRole('tab', { name: /Presidente/i }))
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
    await userEvent.click(screen.getByRole('tab', { name: /Presidente/i }))

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

    await userEvent.click(screen.getByRole('tab', { name: /Vocales/i }))
    await userEvent.click(
      screen.getByRole('button', {
        name: /Voto en Blanco para Vocales/i,
      })
    )
    // VOTAR-464: resolver el último cargo pendiente avanza directo a
    // revisión — no queda un "Continuar" para clickear.

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
    await userEvent.click(screen.getByRole('tab', { name: /Presidente/i }))
    expect(
      screen
        .getByRole('button', { name: /Voto en Blanco para Presidente/i })
        .element()
        .getAttribute('aria-pressed')
    ).toBe('true')

    await userEvent.click(screen.getByRole('button', { name: /Bruno Paz/i }))
    await userEvent.click(screen.getByRole('tab', { name: /Presidente/i }))

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
            votanteScope={VOTANTE_SCOPE}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await userEvent.click(
      screen.getByRole('button', { name: /Comenzar a votar/i })
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
            votanteScope={VOTANTE_SCOPE}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await userEvent.click(
      screen.getByRole('button', { name: /Comenzar a votar/i })
    )
    await expect
      .element(screen.getByText('Opciones especiales'))
      .toBeInTheDocument()

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
            votanteScope={VOTANTE_SCOPE}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await userEvent.click(
      screen.getByRole('button', { name: /Comenzar a votar/i })
    )
    await expect
      .element(screen.getByText('Opciones especiales'))
      .toBeInTheDocument()

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
    // Elegir Ana avanzó a Vocales (VOTAR-464); volvemos a Presidente para
    // cambiar la selección a Bruno.
    await userEvent.click(screen.getByRole('tab', { name: /Presidente/i }))
    await userEvent.click(screen.getByRole('button', { name: /Bruno Paz/i }))
    await userEvent.click(screen.getByRole('button', { name: /Carla Rio/i }))
    // VOTAR-464: Carla resuelve el último cargo pendiente y avanza directo
    // a revisión — no queda un "Continuar" para clickear.

    await expect.element(screen.getByText('Bruno Paz')).toBeInTheDocument()
    await expect.element(screen.getByText('Carla Rio')).toBeInTheDocument()
    await expect.element(screen.getByText('Ana Lopez')).not.toBeInTheDocument()
  })

  it('en por cargo, elegir la lista completa desde la agrupación de un rol autoselecciona un candidato por rol y avanza a revisión', async () => {
    const screen = await renderWizard()

    await userEvent.click(
      screen.getByRole('button', {
        name: /Elegir la lista completa Lista Azul/i,
      })
    )
    // VOTAR-464: elegir la lista completa ya deja la boleta lista y avanza
    // directo a revisión — no queda un "Continuar" para clickear.

    await expect.element(screen.getByText('Ana Lopez')).toBeInTheDocument()
    await expect.element(screen.getByText('Carla Rio')).toBeInTheDocument()
    await expect.element(screen.getByText('Alicia Sol')).not.toBeInTheDocument()
  })

  it('en por cargo, se puede sobrescribir un candidato individual tras elegir la lista completa (corte de boleta)', async () => {
    const screen = await renderWizard()

    await userEvent.click(
      screen.getByRole('button', {
        name: /Elegir la lista completa Lista Azul/i,
      })
    )
    // Elegir la lista ya avanzó a revisión; volvemos a selección para poder
    // sobrescribir un candidato individual sin tocar Vocales.
    await userEvent.click(screen.getByRole('button', { name: /Volver/i }))
    // Presidente venía precargado con Ana Lopez (Lista Azul); lo cambiamos
    // por Bruno Paz. La boleta ya estaba completa por el auto-relleno, así
    // que este cambio vuelve a avanzar directo a revisión (VOTAR-464).
    await userEvent.click(screen.getByRole('button', { name: /Bruno Paz/i }))

    await expect.element(screen.getByText('Bruno Paz')).toBeInTheDocument()
    await expect.element(screen.getByText('Carla Rio')).toBeInTheDocument()
    await expect.element(screen.getByText('Ana Lopez')).not.toBeInTheDocument()
  })

  it('VOTAR-464: en por cargo, si la lista elegida no postuló candidato para un rol, la revisión lo muestra en blanco en vez de omitirlo', async () => {
    const screen = await renderWizard()

    // Lista Celeste sólo postuló candidato para Presidente, no para Vocales.
    // Elegir la lista ya deja la boleta completa y avanza directo a revisión.
    await userEvent.click(
      screen.getByRole('button', {
        name: /Elegir la lista completa Lista Celeste/i,
      })
    )

    await expect.element(screen.getByText('Bruno Paz')).toBeInTheDocument()
    await expect.element(screen.getByText('Voto en blanco')).toBeInTheDocument()
    await expect.element(screen.getByText('Vocales')).toBeInTheDocument()
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
    expect(registrarTransaccionPublicaMock).toHaveBeenCalledWith(
      boleta.idEleccion,
      expectedTxHash
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
    expect(registrarTransaccionPublicaMock).toHaveBeenCalledWith(
      boleta.idEleccion,
      '0x' + 'f'.repeat(64)
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

  it('UAT-04 / VOTAR-445: already_registered reconcilia consumo y muestra éxito', async () => {
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
      .element(screen.getByText('Voto Exitoso', { exact: true }))
      .toBeInTheDocument()
    expect(registrarConsumoIntentoMock).toHaveBeenCalledOnce()
    expect(clearVotanteSessionMock).toHaveBeenCalledOnce()
    await expect
      .element(screen.getByRole('button', { name: /Reintentar envío/i }))
      .not.toBeInTheDocument()
  })

  it('VOTAR-451: si el leaf ya votó con otro nullifier, no retransmite y muestra éxito', async () => {
    leerHasVotedMock.mockResolvedValue(true)
    leerIsNullifierUsedMock.mockResolvedValue(false)

    const screen = await renderWizard()
    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /Firmar y confirmar/i })
    )

    await expect
      .element(screen.getByText('Voto Exitoso', { exact: true }))
      .toBeInTheDocument()
    expect(transmitSignedVoteMock).not.toHaveBeenCalled()
    expect(registrarConsumoIntentoMock).toHaveBeenCalledOnce()
    expect(registrarConsumoIntentoMock).toHaveBeenCalledWith(7, 1)
  })

  it('VOTAR-445: muestra Cerrar sesión en pasos activos del wizard', async () => {
    const onLogout = vi.fn()
    const screen = await renderWizard(TIPOS_VOTACION.POR_CANDIDATO, onLogout)

    await expect.element(screen.getByTestId('bud-logout')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('bud-logout'))
    expect(onLogout).toHaveBeenCalledOnce()
    expect(registrarConsumoIntentoMock).not.toHaveBeenCalled()
  })

  it('VOTAR-475: no muestra chip de paso en el header; el stepper conserva las etiquetas', async () => {
    const screen = await renderWizard()

    await expect
      .element(screen.getByText('Selección de voto'))
      .not.toBeInTheDocument()
    await expect.element(screen.getByText('Inicio').first()).toBeInTheDocument()
    await expect
      .element(screen.getByText('Confirmación').first())
      .toBeInTheDocument()
    await expect.element(screen.getByText('Éxito').first()).toBeInTheDocument()
  })

  it('VOTAR-445: reanuda cast pendiente tras reload y completa el recibo', async () => {
    const pendingHash = ('0x' + 'a'.repeat(64)) as `0x${string}`
    localStorage.setItem(
      'votar:pending-vote-cast:7',
      JSON.stringify({
        idEleccion: 7,
        txHash: pendingHash,
        startedAt: Date.now(),
      })
    )
    waitForVoteTxReceiptMock.mockResolvedValueOnce({
      txHash: pendingHash,
      blockNumber: 99n,
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
            votanteScope={VOTANTE_SCOPE}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await expect
      .element(screen.getByText(/Voto registrado exitosamente/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByLabelText(`Hash de transacción ${pendingHash}`))
      .toBeInTheDocument()
    expect(waitForVoteTxReceiptMock).toHaveBeenCalledWith(pendingHash)
    expect(registrarConsumoIntentoMock).toHaveBeenCalledOnce()
    expect(clearVotanteSessionMock).toHaveBeenCalledOnce()
    expect(localStorage.getItem('votar:pending-vote-cast:7')).toBeNull()
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
            votanteScope={VOTANTE_SCOPE}
            onLogout={vi.fn()}
          />
        </EphemeralWalletProvider>
      </QueryClientProvider>
    )

    await expect
      .element(screen.getByText('Intentos restantes: 2'))
      .toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: /Comenzar a votar/i })
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
            votanteScope={VOTANTE_SCOPE}
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
            votanteScope={VOTANTE_SCOPE}
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
            votanteScope={VOTANTE_SCOPE}
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
            votanteScope={VOTANTE_SCOPE}
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
    // VOTAR-464: "por candidato" muestra un cargo a la vez (tabs), en vez de
    // una grilla multi-columna de categorías.
    const screen = await renderWizard()

    const main = document.querySelector('main')
    expect(main?.className).toContain('overflow-x-clip')

    const grid = screen.getByTestId('bud-category-grid').element()
    expect(grid.className).toBe('grid gap-5')

    const continueButton = screen.getByRole('button', { name: /^Continuar/i })
    expect(continueButton.element().className).toContain('w-full')
    expect(continueButton.element().className).toContain('sm:w-auto')

    const stickyContainer = continueButton.element().parentElement
    expect(stickyContainer?.className).toContain('w-full')
    expect(stickyContainer?.className).toContain('justify-stretch')
  })

  it('VOTAR-464: en "por candidato" se muestra un cargo a la vez y se avanza con tabs', async () => {
    const screen = await renderWizard()

    // Presidente es el primer cargo; Vocales todavía no se ve.
    await expect
      .element(screen.getByRole('tab', { name: /Presidente/i }))
      .toBeInTheDocument()
    await expect
      .element(
        screen.getByRole('button', { name: /Voto en Blanco para Vocales/i })
      )
      .not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Ana Lopez/i }))

    // Elegir un candidato avanza automáticamente al siguiente cargo.
    await expect
      .element(
        screen.getByRole('button', { name: /Voto en Blanco para Vocales/i })
      )
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: /Ana Lopez/i }))
      .not.toBeInTheDocument()

    // La tab de Presidente queda marcada como resuelta y navegable.
    await userEvent.click(screen.getByRole('tab', { name: /Presidente/i }))
    await expect
      .element(screen.getByRole('button', { name: /Ana Lopez/i }))
      .toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: /Siguiente cargo/i })
    )
    await expect
      .element(
        screen.getByRole('button', { name: /Voto en Blanco para Vocales/i })
      )
      .toBeInTheDocument()
  })

  it('VOTAR-465 UAT-01: listas completas usan grid mobile-first', async () => {
    const screen = await renderWizard(TIPOS_VOTACION.POR_LISTA)

    const grid = screen.getByTestId('bud-list-grid').element()
    expect(grid.className).toContain('grid-cols-1')
    expect(grid.className).toContain('md:grid-cols-2')
    expect(grid.className).toContain('items-start')
  })

  it('VOTAR-465 UAT-02: grid de listas declara columnas paralelas desde md', async () => {
    const screen = await renderWizard(TIPOS_VOTACION.POR_LISTA)

    const grid = screen.getByTestId('bud-list-grid').element()
    expect(grid.className).toBe(BUD_LIST_GRID_CLASS)
    expect(grid.className).toContain('md:grid-cols-2')
    expect(grid.className).toContain('xl:grid-cols-3')
  })

  it('en por cargo no hay una grilla de listas separada: el atajo de lista completa vive dentro de cada agrupación por rol', async () => {
    const screen = await renderWizard()

    await expect
      .element(screen.getByTestId('bud-list-grid'))
      .not.toBeInTheDocument()

    const categoryGrid = screen.getByTestId('bud-category-grid').element()
    expect(categoryGrid.className).toBe('grid gap-5')

    await expect
      .element(
        screen.getByRole('button', {
          name: /Elegir la lista completa Lista Azul/i,
        })
      )
      .toBeInTheDocument()
    await expect
      .element(
        screen.getByRole('button', {
          name: /Elegir la lista completa Lista Celeste/i,
        })
      )
      .toBeInTheDocument()
  })
})
