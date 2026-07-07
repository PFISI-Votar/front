import type { SeleccionVoto } from '@/features/voto/data/schema'
import type { SelectionPayload } from '@/features/voto/crypto/selection-hash'

type WizardSelectionInput = {
  specialVote: 'blank' | 'null' | null
  candidateSelections: Record<string, string[]>
  selectedListId: string | null
  roles: Array<{ id: string }>
  candidates: Array<{
    id: string
    roleId: string
    listId: string
  }>
}

const buildSeleccionesFromCandidates = (
  candidateSelections: Record<string, string[]>,
  roles: WizardSelectionInput['roles']
): SeleccionVoto[] =>
  roles.flatMap((role) =>
    (candidateSelections[role.id] ?? []).map((candidateId) => ({
      idCategoria: Number(role.id),
      idCandidato: Number(candidateId),
    }))
  )

const buildSeleccionesForList = (
  listId: string,
  roles: WizardSelectionInput['roles'],
  candidates: WizardSelectionInput['candidates']
): SeleccionVoto[] =>
  roles.flatMap((role) => {
    const roleCandidate = candidates.find(
      (candidate) => candidate.listId === listId && candidate.roleId === role.id
    )
    if (!roleCandidate) {
      return []
    }
    return [
      {
        idCategoria: Number(role.id),
        idCandidato: Number(roleCandidate.id),
      },
    ]
  })

export const buildWizardSelectionPayload = (
  input: WizardSelectionInput
): SelectionPayload => {
  if (input.specialVote === 'blank') {
    return { votoEnBlanco: true, selecciones: [] }
  }

  if (input.specialVote === 'null') {
    return { votoNulo: true, selecciones: [] }
  }

  const explicitSelecciones = buildSeleccionesFromCandidates(
    input.candidateSelections,
    input.roles
  )

  if (explicitSelecciones.length > 0) {
    return { selecciones: explicitSelecciones }
  }

  if (input.selectedListId) {
    return {
      selecciones: buildSeleccionesForList(
        input.selectedListId,
        input.roles,
        input.candidates
      ),
    }
  }

  return { selecciones: [] }
}
