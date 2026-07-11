import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import enUS from '@univerjs/preset-sheets-core/locales/en-US'
import { createUniver, LocaleType } from '@univerjs/presets'
import type { IWorkbookData } from '@univerjs/presets'
import { AlertCircle, CheckCircle2, RefreshCw, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import '@univerjs/preset-sheets-core/lib/index.css'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useInventoryWorkbook, useSaveInventoryWorkbookChanges } from '@/hooks/useInventoryWorkbook'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type {
  InventoryWorkbookChangesResponse,
  InventoryWorkbookFieldValue,
  InventoryWorkbookResponse,
  InventoryWorkbookRowChange,
  InventoryWorkbookSaveResponse,
  InventoryWorkbookWritableField,
  UniverCellPrimitive,
  UniverWorkbookSnapshot,
} from '@/types/inventoryWorkbook'

const AUTOSAVE_ENABLED = import.meta.env.VITE_INVENTORY_WORKBOOK_AUTOSAVE_ENABLED === 'true'
const AUTOSAVE_DEBOUNCE_MS = 2_000

const writableFieldKeys = new Set<InventoryWorkbookWritableField>([
  'sku',
  'name',
  'latinName',
  'potSize',
  'height',
  'price',
  'regularPrice',
  'salePrice',
  'totalQuantity',
  'stockStatus',
  'imageUrl',
  'published',
  'featured',
])

function InventoryGridLoadingState() {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-3 text-sm text-text-secondary">
        <RefreshCw className="size-4 animate-spin text-verde-600" />
        Loading inventory workbook...
      </div>
    </div>
  )
}

function InventoryGridErrorState({ error, onRetry, isRetrying }: { error: unknown; onRetry: () => void; isRetrying: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex max-w-2xl items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <AlertCircle className="size-4" />
        </div>
        <div className="min-w-0 space-y-3">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Unable to load inventory workbook</h2>
            <p className="mt-1 text-sm text-text-secondary">{getErrorMessage(error, { context: 'load' })}</p>
          </div>
          <Button type="button" variant="secondary" disabled={isRetrying} onClick={onRetry}>
            <RefreshCw className={cn('size-4', isRetrying && 'animate-spin')} />
            Retry
          </Button>
        </div>
      </div>
    </div>
  )
}

type UniverInstances = ReturnType<typeof createUniver>
type SaveableWorkbook = { save: () => IWorkbookData | Promise<IWorkbookData> }
type UniverDisposable = { dispose: () => void }
type UniverAPIWithEvents = UniverInstances['univerAPI'] & {
  Event?: { SheetValueChanged?: unknown }
  addEvent?: (event: unknown, handler: () => void) => UniverDisposable
}

type DirtyRows = Map<string, InventoryWorkbookRowChange>

type BaselineRow = {
  sheetId: string
  sheetName: string
  categoryId: string
  rowIndex: number
  displayRowNumber: number
  rowToken: string
  baseUpdatedAt: string
  values: Partial<Record<InventoryWorkbookWritableField, InventoryWorkbookFieldValue>>
}

type WorkbookBaseline = {
  rows: Map<string, BaselineRow>
  writableColumnsBySheet: Map<string, Map<number, InventoryWorkbookWritableField>>
  updatedAtColumnBySheet: Map<string, number>
}

function InventoryGridSaveSummary({ result }: { result: InventoryWorkbookSaveResponse }) {
  const problemRows = result.rows.filter((row) => row.status === 'failed' || row.status === 'conflict').slice(0, 10)

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
          <CheckCircle2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-text-primary">Workbook save complete</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {result.summary.changedRows} changed · {result.summary.skippedRows} unchanged · {result.summary.failedRows} failed ·{' '}
            {result.summary.conflictedRows} conflicts
          </p>

          {problemRows.length > 0 ? (
            <div className="mt-3 rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Rows needing attention</p>
              <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                {problemRows.map((row) => (
                  <li key={`${row.sheetId}-${row.rowIndex}-${row.code}`}>
                    {row.sheetName} row {row.displayRowNumber}
                    {row.sku ? ` (${row.sku})` : ''}: {row.message ?? row.code ?? row.status}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function InventoryGridSaveError({ error }: { error: unknown }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-semibold">Unable to save workbook</p>
          <p className="mt-1">{getErrorMessage(error, { context: 'update' })}</p>
        </div>
      </div>
    </div>
  )
}

const rowKey = (sheetId: string, rowIndex: number) => `${sheetId}:${rowIndex}`

const isBlank = (value: unknown) => value === undefined || value === null || (typeof value === 'string' && value.trim() === '')

const normalizeWorkbookCellValue = (key: string, value: UniverCellPrimitive | undefined): InventoryWorkbookFieldValue => {
  if (['sku', 'name'].includes(key)) {
    return isBlank(value) ? '' : String(value).trim()
  }

  if (['latinName', 'potSize', 'height', 'stockStatus', 'imageUrl'].includes(key)) {
    return isBlank(value) ? null : String(value).trim()
  }

  if (['price', 'regularPrice'].includes(key)) {
    return isBlank(value) ? Number.NaN : Number(value)
  }

  if (key === 'salePrice') {
    return isBlank(value) ? null : Number(value)
  }

  if (key === 'totalQuantity') {
    return isBlank(value) ? Number.NaN : Math.trunc(Number(value))
  }

  if (['published', 'featured'].includes(key)) {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    if (typeof value === 'string') return ['true', '1', 'yes', 'y', 'on'].includes(value.trim().toLowerCase())
    return Boolean(value)
  }

  return value ?? null
}

const isSameCellValue = (left: InventoryWorkbookFieldValue | undefined, right: InventoryWorkbookFieldValue | undefined) => {
  if (typeof left === 'number' && Number.isNaN(left) && typeof right === 'number' && Number.isNaN(right)) {
    return true
  }

  return left === right
}

const getCellValue = (workbook: UniverWorkbookSnapshot, sheetId: string, rowIndex: number, columnIndex: number) =>
  workbook.sheets[sheetId]?.cellData?.[rowIndex]?.[columnIndex]?.v

const buildWorkbookBaseline = (workbookData?: InventoryWorkbookResponse): WorkbookBaseline => {
  const baseline: WorkbookBaseline = {
    rows: new Map(),
    writableColumnsBySheet: new Map(),
    updatedAtColumnBySheet: new Map(),
  }

  if (!workbookData) {
    return baseline
  }

  for (const sheetMetadata of workbookData.metadata.sheets) {
    const sheet = workbookData.workbook.sheets[sheetMetadata.sheetId]
    if (!sheet) {
      continue
    }

    const writableColumns = new Map<number, InventoryWorkbookWritableField>()
    const updatedAtColumn = sheetMetadata.columns.find((column) => column.key === 'updatedAt')?.columnIndex

    for (const column of sheetMetadata.columns) {
      if (!column.readOnly && writableFieldKeys.has(column.key as InventoryWorkbookWritableField)) {
        writableColumns.set(column.columnIndex, column.key as InventoryWorkbookWritableField)
      }
    }

    baseline.writableColumnsBySheet.set(sheetMetadata.sheetId, writableColumns)
    if (updatedAtColumn !== undefined) {
      baseline.updatedAtColumnBySheet.set(sheetMetadata.sheetId, updatedAtColumn)
    }

    for (const [rowIndexText, token] of Object.entries(sheetMetadata.rowIdentities ?? {})) {
      const rowIndex = Number(rowIndexText)
      if (!Number.isInteger(rowIndex)) {
        continue
      }

      const values: BaselineRow['values'] = {}
      for (const [columnIndex, field] of writableColumns.entries()) {
        values[field] = normalizeWorkbookCellValue(field, getCellValue(workbookData.workbook, sheetMetadata.sheetId, rowIndex, columnIndex))
      }

      const updatedAtValue = updatedAtColumn === undefined ? '' : getCellValue(workbookData.workbook, sheetMetadata.sheetId, rowIndex, updatedAtColumn)

      baseline.rows.set(rowKey(sheetMetadata.sheetId, rowIndex), {
        sheetId: sheetMetadata.sheetId,
        sheetName: sheet.name || sheetMetadata.categoryName,
        categoryId: sheetMetadata.categoryId,
        rowIndex,
        displayRowNumber: rowIndex + 1,
        rowToken: token,
        baseUpdatedAt: typeof updatedAtValue === 'string' ? updatedAtValue : String(updatedAtValue ?? ''),
        values,
      })
    }
  }

  return baseline
}

const buildDirtyRowsFromWorkbook = (workbook: UniverWorkbookSnapshot, baseline: WorkbookBaseline): DirtyRows => {
  const dirtyRows: DirtyRows = new Map()

  for (const baseRow of baseline.rows.values()) {
    const writableColumns = baseline.writableColumnsBySheet.get(baseRow.sheetId)
    if (!writableColumns) {
      continue
    }

    const fields: InventoryWorkbookRowChange['fields'] = {}
    for (const [columnIndex, field] of writableColumns.entries()) {
      const oldValue = baseRow.values[field]
      const newValue = normalizeWorkbookCellValue(field, getCellValue(workbook, baseRow.sheetId, baseRow.rowIndex, columnIndex))

      if (!isSameCellValue(oldValue, newValue)) {
        fields[field] = { oldValue, newValue }
      }
    }

    if (Object.keys(fields).length > 0) {
      dirtyRows.set(rowKey(baseRow.sheetId, baseRow.rowIndex), {
        sheetId: baseRow.sheetId,
        sheetName: baseRow.sheetName,
        categoryId: baseRow.categoryId,
        rowIndex: baseRow.rowIndex,
        displayRowNumber: baseRow.displayRowNumber,
        rowToken: baseRow.rowToken,
        baseUpdatedAt: baseRow.baseUpdatedAt,
        fields,
      })
    }
  }

  return dirtyRows
}

export function InventoryGridPage() {
  const univerContainerRef = useRef<HTMLDivElement>(null)
  const univerAPIRef = useRef<UniverInstances['univerAPI'] | null>(null)
  const activeWorkbookRef = useRef<SaveableWorkbook | null>(null)
  const tokenOverridesRef = useRef<Map<string, { rowToken: string; baseUpdatedAt: string }>>(new Map())
  const saveInFlightRef = useRef(false)
  const queuedAutosaveRef = useRef(false)
  const inventoryWorkbookQuery = useInventoryWorkbook()
  const saveWorkbookChangesMutation = useSaveInventoryWorkbookChanges()
  const [dirtyRows, setDirtyRows] = useState<DirtyRows>(() => new Map())
  const [saveResult, setSaveResult] = useState<InventoryWorkbookChangesResponse | null>(null)
  const [hasConflict, setHasConflict] = useState(false)
  const workbookData = inventoryWorkbookQuery.data
  const workbook = workbookData?.workbook
  const workbookName = workbook?.name ?? 'Verde Inventory'
  const sheetCount = workbook?.sheetOrder.length ?? 0
  const productCount = workbookData?.metadata.sheets.reduce((total, sheet) => {
    const worksheet = workbook?.sheets[sheet.sheetId]
    const rowCount = worksheet ? Object.keys(worksheet.cellData).length - 1 : 0

    return total + Math.max(rowCount, 0)
  }, 0)
  const workbookBaseline = useMemo(() => buildWorkbookBaseline(workbookData), [workbookData])
  const dirtyRowCount = dirtyRows.size
  const dirtyCellCount = [...dirtyRows.values()].reduce((total, row) => total + Object.keys(row.fields).length, 0)

  const rebuildDirtyRowsFromRuntime = useCallback(async () => {
    const fWorkbook = activeWorkbookRef.current ?? (univerAPIRef.current?.getActiveWorkbook() as unknown as SaveableWorkbook | null)
    if (!fWorkbook) {
      return
    }

    const runtimeWorkbook = (await Promise.resolve(fWorkbook.save())) as unknown as UniverWorkbookSnapshot
    const nextDirtyRows = buildDirtyRowsFromWorkbook(runtimeWorkbook, workbookBaseline)

    for (const [key, override] of tokenOverridesRef.current.entries()) {
      const dirtyRow = nextDirtyRows.get(key)
      if (dirtyRow) {
        dirtyRow.rowToken = override.rowToken
        dirtyRow.baseUpdatedAt = override.baseUpdatedAt
      }
    }

    setDirtyRows(nextDirtyRows)
    if (nextDirtyRows.size > 0) {
      setSaveResult(null)
    }
  }, [workbookBaseline])

  useEffect(() => {
    const container = univerContainerRef.current

    if (!container || !workbook) {
      return
    }

    activeWorkbookRef.current = null
    univerAPIRef.current = null
    tokenOverridesRef.current.clear()
    container.replaceChildren()

    const { univer, univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: enUS,
      },
      presets: [
        UniverSheetsCorePreset({
          container,
          header: false,
          toolbar: false,
          footer: {
            sheetBar: true,
            statisticBar: true,
            menus: false,
            zoomSlider: true,
            addSheetButtonConfig: { show: false },
          },
          contextMenu: false,
          formulaBar: true,
          disableAutoFocus: true,
        }),
      ],
    })

    const fWorkbook = univerAPI.createWorkbook(workbook as unknown as Partial<IWorkbookData>)
    const disposables: UniverDisposable[] = []
    const eventApi = univerAPI as UniverAPIWithEvents

    univerAPIRef.current = univerAPI
    activeWorkbookRef.current = fWorkbook as unknown as SaveableWorkbook

    if (eventApi.Event?.SheetValueChanged && typeof eventApi.addEvent === 'function') {
      disposables.push(
        eventApi.addEvent(eventApi.Event.SheetValueChanged, () => {
          void rebuildDirtyRowsFromRuntime()
        }),
      )
    }

    return () => {
      for (const disposable of disposables) {
        disposable.dispose()
      }
      activeWorkbookRef.current = null
      univerAPIRef.current = null
      univerAPI.dispose()
      univer.dispose()
      container.replaceChildren()
    }
  }, [rebuildDirtyRowsFromRuntime, workbook])

  const flushDeltaSave = useCallback(
    async (saveMode: 'manual' | 'autosave') => {
      if (!workbookData || dirtyRows.size === 0 || (hasConflict && saveMode === 'autosave')) {
        return null
      }

      if (saveInFlightRef.current) {
        queuedAutosaveRef.current = true
        return null
      }

      saveInFlightRef.current = true
      setSaveResult(null)

      try {
        const clientMutationId = `inventory-workbook-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const changes = [...dirtyRows.values()]
        const result = await saveWorkbookChangesMutation.mutateAsync({
          workbookId: workbookData.workbook.id,
          workbookGeneratedAt: workbookData.metadata.generatedAt,
          clientMutationId,
          saveMode,
          changes,
        })

        setSaveResult(result)
        setHasConflict(result.summary.conflictedRows > 0)

        const successfulRows = new Set<string>()
        for (const row of result.rows) {
          const key = rowKey(row.sheetId, row.rowIndex)
          if ((row.status === 'changed' || row.status === 'skipped') && row.refreshedRowToken && row.refreshedUpdatedAt) {
            tokenOverridesRef.current.set(key, { rowToken: row.refreshedRowToken, baseUpdatedAt: row.refreshedUpdatedAt })
          }
          if (row.status === 'changed' || row.status === 'skipped') {
            successfulRows.add(key)
          }
        }

        setDirtyRows((currentDirtyRows) => {
          const nextDirtyRows = new Map(currentDirtyRows)
          for (const key of successfulRows) {
            nextDirtyRows.delete(key)
          }
          return nextDirtyRows
        })

        if (result.summary.failedRows === 0 && result.summary.conflictedRows === 0) {
          await inventoryWorkbookQuery.refetch()
        }

        return result
      } finally {
        saveInFlightRef.current = false
        if (queuedAutosaveRef.current && dirtyRows.size > 0 && !hasConflict) {
          queuedAutosaveRef.current = false
          void flushDeltaSave('autosave')
        }
      }
    },
    [dirtyRows, hasConflict, inventoryWorkbookQuery, saveWorkbookChangesMutation, workbookData],
  )

  useEffect(() => {
    if (!AUTOSAVE_ENABLED || dirtyRows.size === 0 || hasConflict) {
      return
    }

    const timeout = window.setTimeout(() => {
      void flushDeltaSave('autosave')
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [dirtyRows, flushDeltaSave, hasConflict])

  const handleSave = async () => {
    await flushDeltaSave('manual')
  }

  const saveButtonText = saveWorkbookChangesMutation.isPending
    ? 'Saving...'
    : dirtyCellCount > 0
      ? `Save ${dirtyRowCount} row${dirtyRowCount === 1 ? '' : 's'} / ${dirtyCellCount} cell${dirtyCellCount === 1 ? '' : 's'}`
      : 'Saved'

  const statusText = saveWorkbookChangesMutation.isPending
    ? 'Saving'
    : hasConflict
      ? 'Conflict'
      : saveWorkbookChangesMutation.isError
        ? 'Save failed'
        : dirtyCellCount > 0
          ? 'Unsaved'
          : 'Saved'

  return (
    <section className="space-y-6">
      <PageHeader
        title="Inventory Grid"
        subtitle="Edit inventory values, then click Save. Changes are validated server-side before updating stock. Use the sheet tabs below to switch categories."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={inventoryWorkbookQuery.isFetching || saveWorkbookChangesMutation.isPending || dirtyCellCount > 0}
              onClick={() => void inventoryWorkbookQuery.refetch()}
            >
              <RefreshCw className={cn('size-4', inventoryWorkbookQuery.isFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              type="button"
              disabled={!workbookData || dirtyCellCount === 0 || saveWorkbookChangesMutation.isPending || inventoryWorkbookQuery.isFetching}
              onClick={() => void handleSave()}
            >
              <Save className={cn('size-4', saveWorkbookChangesMutation.isPending && 'animate-pulse')} />
              {saveButtonText}
            </Button>
          </div>
        }
      />

      {inventoryWorkbookQuery.isLoading ? <InventoryGridLoadingState /> : null}

      {inventoryWorkbookQuery.isError ? (
        <InventoryGridErrorState
          error={inventoryWorkbookQuery.error}
          isRetrying={inventoryWorkbookQuery.isFetching}
          onRetry={() => void inventoryWorkbookQuery.refetch()}
        />
      ) : null}

      {saveWorkbookChangesMutation.isError ? <InventoryGridSaveError error={saveWorkbookChangesMutation.error} /> : null}
      {saveResult ? <InventoryGridSaveSummary result={saveResult} /> : null}

      {workbookData && !inventoryWorkbookQuery.isError ? (
        <div className="inventory-grid-card overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-text-primary">{workbookName}</h2>
              <p className="text-sm text-text-secondary">
                {productCount ?? 0} products · {sheetCount} workbook sheet{sheetCount === 1 ? '' : 's'} · {statusText}
                {dirtyCellCount > 0 ? ` · ${dirtyRowCount} changed rows / ${dirtyCellCount} cells` : ''}
                {AUTOSAVE_ENABLED ? ' · autosave on' : ''}
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-text-secondary">
              Univer workbook
            </span>
          </div>

          {workbook ? (
            <div className="h-[72vh] min-h-[560px] overflow-hidden bg-white">
              <div ref={univerContainerRef} className="size-full" />
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 py-10 text-center">
              <div>
                <h3 className="text-base font-semibold text-text-primary">No workbook found</h3>
                <p className="mt-1 text-sm text-text-secondary">The inventory workbook is empty or unavailable.</p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
