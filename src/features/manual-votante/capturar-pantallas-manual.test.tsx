/**
 * VOTAR-389 / UAT-02 — Genera capturas reales de la BUD y el verificador
 * para el manual del votante.
 *
 * Excluido del suite habitual (vite.config). Ejecutar:
 *   Cambiar REGENERATE_MANUAL_SCREENSHOTS a true y ejecutar:
 *   npx vitest run --project browser src/features/manual-votante/capturar-pantallas-manual.test.tsx
 *
 * Las PNG se escriben en public/manual-votante/ (versionadas).
 */
import '@/styles/index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { TIPOS_VOTACION } from '@/features/eleccion/lista/data/schema'
import { BudLoginScreen } from '@/features/voto/components/bud-login-screen'
import { BudVotingWizard } from '@/features/voto/components/bud-voting-wizard'
import { VerificadorRecibo } from '@/features/voto/components/verificador-recibo'
import { EphemeralWalletProvider } from '@/features/voto/crypto/ephemeral-wallet-context'
import type { BoletaDigital } from '@/features/voto/data/schema'

const PUBLIC_DIR = '../../../public/manual-votante'

const REGENERATE = false

vi.mock('@/features/voto/services/votante-auth-api', () => ({
  loginVotante: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), error: vi.fn(), info: vi.fn(), success: vi.fn() },
}))

vi.mock('@/features/voto/crypto/log-vote-tx-error', () => ({
  logVoteTxError: vi.fn(),
}))

vi.mock('@/features/voto/crypto/voter-state', () => ({
  leerVoterState: vi.fn().mockRejectedValue(new Error('contract not reachable')),
  leerHasVoted: vi.fn().mockResolvedValue(false),
  leerIsNullifierUsed: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/features/voto/api/voto-api', () => ({
  solicitarMerkleProof: vi.fn().mockResolvedValue({
    hashHoja: 'a'.repeat(64),
    merkleProof: ['0x' + '1'.repeat(64)],
    root: '0x' + 'a'.repeat(64),
    ballotContractAddress: '0x' + '9'.repeat(40),
  }),
  registrarVotoEmitidoAnonimo: vi.fn().mockResolvedValue(undefined),
  registrarTransaccionPublica: vi.fn().mockResolvedValue(undefined),
  obtenerEstadoRevoto: vi.fn().mockResolvedValue({
    revoteHabilitado: true,
    maxVotosPorVotante: 3,
    votosConsumidos: 0,
    intentosRestantes: 3,
    puedeVotar: true,
    minIntervaloSegundos: 0,
    politicaRevoto: 'LAST_VOTE_WINS',
  }),
  registrarConsumoIntento: vi.fn().mockResolvedValue({
    revoteHabilitado: true,
    maxVotosPorVotante: 3,
    votosConsumidos: 1,
    intentosRestantes: 2,
    puedeVotar: true,
    minIntervaloSegundos: 0,
    politicaRevoto: 'LAST_VOTE_WINS',
  }),
}))

vi.mock('@/features/voto/services/votante-session', () => ({
  clearVotanteSession: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/features/voto/api/validacion-api', () => ({
  emitirCredencialValidacion: vi.fn().mockResolvedValue({
    expiraEn: new Date(Date.now() + 900_000).toISOString(),
  }),
  solicitarFirmaValidacion: vi.fn().mockResolvedValue({
    firmaValidacion: '0x' + '77'.repeat(65),
    direccionValidador: '0x' + '1'.repeat(40),
    algoritmo: 'ECDSA_SECP256K1_EIP712',
  }),
}))

vi.mock('@/features/voto/crypto/vote-transmitter', () => ({
  transmitSignedVote: vi.fn().mockImplementation(
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
  ),
  waitForVoteTxReceipt: vi.fn(),
}))

const WALLET_PUBLIC_KEY = '0x02' + 'a'.repeat(64)

vi.mock('@/features/voto/crypto/use-ephemeral-wallet', () => ({
  useEphemeralWallet: () => ({
    isSupported: true,
    isReady: true,
    publicKeyHex: WALLET_PUBLIC_KEY,
    session: {
      idEleccion: 7,
      publicKeyHex: WALLET_PUBLIC_KEY,
      createdAt: Date.now(),
    },
    initialize: vi.fn().mockResolvedValue({
      idEleccion: 7,
      publicKeyHex: WALLET_PUBLIC_KEY,
      createdAt: Date.now(),
    }),
    signVotePayload: vi.fn().mockResolvedValue({
      electionId: 7,
      nullifier: '0x' + 'b'.repeat(64),
      selectionHash: '0x' + 'c'.repeat(64),
      candidateIds: [101n],
      timestamp: 1_700_000_000,
      expectedSigner: '0x' + 'd'.repeat(40),
      signature: '0x' + 'e'.repeat(130),
    }),
    destroy: vi.fn(),
  }),
}))

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

const boleta: BoletaDigital = {
  idEleccion: 7,
  nombreEleccion: 'Centro de Estudiantes',
  estadoEleccion: 'ABIERTA',
  idBoleta: 70,
  titulo: 'Boleta - Centro de Estudiantes',
  permitirVotoEnBlanco: true,
  permitirVotoNulo: true,
  ballotContractAddress: ('0x' + '9'.repeat(40)) as `0x${string}`,
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
      ],
    },
  ],
}

const captureMain = async (filename: string) => {
  const main = document.querySelector('main')
  expect(main).toBeTruthy()
  await page.screenshot({
    element: main as Element,
    path: `${PUBLIC_DIR}/${filename}`,
  })
}

describe.skipIf(!REGENERATE)('VOTAR-389: capturas del manual del votante (UAT-02)', () => {
    beforeEach(() => {
      localStorage.clear()
      document.documentElement.classList.remove('dark')
      verificarInclusionMock.mockReset()
    })

    it('captura inicio de sesión, cabina y verificador', async () => {
      const loginScreen = await render(
        <BudLoginScreen idEleccion={7} onAuthenticated={vi.fn()} />
      )
      await expect
        .element(loginScreen.getByText('Bienvenido'))
        .toBeInTheDocument()
      await captureMain('01-inicio-sesion.png')
      loginScreen.unmount()

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      const identityScreen = await render(
        <QueryClientProvider client={queryClient}>
          <EphemeralWalletProvider>
            <BudVotingWizard
              boleta={boleta}
              tipoVotacion={TIPOS_VOTACION.POR_LISTA}
              votanteScope='manual-votante-capture'
              onLogout={vi.fn()}
            />
          </EphemeralWalletProvider>
        </QueryClientProvider>
      )
      await expect
        .element(identityScreen.getByText('Antes de votar'))
        .toBeInTheDocument()
      await captureMain('02a-antes-de-votar.png')

      await userEvent.click(
        identityScreen.getByRole('button', { name: /Comenzar a votar/i })
      )
      await expect
        .element(identityScreen.getByText('Listas completas'))
        .toBeInTheDocument()
      await captureMain('02b-seleccion.png')

      await userEvent.click(
        identityScreen.getByRole('button', { name: /Votar en blanco/i })
      )
      await userEvent.click(
        identityScreen.getByRole('button', { name: /^Continuar/i })
      )
      await expect
        .element(identityScreen.getByText('Confirmar Voto'))
        .toBeInTheDocument()
      await captureMain('03-confirmar-firma.png')

      await userEvent.click(
        identityScreen.getByRole('button', { name: /Firmar y confirmar/i })
      )
      await expect
        .element(identityScreen.getByText('Voto Exitoso'))
        .toBeInTheDocument()
      await expect
        .element(identityScreen.getByText('Comprobante criptográfico'))
        .toBeInTheDocument()
      await captureMain('04-comprobante.png')
      identityScreen.unmount()

  }, 120_000)

  it('captura verificador con inclusión confirmada', async () => {
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

    const verifierClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const verifierScreen = await render(
      <QueryClientProvider client={verifierClient}>
        <VerificadorRecibo initialTxHash={txHash} />
      </QueryClientProvider>
    )
    await expect
      .element(verifierScreen.getByText(/inclusión confirmada/i))
      .toBeInTheDocument()
    await captureMain('05-verificacion.png')
  }, 60_000)
})
