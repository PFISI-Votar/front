import { describe, expect, it } from 'vitest'
import {
  areAllRolesBlank,
  BLANK_SELECTION_ID,
  buildWizardSelectionPayload,
} from '@/features/voto/utils/wizard-selection'

const roles = [{ id: '1' }, { id: '2' }]
const candidates = [
  { id: '101', roleId: '1', listId: '11' },
  { id: '102', roleId: '1', listId: '12' },
  { id: '201', roleId: '2', listId: '11' },
]

describe('buildWizardSelectionPayload', () => {
  it('maps blank and null special votes', () => {
    expect(
      buildWizardSelectionPayload({
        specialVote: 'blank',
        candidateSelections: {},
        selectedListId: null,
        roles,
        candidates,
      })
    ).toEqual({ votoEnBlanco: true, selecciones: [] })

    expect(
      buildWizardSelectionPayload({
        specialVote: 'null',
        candidateSelections: {},
        selectedListId: null,
        roles,
        candidates,
      })
    ).toEqual({ votoNulo: true, selecciones: [] })
  })

  it('maps all per-category blank selections to votoEnBlanco', () => {
    expect(
      buildWizardSelectionPayload({
        specialVote: null,
        candidateSelections: {
          '1': [BLANK_SELECTION_ID],
          '2': [BLANK_SELECTION_ID],
        },
        selectedListId: null,
        roles,
        candidates,
      })
    ).toEqual({ votoEnBlanco: true, selecciones: [] })
  })

  it('omits blank categories and keeps partisan selections', () => {
    expect(
      buildWizardSelectionPayload({
        specialVote: null,
        candidateSelections: {
          '1': [BLANK_SELECTION_ID],
          '2': ['201'],
        },
        selectedListId: null,
        roles,
        candidates,
      })
    ).toEqual({
      selecciones: [{ idCategoria: 2, idCandidato: 201 }],
    })
  })

  it('builds selections from explicit candidate choices', () => {
    expect(
      buildWizardSelectionPayload({
        specialVote: null,
        candidateSelections: { '1': ['102'], '2': ['201'] },
        selectedListId: null,
        roles,
        candidates,
      })
    ).toEqual({
      selecciones: [
        { idCategoria: 1, idCandidato: 102 },
        { idCategoria: 2, idCandidato: 201 },
      ],
    })
  })

  it('derives selections from a selected list when no explicit choices exist', () => {
    expect(
      buildWizardSelectionPayload({
        specialVote: null,
        candidateSelections: {},
        selectedListId: '11',
        roles,
        candidates,
      })
    ).toEqual({
      selecciones: [
        { idCategoria: 1, idCandidato: 101 },
        { idCategoria: 2, idCandidato: 201 },
      ],
    })
  })

  it('VOTAR-474: includes every candidate of a list within the same category', () => {
    const multiCandidates = [
      ...candidates,
      { id: '202', roleId: '2', listId: '11' },
    ]
    expect(
      buildWizardSelectionPayload({
        specialVote: null,
        candidateSelections: {},
        selectedListId: '11',
        roles,
        candidates: multiCandidates,
      })
    ).toEqual({
      selecciones: [
        { idCategoria: 1, idCandidato: 101 },
        { idCategoria: 2, idCandidato: 201 },
        { idCategoria: 2, idCandidato: 202 },
      ],
    })
  })

  it('VOTAR-474: keeps multiple explicit selections in the same category', () => {
    expect(
      buildWizardSelectionPayload({
        specialVote: null,
        candidateSelections: { '1': ['101'], '2': ['201', '202'] },
        selectedListId: null,
        roles,
        candidates: [...candidates, { id: '202', roleId: '2', listId: '12' }],
      })
    ).toEqual({
      selecciones: [
        { idCategoria: 1, idCandidato: 101 },
        { idCategoria: 2, idCandidato: 201 },
        { idCategoria: 2, idCandidato: 202 },
      ],
    })
  })
})

describe('areAllRolesBlank', () => {
  it('returns true only when every role with candidates is blank', () => {
    expect(
      areAllRolesBlank(
        { '1': [BLANK_SELECTION_ID], '2': [BLANK_SELECTION_ID] },
        roles,
        candidates
      )
    ).toBe(true)

    expect(
      areAllRolesBlank(
        { '1': [BLANK_SELECTION_ID], '2': ['201'] },
        roles,
        candidates
      )
    ).toBe(false)
  })
})
