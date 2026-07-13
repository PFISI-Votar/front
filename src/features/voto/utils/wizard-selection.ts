import type { SelectionPayload } from '@/features/voto/crypto/selection-hash'
import type { SeleccionVoto } from '@/features/voto/data/schema'

/** Sentinel stored in candidateSelections when the voter blanks a role/category. */
export const BLANK_SELECTION_ID = '__blank__'

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

export const isBlankSelection = (candidateId: string | undefined): boolean =>
  candidateId === BLANK_SELECTION_ID

export const roleHasBlankSelection = (
  candidateSelections: Record<string, string[]>,
  roleId: string
): boolean => isBlankSelection(candidateSelections[roleId]?.[0])

const buildSeleccionesFromCandidates = (
  candidateSelections: Record<string, string[]>,
  roles: WizardSelectionInput['roles']
): SeleccionVoto[] =>
  roles.flatMap((role) =>
    (candidateSelections[role.id] ?? [])
      .filter((candidateId) => !isBlankSelection(candidateId))
      .map((candidateId) => ({
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

const rolesWithCandidates = (
  roles: WizardSelectionInput['roles'],
  candidates: WizardSelectionInput['candidates']
) =>
  roles.filter((role) =>
    candidates.some((candidate) => candidate.roleId === role.id)
  )

/** True when every role with candidates is explicitly marked blank. */
export const areAllRolesBlank = (
  candidateSelections: Record<string, string[]>,
  roles: WizardSelectionInput['roles'],
  candidates: WizardSelectionInput['candidates']
): boolean => {
  const applicableRoles = rolesWithCandidates(roles, candidates)
  return (
    applicableRoles.length > 0 &&
    applicableRoles.every((role) =>
      roleHasBlankSelection(candidateSelections, role.id)
    )
  )
}

export const buildWizardSelectionPayload = (
  input: WizardSelectionInput
): SelectionPayload => {
  if (input.specialVote === 'blank') {
    return { votoEnBlanco: true, selecciones: [] }
  }

  if (input.specialVote === 'null') {
    return { votoNulo: true, selecciones: [] }
  }

  if (
    areAllRolesBlank(input.candidateSelections, input.roles, input.candidates)
  ) {
    return { votoEnBlanco: true, selecciones: [] }
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
