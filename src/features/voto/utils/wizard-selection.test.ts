import { describe, expect, it } from 'vitest'
import { buildWizardSelectionPayload } from '@/features/voto/utils/wizard-selection'

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
})
