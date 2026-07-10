import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { BoletaUnicaDigitalPage } from '@/features/voto/components/boleta-unica-digital-page'
import type { BoletaDigital } from '@/features/voto/data/schema'

const mocks = vi.hoisted(() => ({
  obtenerBoletaDigital: vi.fn(),
  confirmarVoto: vi.fn(),
  obtenerConfiguracionBud: vi.fn(),
  solicitarMerkleProof: vi.fn(),
  ensureVotanteSession: vi.fn(),
  clearVotanteSession: vi.fn(),
}))

vi.mock('@/features/voto/api/voto-api', () => ({
  obtenerBoletaDigital: mocks.obtenerBoletaDigital,
  confirmarVoto: mocks.confirmarVoto,
  obtenerConfiguracionBud: mocks.obtenerConfiguracionBud,
  solicitarMerkleProof: mocks.solicitarMerkleProof,
}))

vi.mock('@/features/voto/services/votante-session', () => ({
  ensureVotanteSession: mocks.ensureVotanteSession,
  clearVotanteSession: mocks.clearVotanteSession,
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
  titulo: 'Boleta — Centro de Estudiantes',
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
          fotoUrl:
            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect width="1" height="1" fill="%230ea5e9"/%3E%3C/svg%3E',
        },
        {
          idCandidato: 102,
          idCategoria: 1,
          idLista: 12,
          listId: 2,
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
          listId: 1,
          nombre: 'Carla',
          apellido: 'Río',
          nombreCompleto: 'Carla Río',
          agrupacionPolitica: 'Lista Azul',
          numeroLista: 1,
          colorLista: '#0ea5e9',
          fotoUrl: null,
        },
      ],
    },
  ],
}

async function renderBud() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <BoletaUnicaDigitalPage
        idEleccion={7}
        showIntro={false}
        showLogin={false}
      />
    </QueryClientProvider>
  )
}

describe('BoletaUnicaDigitalPage', () => {
  beforeEach(() => {
    mocks.obtenerBoletaDigital.mockReset()
    mocks.confirmarVoto.mockReset()
    mocks.obtenerConfiguracionBud.mockReset()
    mocks.solicitarMerkleProof.mockReset()
    mocks.ensureVotanteSession.mockReset()
    mocks.clearVotanteSession.mockReset()
    mocks.ensureVotanteSession.mockResolvedValue(null)
    mocks.clearVotanteSession.mockResolvedValue(undefined)
    mocks.obtenerConfiguracionBud.mockResolvedValue(budConfig)
    mocks.solicitarMerkleProof.mockResolvedValue({
      merkleProof: ['0x' + '1'.repeat(64)],
      root: '0x' + 'a'.repeat(64),
    })
  })

  it('aplica superficie clara en la boleta bajo tema oscuro global (VOTAR-412)', async () => {
    document.documentElement.classList.add('dark')
    mocks.obtenerBoletaDigital.mockResolvedValue(boleta)
    await renderBud()

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
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin />
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

  it('mantiene selecciones activas en categorías distintas y excluye dentro de la misma', async () => {
    mocks.obtenerBoletaDigital.mockResolvedValue(boleta)
    const screen = await renderBud()

    await userEvent.click(
      screen.getByRole('radio', {
        name: /Ana López, Lista Azul, lista 1/i,
      })
    )
    await userEvent.click(
      screen.getByRole('radio', {
        name: /Carla Río, Lista Azul, lista 1/i,
      })
    )

    await expect
      .element(screen.getByRole('radio', { name: /Ana López/i }))
      .toBeChecked()
    await expect
      .element(screen.getByRole('radio', { name: /Carla Río/i }))
      .toBeChecked()

    await userEvent.click(
      screen.getByRole('radio', {
        name: /Bruno Paz, Lista Celeste, lista 2/i,
      })
    )

    await expect
      .element(screen.getByRole('radio', { name: /Ana López/i }))
      .not.toBeChecked()
    await expect
      .element(screen.getByRole('radio', { name: /Bruno Paz/i }))
      .toBeChecked()
    await expect
      .element(screen.getByRole('radio', { name: /Carla Río/i }))
      .toBeChecked()
    expect(mocks.confirmarVoto).not.toHaveBeenCalled()
  })

  it('expone información obligatoria y nombres accesibles en cada tarjeta de candidato', async () => {
    mocks.obtenerBoletaDigital.mockResolvedValue(boleta)
    const screen = await renderBud()

    await expect
      .element(screen.getByText('Lista 1').first())
      .toBeInTheDocument()
    await expect.element(screen.getByText('Ana López')).toBeInTheDocument()
    await expect
      .element(screen.getByText('Lista Azul').first())
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('img', { name: /Foto de Ana López/i }))
      .toBeInTheDocument()
    await expect
      .element(
        screen.getByRole('radio', {
          name: /Ana López, Lista Azul, lista 1/i,
        })
      )
      .toBeInTheDocument()
  })

  it('permite seleccionar por teclado y confirma recién en el diálogo final', async () => {
    mocks.obtenerBoletaDigital.mockResolvedValue(boleta)
    mocks.confirmarVoto.mockResolvedValue({
      idEleccion: 7,
      estado: 'RECIBIDO',
      comprobanteHash: 'a'.repeat(64),
      payloadHash: 'b'.repeat(64),
      recibidoEn: '2026-06-22T00:00:00.000Z',
      idempotente: false,
    })
    const screen = await renderBud()
    const presidente = screen.getByRole('radio', { name: /Ana López/i })
    const vocal = screen.getByRole('radio', { name: /Carla Río/i })

    await userEvent.click(presidente)
    await userEvent.keyboard('{Space}')
    await userEvent.click(vocal)
    await userEvent.keyboard('{Enter}')

    expect(mocks.confirmarVoto).not.toHaveBeenCalled()

    await userEvent.click(
      screen.getByRole('button', { name: /Confirmar y Encriptar Voto/i })
    )
    await userEvent.click(
      screen.getByRole('button', { name: /^Confirmar Voto$/i })
    )

    expect(mocks.confirmarVoto).toHaveBeenCalledOnce()
    expect(mocks.confirmarVoto).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        selecciones: [
          { idCategoria: 1, idCandidato: 101 },
          { idCategoria: 2, idCandidato: 201 },
        ],
      })
    )
    await expect
      .element(screen.getByText(/Voto confirmado/i))
      .toBeInTheDocument()
  })

  it('mantiene la boleta legible en layouts responsive y usa scroll eficiente con muchas opciones', async () => {
    const candidatos = Array.from({ length: 21 }, (_, index) => ({
      idCandidato: 300 + index,
      idCategoria: 1,
      idLista: 20 + index,
      listId: 20 + index,
      nombre: `Candidato ${index + 1}`,
      apellido: 'Demo',
      nombreCompleto: `Candidato ${index + 1} Demo`,
      agrupacionPolitica: `Lista ${index + 1}`,
      numeroLista: index + 1,
      colorLista: '#2563eb',
      fotoUrl: null,
    }))
    mocks.obtenerBoletaDigital.mockResolvedValue({
      ...boleta,
      categorias: [
        {
          ...boleta.categorias[0],
          candidatos,
        },
      ],
    })

    const screen = await renderBud()

    await expect
      .element(screen.getByText('Candidato 21 Demo'))
      .toBeInTheDocument()
    expect(document.querySelector('[data-slot="scroll-area"]')).not.toBeNull()
    expect(document.querySelector('.sm\\:max-w-3xl')).not.toBeNull()
    expect(document.querySelector('.lg\\:max-w-5xl')).not.toBeNull()
  })
})
