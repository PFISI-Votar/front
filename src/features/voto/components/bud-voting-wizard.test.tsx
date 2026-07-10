import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import {
  TIPOS_VOTACION,
  type TipoVotacion,
} from '@/features/eleccion/lista/data/schema'
import { BudVotingWizard } from '@/features/voto/components/bud-voting-wizard'
import { EphemeralWalletProvider } from '@/features/voto/crypto/ephemeral-wallet-context'
import type { BoletaDigital } from '@/features/voto/data/schema'

vi.mock('@/features/voto/api/voto-api', () => ({
  solicitarMerkleProof: vi.fn().mockResolvedValue({
    merkleProof: ['0x' + '1'.repeat(64)],
    root: '0x' + 'a'.repeat(64),
  }),
}))

const signVotePayloadMock = vi.fn().mockResolvedValue({
  electionId: 7,
  nullifier: '0x' + 'b'.repeat(64),
  selectionHash: '0x' + 'c'.repeat(64),
  timestamp: 1_700_000_000,
  expectedSigner: '0x' + 'd'.repeat(40),
  signature: '0x' + 'e'.repeat(130),
})

vi.mock('@/features/voto/crypto/use-ephemeral-wallet', () => ({
  useEphemeralWallet: () => ({
    isSupported: true,
    isReady: true,
    publicKeyHex: '0x02' + 'a'.repeat(64),
    session: {
      idEleccion: 7,
      publicKeyHex: '0x02' + 'a'.repeat(64),
      createdAt: Date.now(),
    },
    initialize: vi.fn(),
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
  tipoVotacion: TipoVotacion = TIPOS_VOTACION.POR_CANDIDATO,
  nullifier: `0x${string}` | null = ('0x' + 'b'.repeat(64)) as `0x${string}`
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
          nullifier={nullifier}
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

  it('UAT-01: firma localmente y muestra mensaje de éxito sin hash de tx fake', async () => {
    signVotePayloadMock.mockClear()
    const screen = await renderWizard()

    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /Firmar y confirmar/i })
    )

    await expect
      .element(screen.getByText('Su voto ha sido firmado con éxito.'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/Hash de transacción ficticio/i))
      .not.toBeInTheDocument()
    expect(signVotePayloadMock).toHaveBeenCalledOnce()
  })

  it('muestra error cuando falta el nulificador de VOTAR-353', async () => {
    signVotePayloadMock.mockClear()
    const screen = await renderWizard(TIPOS_VOTACION.POR_CANDIDATO, null)

    await userEvent.click(
      screen.getByRole('button', { name: /Votar en blanco/i })
    )
    await userEvent.click(screen.getByRole('button', { name: /^Continuar/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /Firmar y confirmar/i })
    )

    await expect
      .element(screen.getByText(/No hay un nulificador de sesión disponible/i))
      .toBeInTheDocument()
    expect(signVotePayloadMock).not.toHaveBeenCalled()
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
  })
})
