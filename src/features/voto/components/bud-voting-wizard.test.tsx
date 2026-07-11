import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import {
  TIPOS_VOTACION,
  type TipoVotacion,
} from '@/features/eleccion/lista/data/schema'
import { BudVotingWizard } from '@/features/voto/components/bud-voting-wizard'
import { EphemeralWalletProvider } from '@/features/voto/crypto/ephemeral-wallet-context'
import { calcularNullifier } from '@/features/voto/crypto/nullifier'
import type { BoletaDigital } from '@/features/voto/data/schema'

vi.mock('@/features/voto/api/voto-api', () => ({
  solicitarMerkleProof: vi.fn().mockResolvedValue({
    hashHoja: 'a'.repeat(64),
    merkleProof: ['0x' + '1'.repeat(64)],
    root: '0x' + 'a'.repeat(64),
  }),
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
  timestamp: 1_700_000_000,
  expectedSigner: '0x' + 'd'.repeat(40),
  signature: '0x' + 'e'.repeat(130),
})

const walletState = {
  publicKeyHex: WALLET_PUBLIC_KEY as string | null,
}

const initializeMock = vi.fn().mockResolvedValue({
  idEleccion: 7,
  publicKeyHex: WALLET_PUBLIC_KEY,
  createdAt: Date.now(),
})

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
    initialize: initializeMock,
    signVotePayload: signVotePayloadMock,
    destroy: vi.fn(),
  }),
}))

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
  tipoVotacion: TipoVotacion = TIPOS_VOTACION.POR_CANDIDATO
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
          onLogout={vi.fn()}
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
    initializeMock.mockClear()
    signVotePayloadMock.mockResolvedValue({
      electionId: 7,
      nullifier: '0x' + 'b'.repeat(64),
      selectionHash: '0x' + 'c'.repeat(64),
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
      expectedNullifier
    )
    expect(transmitSignedVoteMock).toHaveBeenCalledOnce()
    expect(document.body.innerHTML).not.toContain(expectedNullifier)
  })

  it('UAT-02: ante fallo de red conserva la selección y permite reintentar envío', async () => {
    transmitSignedVoteMock.mockRejectedValueOnce({
      code: 'network',
      message:
        'No pudimos conectar con la red blockchain. Reintentá el envío cuando recuperes la conexión. Tu selección se conserva.',
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
      .element(screen.getByText('Error de transmisión'))
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

  it('UAT-04: interpreta NullifierAlreadyUsed como voto ya registrado', async () => {
    transmitSignedVoteMock.mockRejectedValueOnce({
      code: 'already_registered',
      message:
        'Este voto ya está registrado en la blockchain. No es necesario volver a enviarlo.',
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

  it('muestra error cuando falta la clave pública de la billetera efímera', async () => {
    initializeMock.mockRejectedValueOnce(new Error('wallet init failed'))
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
})
