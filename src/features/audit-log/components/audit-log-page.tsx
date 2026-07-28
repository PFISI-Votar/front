import { useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuditLogDetailSheet } from '@/features/audit-log/components/audit-log-detail-sheet'
import { AuditLogTable } from '@/features/audit-log/components/audit-log-table'
import { AuditLogToolbar } from '@/features/audit-log/components/audit-log-toolbar'
import type {
  AuditLogItem,
  AuditLogSearchParams,
} from '@/features/audit-log/data/schema'
import { useAuditLogSearch } from '@/features/audit-log/hooks/use-audit-log-search'
import {
  draftToSearchParams,
  emptyDraft,
  searchParamsToDraft,
  type AuditLogToolbarDraft,
} from '@/features/audit-log/lib/audit-log-search-state'
import { listarElecciones } from '@/features/eleccion/api/eleccion-api'

type AuditLogPageProps = {
  search: AuditLogSearchParams
  idEleccionFijo?: number
}

export const AuditLogPage = ({ search, idEleccionFijo }: AuditLogPageProps) => {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<AuditLogToolbarDraft>(() =>
    searchParamsToDraft(search, idEleccionFijo)
  )
  const [appliedSearch, setAppliedSearch] =
    useState<AuditLogSearchParams>(search)
  const [selectedItem, setSelectedItem] = useState<AuditLogItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const eleccionesQuery = useQuery({
    queryKey: ['elecciones'],
    queryFn: listarElecciones,
    enabled: idEleccionFijo == null,
  })

  const filters = useMemo(
    () => ({
      page: appliedSearch.page ?? 1,
      limit: appliedSearch.pageSize ?? 50,
      idEleccion:
        idEleccionFijo ??
        (appliedSearch.idEleccion != null
          ? appliedSearch.idEleccion
          : undefined),
      tipoEvento:
        appliedSearch.tipoEvento != null && appliedSearch.tipoEvento.length > 0
          ? appliedSearch.tipoEvento
          : undefined,
      actor: appliedSearch.actor,
      terminal: appliedSearch.terminal,
      endpoint: appliedSearch.endpoint,
      desde: appliedSearch.desde,
      hasta: appliedSearch.hasta,
      nivel: appliedSearch.nivel,
      resultado: appliedSearch.resultado,
      q: appliedSearch.q,
    }),
    [appliedSearch, idEleccionFijo]
  )

  const auditLogQuery = useAuditLogSearch(filters)

  useEffect(() => {
    if (!auditLogQuery.isError) {
      return
    }
    const message = isAxiosError(auditLogQuery.error)
      ? getApiErrorMessage(auditLogQuery.error)
      : 'No se pudo consultar el registro de auditoría.'
    toast.error(message)
  }, [auditLogQuery.error, auditLogQuery.isError])

  const syncUrl = (nextSearch: AuditLogSearchParams): void => {
    if (idEleccionFijo != null) {
      navigate({
        to: '/comicios/$idEleccion/auditoria',
        params: { idEleccion: String(idEleccionFijo) },
        search: nextSearch,
        replace: true,
      })
      return
    }
    navigate({
      to: '/auditoria',
      search: nextSearch,
      replace: true,
    })
  }

  const handleApplyFilters = (): void => {
    const nextSearch = draftToSearchParams(
      draft,
      1,
      appliedSearch.pageSize ?? 50,
      idEleccionFijo
    )
    setAppliedSearch(nextSearch)
    syncUrl(nextSearch)
  }

  const handleClearFilters = (): void => {
    const clearedDraft = emptyDraft(idEleccionFijo)
    setDraft(clearedDraft)
    const nextSearch: AuditLogSearchParams = {
      page: 1,
      pageSize: appliedSearch.pageSize ?? 50,
      ...(idEleccionFijo != null ? { idEleccion: idEleccionFijo } : {}),
    }
    setAppliedSearch(nextSearch)
    syncUrl(nextSearch)
  }

  const handlePageChange = (page: number): void => {
    const nextSearch = {
      ...appliedSearch,
      page,
    }
    setAppliedSearch(nextSearch)
    syncUrl(nextSearch)
  }

  const handlePageSizeChange = (pageSize: number): void => {
    const nextSearch = {
      ...appliedSearch,
      page: 1,
      pageSize,
    }
    setAppliedSearch(nextSearch)
    syncUrl(nextSearch)
  }

  const handleViewDetail = (item: AuditLogItem): void => {
    setSelectedItem(item)
    setDetailOpen(true)
  }

  return (
    <>
      <div className='flex flex-col gap-0.5'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Registro de auditoría
        </h1>
        <p className='text-muted-foreground'>
          Motor de búsqueda institucional off-chain para investigar incidentes y
          operaciones del Panel (VOTAR-371).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros avanzados</CardTitle>
          <CardDescription>
            Los identificadores de operador y terminal se muestran ofuscados;
            nunca se expone email ni IP en claro.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <AuditLogToolbar
            draft={draft}
            onDraftChange={setDraft}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            idEleccionFijo={idEleccionFijo}
            elecciones={eleccionesQuery.data?.map((eleccion) => ({
              idEleccion: eleccion.idEleccion,
              nombre: eleccion.nombre,
            }))}
          />

          <AuditLogTable
            items={auditLogQuery.data?.items ?? []}
            total={auditLogQuery.data?.total ?? 0}
            page={appliedSearch.page ?? 1}
            pageSize={appliedSearch.pageSize ?? 50}
            isLoading={auditLogQuery.isLoading}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onViewDetail={handleViewDetail}
            onClearFilters={handleClearFilters}
          />
        </CardContent>
      </Card>

      <AuditLogDetailSheet
        item={selectedItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  )
}
