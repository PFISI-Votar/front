import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import type { Escrutinio } from '@/features/dashboard-publico/data/escrutinio.schema'
import { buildEscrutinioExportDocument } from '@/features/dashboard-publico/lib/escrutinio-export/build-escrutinio-export-document'
import { buildEscrutinioXlsxBuffer } from '@/features/dashboard-publico/lib/escrutinio-export/export-escrutinio-xlsx'

const mockEscrutinio: Escrutinio = {
  idEleccion: 5,
  nombre: 'Elección Demo',
  estado: 'ESCRUTADA',
  tipoVotacion: 'POR_LISTA',
  congelado: true,
  fuente: 'ON_CHAIN',
  actualizadoEn: '2026-07-20T19:00:00.000Z',
  participacion: {
    totalVotos: 25,
    votosBlanco: 2,
    votosNulo: 1,
    totalVotantesHabilitados: 200,
    porcentajeParticipacion: 12.5,
  },
  candidatos: [
    {
      idCandidato: 1,
      nombre: 'María',
      apellido: 'García',
      idLista: 1,
      nombreLista: 'Lista Unidad',
      siglaLista: 'LU',
      colorLista: '#2f6f9f',
      idCategoria: 1,
      nombreCategoria: 'Presidente',
      votos: 22,
      porcentaje: 88,
    },
  ],
}

describe('export-escrutinio-xlsx — VOTAR-369 UAT-01', () => {
  it('builds workbook with Participación and Resultados sheets', () => {
    const document = buildEscrutinioExportDocument(mockEscrutinio, 'xlsx')
    const buffer = buildEscrutinioXlsxBuffer(document)
    const workbook = XLSX.read(buffer, { type: 'array' })
    expect(workbook.SheetNames).toEqual(['Participación', 'Resultados'])
    const participacion = XLSX.utils.sheet_to_json<string[]>(
      workbook.Sheets['Participación']!,
      { header: 1 }
    )
    expect(participacion[0]).toEqual(['Indicador', 'Valor'])
    expect(participacion.some((row) => row[0] === 'Total votos')).toBe(true)
    const resultados = XLSX.utils.sheet_to_json<string[]>(
      workbook.Sheets['Resultados']!,
      { header: 1 }
    )
    expect(resultados[0]?.[0]).toBe('Totales por lista')
    expect(resultados[1]).toEqual(['Lista', 'Sigla', 'Votos', 'Porcentaje (%)'])
    expect(resultados[2]?.[0]).toBe('Lista Unidad')
    expect(resultados.some((row) => row[0] === 'Integrantes por lista')).toBe(
      true
    )
  })
})
