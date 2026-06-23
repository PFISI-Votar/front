import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { BoletaUnicaDigitalPage } from '@/features/voto/components/boleta-unica-digital-page'
import type { BoletaDigital } from '@/features/voto/data/schema'

const mocks = vi.hoisted(() => ({
  obtenerBoletaDigital: vi.fn(),
  confirmarVoto: vi.fn(),
}))

vi.mock('@/features/voto/api/voto-api', () => ({
  createDemoVotanteToken: () => 'c'.repeat(64),
  getVotanteToken: () => null,
  obtenerBoletaDigital: mocks.obtenerBoletaDigital,
  confirmarVoto: mocks.confirmarVoto,
  setVotanteToken: vi.fn(),
}))

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
          fotoUrl: null,
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
      <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
    </QueryClientProvider>
  )
}

describe('BoletaUnicaDigitalPage', () => {
  beforeEach(() => {
    mocks.obtenerBoletaDigital.mockReset()
    mocks.confirmarVoto.mockReset()
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
})
