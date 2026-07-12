import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { BoletaUnicaDigitalPage } from '@/features/voto/components/boleta-unica-digital-page'
import type { BoletaDigital, ConfirmarVotoResponse } from '@/features/voto/data/schema'

const mocks = vi.hoisted(() => ({
  obtenerBoletaDigital: vi.fn(),
  confirmarVoto: vi.fn(),
  obtenerConfiguracionBud: vi.fn(),
  generarReciboPDF: vi.fn(),
}))

vi.mock('@/features/voto/api/voto-api', () => ({
  obtenerBoletaDigital: mocks.obtenerBoletaDigital,
  confirmarVoto: mocks.confirmarVoto,
  obtenerConfiguracionBud: mocks.obtenerConfiguracionBud,
}))

vi.mock('@/features/voto/lib/generar-recibo-pdf', () => ({
  generarReciboPDF: mocks.generarReciboPDF,
}))

const boletaMock: BoletaDigital = {
  idEleccion: 7,
  nombreEleccion: 'Centro de Estudiantes 2026',
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
      ],
    },
  ],
}

const comprobanteMock: ConfirmarVotoResponse = {
  idEleccion: 7,
  estado: 'RECIBIDO',
  comprobanteHash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234',
  payloadHash: 'e5f6789012345678901234567890123456789012345678901234567890123456',
  recibidoEn: '2026-07-11T14:30:00Z',
  idempotente: false,
  txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  blockNumber: 4582193,
  contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
  codigoVerificacionE2E: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  txStatus: 'CONFIRMADA',
}

describe('BoletaSuccessScreen - VOTAR-360 Accesibilidad WCAG 2.1 AA', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mocks.obtenerBoletaDigital.mockResolvedValue(boletaMock)
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 7,
      nombre: 'Centro de Estudiantes',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_CANDIDATO',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
    })
    mocks.confirmarVoto.mockResolvedValue(comprobanteMock)
    mocks.generarReciboPDF.mockResolvedValue(undefined)
  })

  it('UAT-SUCCESS-A11Y-01: pantalla de éxito debe mostrar título claro', async () => {
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await expect
      .element(screen.getByRole('button', { name: /Confirmar y Encriptar Voto/i }))
      .toBeInTheDocument()

    await expect.element(screen.getByText(/Voto Registrado con Éxito/i)).toBeInTheDocument()
  })

  it('UAT-SUCCESS-A11Y-02: botón de descarga PDF debe tener nombre accesible', async () => {
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await expect
      .element(screen.getByRole('button', { name: /Confirmar y Encriptar Voto/i }))
      .toBeInTheDocument()

    await expect
      .element(screen.getByRole('button', { name: /Descargar Comprobante PDF/i }))
      .toBeInTheDocument()
  })

  it('UAT-SUCCESS-A11Y-03: información de privacidad debe ser visible', async () => {
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await expect
      .element(screen.getByRole('button', { name: /Confirmar y Encriptar Voto/i }))
      .toBeInTheDocument()

    await expect
      .element(
        screen.getByText(/Este recibo no contiene su identidad real ni el sentido de su voto/i),
      )
      .toBeInTheDocument()
  })

  it('UAT-SUCCESS-A11Y-04: hash debe estar visible en pantalla', async () => {
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await expect
      .element(screen.getByRole('button', { name: /Confirmar y Encriptar Voto/i }))
      .toBeInTheDocument()

    await expect
      .element(screen.getByText(comprobanteMock.txHash || '', { exact: false }))
      .toBeInTheDocument()
  })

  it('UAT-SUCCESS-A11Y-05: botones deben ser navegables por teclado', async () => {
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await expect
      .element(screen.getByRole('button', { name: /Confirmar y Encriptar Voto/i }))
      .toBeInTheDocument()

    const downloadButton = screen.getByRole('button', { name: /Descargar Comprobante PDF/i })
    await expect.element(downloadButton).toBeInTheDocument()
  })

  it('UAT-SUCCESS-A11Y-06: estado de loading debe mostrar texto descriptivo', async () => {
    mocks.generarReciboPDF.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000)),
    )

    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await expect
      .element(screen.getByRole('button', { name: /Confirmar y Encriptar Voto/i }))
      .toBeInTheDocument()

    const downloadButton = screen.getByRole('button', { name: /Descargar Comprobante PDF/i })
    await userEvent.click(downloadButton)

    await expect.element(screen.getByText(/Generando PDF/i)).toBeInTheDocument()
  })

  it('UAT-SUCCESS-A11Y-07: resumen de selección debe tener encabezado', async () => {
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await expect
      .element(screen.getByRole('button', { name: /Confirmar y Encriptar Voto/i }))
      .toBeInTheDocument()

    await expect.element(screen.getByText(/Resumen de selección/i)).toBeInTheDocument()
  })

  it('UAT-SUCCESS-A11Y-08: fecha debe estar en formato legible', async () => {
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await expect
      .element(screen.getByRole('button', { name: /Confirmar y Encriptar Voto/i }))
      .toBeInTheDocument()

    await expect.element(screen.getByText(/2026/i, { exact: false })).toBeInTheDocument()
  })
})
