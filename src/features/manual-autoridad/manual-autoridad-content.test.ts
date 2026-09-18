import { describe, expect, it } from 'vitest'
import { isPublicRoute } from '@/lib/is-public-route'
import { sidebarData } from '@/components/layout/data/sidebar-data'
import {
  MANUAL_AUTORIDAD_HREF,
  MANUAL_AUTORIDAD_NAV_TITLE,
  MANUAL_AUTORIDAD_SECTIONS,
} from '@/features/manual-autoridad/manual-autoridad-content'

const section = (id: string) => {
  const found = MANUAL_AUTORIDAD_SECTIONS.find((item) => item.id === id)
  if (!found) {
    throw new Error(`Falta la sección ${id}`)
  }
  return found
}

const textOf = (id: string): string => {
  const item = section(id)
  return [item.title, ...item.body, ...(item.steps ?? []), item.note]
    .filter(Boolean)
    .join('\n')
}

const sidebarUrls = (): string[] =>
  sidebarData.navGroups.flatMap((group) =>
    group.items.flatMap((item) => {
      const urls = item.items
        ? item.items.map((child) => child.url)
        : [item.url]
      return urls.filter((url): url is string => typeof url === 'string')
    })
  )

describe('Manual de la Autoridad Electoral — VOTAR-395', () => {
  it('vive en el panel autenticado, no en una ruta pública', () => {
    expect(MANUAL_AUTORIDAD_HREF).toBe('/manual')
    expect(isPublicRoute(MANUAL_AUTORIDAD_HREF)).toBe(false)
    expect(isPublicRoute(`${MANUAL_AUTORIDAD_HREF}/`)).toBe(false)
  })

  it('expone el enlace solo en el sidebar del panel', () => {
    const item = sidebarData.navGroups
      .flatMap((group) => group.items)
      .find((entry) => entry.title === MANUAL_AUTORIDAD_NAV_TITLE)

    expect(item).toEqual(
      expect.objectContaining({
        title: MANUAL_AUTORIDAD_NAV_TITLE,
        url: MANUAL_AUTORIDAD_HREF,
      })
    )
    expect(sidebarUrls()).toContain(MANUAL_AUTORIDAD_HREF)
  })

  it('restringe la lectura al rol de autoridad electoral con sesión', () => {
    const text = textOf('acceso')
    expect(text).toContain('/sign-in')
    expect(text).toContain('election_admin')
    expect(text).toContain('403')
    expect(text).toContain(MANUAL_AUTORIDAD_NAV_TITLE)
    expect(text).toContain('votante')
  })

  it('UAT-01: detalla alta, fechas, categorías, oficialización y anclaje Merkle', () => {
    const ciclo = textOf('ciclo-de-vida')
    const padron = textOf('padron-merkle')
    expect(ciclo).toContain('/comicios/nuevo')
    expect(ciclo).toContain('Apertura')
    expect(ciclo).toContain('Cierre')
    expect(ciclo).toContain('Nueva categoría')
    expect(ciclo).toContain('Oficializar comicio')
    expect(ciclo).toContain('CONFIGURADA')
    expect(padron).toContain('Cargar padrón electoral')
    expect(padron).toContain('DNI')
    expect(padron).toContain('Publicar Raíz on-chain')
    expect(padron).toContain('MerkleRootStore')
    expect(padron).toContain('Sepolia')
    expect(padron).toContain('getMerkleRoot')
  })

  it('explica abrir, pausar, reanudar, cerrar y archivar desde el panel', () => {
    const text = textOf('contratos')
    expect(text).toContain('Abrir comicio')
    expect(text).toContain('Pausar comicio')
    expect(text).toContain('Reanudar comicio')
    expect(text).toContain('Cerrar comicio')
    expect(text).toContain('Archivar Comicio')
    expect(text).toContain('PAUSER')
    expect(text).toContain('Sepolia')
  })

  it('UAT-02: indica cómo pausar ante una caída de SSO y avisar a los votantes', () => {
    const text = textOf('contingencia-sso')
    expect(text).toContain('SSO')
    expect(text).toContain('Pausar comicio')
    expect(text).toContain('Sistema en pausa')
    expect(text).toContain('Pausa de emergencia')
    expect(text).toContain('Reanudar comicio')
  })

  it('UAT-03: indica cómo exportar el escrutinio y cotejarlo con la cadena', () => {
    const text = textOf('reporteria')
    expect(text).toContain('Actas oficiales')
    expect(text).toContain('Acta de Cierre')
    expect(text).toContain('Exportar resultados')
    expect(text).toContain('getVotesByCandidate')
    expect(text).toContain('CERRADA')
    expect(text).toContain('/configuracion')
  })

  it('UAT-04: indica cómo identificar y subsanar una lista incompleta', () => {
    const text = textOf('listas-incompletas')
    expect(text).toContain('No se puede oficializar el comicio')
    expect(text).toContain('Mín. postulantes por lista')
    expect(text).toContain('requiere 3 candidato(s) más')
    expect(text).toContain('Padrón electoral requerido')
  })

  it('UAT-05: indica cómo seguir por el nodo de respaldo y registrar el incidente', () => {
    const text = textOf('contingencia-rpc')
    expect(text).toContain('[VOTAR rpc-failover]')
    expect(text).toContain('SEPOLIA_RPC_FALLBACK_URLS')
    expect(text).toContain('Caída de nodo RPC')
    expect(text).toContain('Pausa de emergencia')
    expect(text).toContain('Escalamiento')
  })

  it('no expone etiquetas UAT en el contenido del manual', () => {
    expect(MANUAL_AUTORIDAD_SECTIONS.every((item) => !('uat' in item))).toBe(
      true
    )
  })
})
