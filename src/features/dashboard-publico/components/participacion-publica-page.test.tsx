import { forwardRef } from 'react'
import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ParticipacionPublicaPage } from './participacion-publica-page'

const mocks = vi.hoisted(() => ({
  obtenerConfiguracionBud: vi.fn(),
  obtenerParticipacionPublica: vi.fn(),
  exportParticipacionPng: vi.fn(),
  toastError: vi.fn(),
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
  obtenerConfiguracionBud: mocks.obtenerConfiguracionBud,
}))

vi.mock('@/features/dashboard-publico/api/participacion-publica-api', () => ({
  obtenerParticipacionPublica: mocks.obtenerParticipacionPublica,
}))

vi.mock('@/features/dashboard-publico/components/curva-temporal-chart', () => ({
  CurvaTemporalChart: forwardRef<
    HTMLDivElement,
    {
      serieTemporal: Array<{ etiqueta: string; acumulado: number }>
      nombreComicio?: string
      fecha?: string
    }
  >(({ serieTemporal, nombreComicio, fecha }, ref) => (
    <div ref={ref}>
      <h3>Distribución temporal</h3>
      <p>{serieTemporal.length} puntos</p>
      {nombreComicio && <p>{nombreComicio}</p>}
      {fecha && <p>{fecha}</p>}
    </div>
  )),
}))

vi.mock(
  '@/features/dashboard-publico/lib/participacion-export/export-participacion-png',
  () => ({
    exportParticipacionPng: mocks.exportParticipacionPng,
  })
)

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError },
}))

const participacionMock = {
  idEleccion: 6,
  snapshotCongelado: false,
  formula: {
    totalPadron: 100,
    votosAfirmativos: 25,
    votosEnBlanco: 0,
    votosNulos: 0,
    totalSufragios: 25,
    porcentajeParticipacion: 25,
    expresion: '(25 + 0 + 0) / 100 × 100 = 25%',
  },
  serieTemporal: [
    { etiqueta: '10:00', acumulado: 10, nuevos: 10 },
    { etiqueta: '11:00', acumulado: 25, nuevos: 15 },
  ],
  desglosePorCategoria: [
    {
      idCategoria: 1,
      nombreCategoria: 'Presidente',
      listas: [
        { idLista: 10, nombreLista: 'Lista A', votos: 15 },
        { idLista: 20, nombreLista: 'Lista B', votos: 10 },
      ],
      votosEnBlancoGlobales: 0,
      votosNulosGlobales: 0,
    },
  ],
  verificacionTotales: {
    coherente: true,
    totalOnChain: 25,
    totalCalculado: 25,
  },
  fuenteDatos:
    'AuditViewContract.getParticipationStats + VoteRegistry.VoteCast',
}

const renderPage = async (idEleccion: number) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <ParticipacionPublicaPage idEleccion={idEleccion} />
    </QueryClientProvider>
  )
}

describe('ParticipacionPublicaPage — VOTAR-365', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
      snapshotCongelado: false,
      resultadosDefinitivos: false,
    })
    mocks.obtenerParticipacionPublica.mockResolvedValue(participacionMock)
  })

  it('UAT-01: muestra Participación Electoral: 25%', async () => {
    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Participación Electoral: 25%/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/\(25 \+ 0 \+ 0\) \/ 100/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/Distribución temporal/i))
      .toBeInTheDocument()
  })

  it('UAT-02: muestra desglose por categoría y badge de coherencia', async () => {
    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Participación detallada por categoría/i))
      .toBeInTheDocument()
    await expect.element(screen.getByText('Lista A')).toBeInTheDocument()
    await expect.element(screen.getByText('Lista B')).toBeInTheDocument()
    await expect
      .element(screen.getByText(/Totales coherentes/i))
      .toBeInTheDocument()
  })

  it('muestra el panel de fórmula con operandos visibles', async () => {
    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Cálculo transparente/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Votos afirmativos', { exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Padrón habilitado', { exact: true }))
      .toBeInTheDocument()
  })

  it('muestra mensaje de snapshot cuando el dashboard está congelado', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'CERRADA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
      snapshotCongelado: true,
      resultadosDefinitivos: true,
    })
    mocks.obtenerParticipacionPublica.mockResolvedValue({
      ...participacionMock,
      snapshotCongelado: true,
    })

    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Snapshot congelado/i))
      .toBeInTheDocument()
  })

  it('VOTAR-459: muestra "Sección no disponible" sin llamar a la API cuando está oculta', async () => {
    mocks.obtenerConfiguracionBud.mockResolvedValue({
      idEleccion: 6,
      nombre: 'Elección Centro de Estudiantes',
      estado: 'ABIERTA',
      tipoVotacion: 'POR_LISTA',
      metodosAutenticacion: ['SSO_INSTITUCIONAL'],
      snapshotCongelado: false,
      resultadosDefinitivos: false,
      visibilidadDashboard: {
        resultados: true,
        participacion: false,
        revoto: true,
        transacciones: true,
      },
    })

    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Sección no disponible/i))
      .toBeInTheDocument()
    expect(mocks.obtenerParticipacionPublica).not.toHaveBeenCalled()
  })

  it('VOTAR-459: si configuracion-bud no informa visibilidadDashboard, sigue mostrando los datos (compatibilidad)', async () => {
    // El mock global de beforeEach ya omite visibilidadDashboard — este test
    // documenta que ausencia del campo no debe deshabilitar la query para
    // siempre (regresión: enabled: visible === true dejaba esto colgado).
    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Participación Electoral: 25%/i))
      .toBeInTheDocument()
  })

  it('muestra error amigable cuando las métricas no están disponibles', async () => {
    mocks.obtenerParticipacionPublica.mockRejectedValue(
      new AxiosError('Unprocessable', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as never,
        data: { message: 'Sin contratos' },
      })
    )

    const screen = await renderPage(6)

    await expect
      .element(screen.getByText(/Métricas no disponibles/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(/contratos electorales desplegados/i))
      .toBeInTheDocument()
  })

  describe('VOTAR-376: exportación PNG de la curva de participación', () => {
    it('el botón de descarga PNG dispara la exportación con los datos correctos', async () => {
      mocks.exportParticipacionPng.mockResolvedValue(undefined)
      const screen = await renderPage(6)

      await screen
        .getByRole('button', {
          name: /Descargar curva de participación en PNG/i,
        })
        .click()

      expect(mocks.exportParticipacionPng).toHaveBeenCalledTimes(1)
      const callArgs = mocks.exportParticipacionPng.mock.calls[0][0]
      expect(callArgs.idEleccion).toBe(6)
      expect(callArgs.nombreComicio).toBe('Elección Centro de Estudiantes')
      expect(callArgs.node).toBeInstanceOf(HTMLElement)
    })

    it('muestra un toast de error si la exportación falla', async () => {
      mocks.exportParticipacionPng.mockRejectedValue(new Error('boom'))
      const screen = await renderPage(6)

      await screen
        .getByRole('button', {
          name: /Descargar curva de participación en PNG/i,
        })
        .click()

      await vi.waitFor(() => {
        expect(mocks.toastError).toHaveBeenCalledWith(
          'No se pudo generar la imagen PNG de la curva de participación.'
        )
      })
    })

    it('deshabilita el botón mientras la exportación está en curso', async () => {
      let resolveExport: () => void = () => {}
      mocks.exportParticipacionPng.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveExport = resolve
          })
      )
      const screen = await renderPage(6)
      const boton = screen.getByRole('button', {
        name: /Descargar curva de participación en PNG/i,
      })

      const clickPromise = boton.click()
      await clickPromise
      await expect.element(boton).toHaveAttribute('aria-busy', 'true')

      resolveExport()
      await expect.element(boton).toHaveAttribute('aria-busy', 'false')
    })
  })
})
