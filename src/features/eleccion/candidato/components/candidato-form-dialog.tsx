import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  actualizarCandidato,
  crearCandidato,
} from '@/features/eleccion/candidato/api/candidato-api'
import { obtenerConfiguracionDatosCandidato } from '@/features/eleccion/candidato/api/configuracion-datos-candidato-api'
import { CandidatoForm } from '@/features/eleccion/candidato/components/candidato-form'
import type { Candidato } from '@/features/eleccion/candidato/data/schema'
import { listarCategorias } from '@/features/eleccion/categoria/api/categoria-api'
import { mapCategoriaToElectoral } from '@/features/eleccion/categoria/data/schema'
import { ConflictAlert } from '@/features/eleccion/shared/components/comicio-frozen-guard'

type CandidatoFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  idEleccion: number
  idLista: number
  listaNombre: string
  listaSigla: string
  candidatosEnLista: Pick<Candidato, 'idCategoria' | 'idCandidato'>[]
  candidato?: Candidato | null
}

export const CandidatoFormDialog = ({
  open,
  onOpenChange,
  idEleccion,
  idLista,
  listaNombre,
  listaSigla,
  candidatosEnLista,
  candidato = null,
}: CandidatoFormDialogProps) => {
  const queryClient = useQueryClient()
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)
  const isEditMode = candidato != null

  const configQuery = useQuery({
    queryKey: ['config-datos-candidato', idEleccion],
    queryFn: () => obtenerConfiguracionDatosCandidato(idEleccion),
    enabled: open,
  })

  const categoriasQuery = useQuery({
    queryKey: ['categorias', idEleccion],
    queryFn: () => listarCategorias(idEleccion),
    enabled: open,
  })

  const crearCandidatoMutation = useMutation({
    mutationFn: (input: Parameters<typeof crearCandidato>[1]) =>
      crearCandidato(idLista, input),
    onSuccess: async () => {
      setConflictMessage(null)
      toast.success('Candidato registrado')
      await queryClient.invalidateQueries({ queryKey: ['candidatos', idLista] })
      await queryClient.invalidateQueries({ queryKey: ['listas', idEleccion] })
      await queryClient.invalidateQueries({
        queryKey: ['config-datos-candidato', idEleccion],
      })
      onOpenChange(false)
    },
  })

  const actualizarCandidatoMutation = useMutation({
    mutationFn: (input: Parameters<typeof actualizarCandidato>[1]) => {
      if (!candidato) {
        throw new Error('No hay candidato seleccionado para editar.')
      }
      return actualizarCandidato(candidato.idCandidato, input)
    },
    onSuccess: async () => {
      setConflictMessage(null)
      toast.success('Candidato actualizado')
      await queryClient.invalidateQueries({ queryKey: ['candidatos', idLista] })
      await queryClient.invalidateQueries({ queryKey: ['listas', idEleccion] })
      onOpenChange(false)
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setConflictMessage(null)
    }
    onOpenChange(nextOpen)
  }

  const isLoading = configQuery.isLoading || categoriasQuery.isLoading
  const isSaving =
    crearCandidatoMutation.isPending || actualizarCandidatoMutation.isPending
  const categorias = (categoriasQuery.data ?? []).map(mapCategoriaToElectoral)
  const camposConfig = configQuery.data?.campos ?? []
  const formKey = `${idLista}-${candidato?.idCandidato ?? 'nuevo'}`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar candidato' : 'Registrar candidato'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `${candidato.nombre} ${candidato.apellido} · Lista ${listaNombre} (${listaSigla})`
              : `Lista ${listaNombre} (${listaSigla})`}
          </DialogDescription>
        </DialogHeader>

        <ConflictAlert message={conflictMessage} />

        {isLoading ? (
          <p className='text-sm text-muted-foreground' aria-live='polite'>
            Cargando formulario…
          </p>
        ) : (
          open && (
            <CandidatoForm
              key={formKey}
              categorias={categorias}
              candidatosEnLista={candidatosEnLista}
              excludeCandidatoId={candidato?.idCandidato}
              camposConfig={camposConfig}
              defaultValues={
                candidato
                  ? {
                      nombre: candidato.nombre,
                      apellido: candidato.apellido,
                      idCategoria: candidato.idCategoria,
                      orden: candidato.orden,
                      datosAdicionales: candidato.datosAdicionales,
                    }
                  : undefined
              }
              currentFotoUrl={candidato?.fotoUrl}
              submitLabel={
                isEditMode ? 'Guardar cambios' : 'Registrar candidato'
              }
              onConflictError={setConflictMessage}
              onSubmit={async (values) => {
                if (isEditMode) {
                  await actualizarCandidatoMutation.mutateAsync(values)
                  return
                }
                await crearCandidatoMutation.mutateAsync(values)
              }}
            />
          )
        )}

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
