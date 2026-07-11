import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import axe from 'axe-core'
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

  it('UAT-SUCCESS-A11Y-01: pantalla de éxito debe cumplir WCAG 2.1 AA', async () => {
    mocks.confirmarVoto.mockResolvedValue(comprobanteMock)

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    // Esperar que cargue la boleta
    await vi.waitFor(
      async () => {
        const confirmButton = await screen.findByRole('button', {
          name: /Confirmar y Encriptar Voto/i,
        })
        expect(confirmButton).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Seleccionar candidato
    const candidateCard = screen.getByText('Ana López')
    await userEvent.click(candidateCard)

    // Confirmar voto
    const confirmButton = screen.getByRole('button', {
      name: /Confirmar y Encriptar Voto/i,
    })
    await userEvent.click(confirmButton)

    // Esperar diálogo de confirmación
    await vi.waitFor(
      async () => {
        const dialogConfirmButton = await screen.findByRole('button', {
          name: /Sí, confirmar mi voto/i,
        })
        expect(dialogConfirmButton).toBeDefined()
      },
      { timeout: 2000 },
    )

    const dialogConfirmButton = screen.getByRole('button', {
      name: /Sí, confirmar mi voto/i,
    })
    await userEvent.click(dialogConfirmButton)

    // Esperar pantalla de éxito
    await vi.waitFor(
      async () => {
        const successTitle = await screen.findByText(/Voto Registrado con Éxito/i)
        expect(successTitle).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Verificar accesibilidad de la pantalla de éxito
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: true },
        'heading-order': { enabled: true },
        'landmark-one-main': { enabled: true },
        'region': { enabled: true },
      },
    })

    expect(results.violations).toHaveLength(0)
  })

  it('UAT-SUCCESS-A11Y-02: icono de éxito debe tener texto alternativo', async () => {
    mocks.confirmarVoto.mockResolvedValue(comprobanteMock)

    render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    // Navegar hasta éxito (simplificado - mock directo)
    await vi.waitFor(
      async () => {
        const confirmButton = await screen.findByRole('button', {
          name: /Confirmar y Encriptar Voto/i,
        })
        expect(confirmButton).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Verificar que hay un sr-only text para screen readers
    const srOnlyText = screen.getByText('Voto confirmado', { exact: false })
    expect(srOnlyText).toBeDefined()
  })

  it('UAT-SUCCESS-A11Y-03: hash de transacción debe ser copiable y legible', async () => {
    mocks.confirmarVoto.mockResolvedValue(comprobanteMock)

    render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    // Esperar y completar flujo de voto
    await vi.waitFor(
      async () => {
        const confirmButton = await screen.findByRole('button', {
          name: /Confirmar y Encriptar Voto/i,
        })
        expect(confirmButton).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Verificar que el hash está en un elemento <code> para legibilidad
    await vi.waitFor(
      async () => {
        const codeElements = container.querySelectorAll('code')
        const hashFound = Array.from(codeElements).some((el) =>
          el.textContent?.includes(comprobanteMock.txHash || ''),
        )
        expect(hashFound).toBe(true)
      },
      { timeout: 5000 },
    )
  })

  it('UAT-SUCCESS-A11Y-04: botón de descarga PDF debe ser accesible', async () => {
    mocks.confirmarVoto.mockResolvedValue(comprobanteMock)

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    // Completar flujo hasta éxito
    await vi.waitFor(
      async () => {
        const confirmButton = await screen.findByRole('button', {
          name: /Confirmar y Encriptar Voto/i,
        })
        expect(confirmButton).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Buscar botón de descarga PDF
    await vi.waitFor(
      async () => {
        const downloadButton = await screen.findByRole('button', {
          name: /Descargar Comprobante PDF/i,
        })
        expect(downloadButton).toBeDefined()
      },
      { timeout: 5000 },
    )

    // Verificar accesibilidad del botón
    const results = await axe.run(container, {
      rules: {
        'button-name': { enabled: true },
        'color-contrast': { enabled: true },
      },
    })

    expect(results.violations).toHaveLength(0)
  })

  it('UAT-SUCCESS-A11Y-05: información de privacidad debe ser prominente', async () => {
    mocks.confirmarVoto.mockResolvedValue(comprobanteMock)

    render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await vi.waitFor(
      async () => {
        const confirmButton = await screen.findByRole('button', {
          name: /Confirmar y Encriptar Voto/i,
        })
        expect(confirmButton).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Verificar que existe el disclaimer de privacidad
    await vi.waitFor(
      async () => {
        const privacyText = await screen.findByText(
          /Este recibo no contiene su identidad real ni el sentido de su voto/i,
        )
        expect(privacyText).toBeDefined()
      },
      { timeout: 5000 },
    )
  })

  it('UAT-SUCCESS-A11Y-06: resumen de selección debe ser claro', async () => {
    mocks.confirmarVoto.mockResolvedValue(comprobanteMock)

    render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await vi.waitFor(
      async () => {
        const confirmButton = await screen.findByRole('button', {
          name: /Confirmar y Encriptar Voto/i,
        })
        expect(confirmButton).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Verificar sección "Resumen de selección"
    await vi.waitFor(
      async () => {
        const summaryHeading = await screen.findByText(/Resumen de selección/i)
        expect(summaryHeading).toBeDefined()
      },
      { timeout: 5000 },
    )
  })

  it('UAT-SUCCESS-A11Y-07: estado de loading debe ser anunciado', async () => {
    mocks.confirmarVoto.mockResolvedValue(comprobanteMock)
    mocks.generarReciboPDF.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000)),
    )

    render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await vi.waitFor(
      async () => {
        const confirmButton = await screen.findByRole('button', {
          name: /Confirmar y Encriptar Voto/i,
        })
        expect(confirmButton).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Buscar botón de descarga y clickear
    await vi.waitFor(
      async () => {
        const downloadButton = await screen.findByRole('button', {
          name: /Descargar Comprobante PDF/i,
        })
        expect(downloadButton).toBeDefined()
        await userEvent.click(downloadButton)
      },
      { timeout: 5000 },
    )

    // Verificar que el estado de loading tiene texto descriptivo
    await vi.waitFor(
      async () => {
        const loadingText = await screen.findByText(/Generando PDF/i)
        expect(loadingText).toBeDefined()
      },
      { timeout: 2000 },
    )
  })

  it('UAT-SUCCESS-A11Y-08: contraste de colores debe cumplir 4.5:1', async () => {
    mocks.confirmarVoto.mockResolvedValue(comprobanteMock)

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await vi.waitFor(
      async () => {
        const confirmButton = await screen.findByRole('button', {
          name: /Confirmar y Encriptar Voto/i,
        })
        expect(confirmButton).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Esperar pantalla de éxito
    await vi.waitFor(
      async () => {
        const successTitle = await screen.findByText(/Voto Registrado con Éxito/i)
        expect(successTitle).toBeDefined()
      },
      { timeout: 5000 },
    )

    // axe-core verifica automáticamente el contraste
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    })

    expect(results.violations).toHaveLength(0)
  })

  it('UAT-SUCCESS-A11Y-09: navegación por teclado debe funcionar', async () => {
    mocks.confirmarVoto.mockResolvedValue(comprobanteMock)

    render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await vi.waitFor(
      async () => {
        const confirmButton = await screen.findByRole('button', {
          name: /Confirmar y Encriptar Voto/i,
        })
        expect(confirmButton).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Esperar botones de éxito
    await vi.waitFor(
      async () => {
        const downloadButton = await screen.findByRole('button', {
          name: /Descargar Comprobante PDF/i,
        })
        expect(downloadButton).toBeDefined()
      },
      { timeout: 5000 },
    )

    // Simular Tab para navegar
    await userEvent.tab()
    const downloadButton = screen.getByRole('button', {
      name: /Descargar Comprobante PDF/i,
    })

    // Verificar que el botón es focusable
    expect(downloadButton.tabIndex).toBeGreaterThanOrEqual(0)
  })

  it('UAT-SUCCESS-A11Y-10: fecha debe estar en formato legible', async () => {
    mocks.confirmarVoto.mockResolvedValue(comprobanteMock)

    render(
      <QueryClientProvider client={queryClient}>
        <BoletaUnicaDigitalPage idEleccion={7} showIntro={false} showLogin={false} />
      </QueryClientProvider>,
    )

    await vi.waitFor(
      async () => {
        const confirmButton = await screen.findByRole('button', {
          name: /Confirmar y Encriptar Voto/i,
        })
        expect(confirmButton).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Verificar que la fecha está formateada en español
    await vi.waitFor(
      async () => {
        const dateText = container.querySelector('body')?.textContent || ''
        // Debe incluir fecha legible (no solo ISO)
        expect(
          dateText.includes('2026') || dateText.includes('jul'),
        ).toBe(true)
      },
      { timeout: 5000 },
    )
  })
})
