import { describe, expect, it } from 'vitest'
import { buildComiciosBreadcrumbEntries } from '@/components/layout/comicios-breadcrumbs'

const idEleccion = 42
const idLista = 7

describe('buildComiciosBreadcrumbEntries', () => {
  it('returns only Comicios on the list page', () => {
    expect(
      buildComiciosBreadcrumbEntries({ pathname: '/comicios' })
    ).toEqual([{ label: 'Comicios', to: '/comicios' }])
  })

  it('returns Comicios and Nuevo comicio on the create page', () => {
    expect(
      buildComiciosBreadcrumbEntries({ pathname: '/comicios/nuevo' })
    ).toEqual([
      { label: 'Comicios', to: '/comicios' },
      { label: 'Nuevo comicio' },
    ])
  })

  it('links the election name to oferta on the oferta page', () => {
    expect(
      buildComiciosBreadcrumbEntries({
        pathname: '/comicios/42/oferta',
        idEleccion,
        eleccionNombre: 'Elecciones 2026',
      })
    ).toEqual([
      { label: 'Comicios', to: '/comicios' },
      {
        label: 'Elecciones 2026',
        to: '/comicios/$idEleccion/oferta',
        params: { idEleccion: '42' },
      },
      { label: 'Oferta electoral' },
    ])
  })

  it('includes the padron section and keeps the election link clickable', () => {
    expect(
      buildComiciosBreadcrumbEntries({
        pathname: '/comicios/42/padron',
        idEleccion,
        eleccionNombre: 'Elecciones 2026',
      })
    ).toEqual([
      { label: 'Comicios', to: '/comicios' },
      {
        label: 'Elecciones 2026',
        to: '/comicios/$idEleccion/oferta',
        params: { idEleccion: '42' },
      },
      { label: 'Padrón electoral' },
    ])
  })

  it('includes padron preview with a link back to padron', () => {
    expect(
      buildComiciosBreadcrumbEntries({
        pathname: '/comicios/42/padron/preview',
        idEleccion,
        eleccionNombre: 'Elecciones 2026',
      })
    ).toEqual([
      { label: 'Comicios', to: '/comicios' },
      {
        label: 'Elecciones 2026',
        to: '/comicios/$idEleccion/oferta',
        params: { idEleccion: '42' },
      },
      {
        label: 'Padrón electoral',
        to: '/comicios/$idEleccion/padron',
        params: { idEleccion: '42' },
      },
      { label: 'Previsualizar padrón' },
    ])
  })

  it('includes oferta electoral before the lista detail page', () => {
    expect(
      buildComiciosBreadcrumbEntries({
        pathname: '/comicios/42/listas/7',
        idEleccion,
        idLista,
        eleccionNombre: 'Elecciones 2026',
        listaNombre: 'Lista A',
        listaSigla: 'LA',
      })
    ).toEqual([
      { label: 'Comicios', to: '/comicios' },
      {
        label: 'Elecciones 2026',
        to: '/comicios/$idEleccion/oferta',
        params: { idEleccion: '42' },
      },
      {
        label: 'Oferta electoral',
        to: '/comicios/$idEleccion/oferta',
        params: { idEleccion: '42' },
      },
      { label: 'Lista A (LA)' },
    ])
  })
})
