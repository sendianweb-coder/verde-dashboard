import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import enUS from '@univerjs/preset-sheets-core/locales/en-US'
import { createUniver, LocaleType } from '@univerjs/presets'
import type { IWorkbookData } from '@univerjs/presets'
import { AlertCircle, CheckCircle2, RefreshCw, Save } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import '@univerjs/preset-sheets-core/lib/index.css'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useInventoryWorkbook, useSaveInventoryWorkbook } from '@/hooks/useInventoryWorkbook'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { InventoryWorkbookSaveResponse, UniverWorkbookSnapshot } from '@/types/inventoryWorkbook'

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

export function InventoryGridPage() {
  const univerContainerRef = useRef<HTMLDivElement>(null)
  const univerAPIRef = useRef<UniverInstances['univerAPI'] | null>(null)
  const activeWorkbookRef = useRef<SaveableWorkbook | null>(null)
  const inventoryWorkbookQuery = useInventoryWorkbook()
  const saveWorkbookMutation = useSaveInventoryWorkbook()
  const [isDirty, setIsDirty] = useState(false)
  const [saveResult, setSaveResult] = useState<InventoryWorkbookSaveResponse | null>(null)
  const workbookData = inventoryWorkbookQuery.data
  const workbook = workbookData?.workbook
  const workbookName = workbook?.name ?? 'Verde Inventory'
  const sheetCount = workbook?.sheetOrder.length ?? 0
  const productCount = workbookData?.metadata.sheets.reduce((total, sheet) => {
    const worksheet = workbook?.sheets[sheet.sheetId]
    const rowCount = worksheet ? Object.keys(worksheet.cellData).length - 1 : 0

    return total + Math.max(rowCount, 0)
  }, 0)

  useEffect(() => {
    const container = univerContainerRef.current

    if (!container || !workbook) {
      return
    }

    activeWorkbookRef.current = null
    univerAPIRef.current = null
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
          setIsDirty(true)
          setSaveResult(null)
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
  }, [workbook])

  const handleSave = async () => {
    if (!workbookData) {
      return
    }

    const fWorkbook = activeWorkbookRef.current ?? (univerAPIRef.current?.getActiveWorkbook() as unknown as SaveableWorkbook | null)
    if (!fWorkbook) {
      return
    }

    setSaveResult(null)
    const savedWorkbook = await Promise.resolve(fWorkbook.save())
    const result = await saveWorkbookMutation.mutateAsync({
      workbook: savedWorkbook as unknown as UniverWorkbookSnapshot,
      metadata: workbookData.metadata,
    })

    setSaveResult(result)
    if (result.summary.failedRows === 0 && result.summary.conflictedRows === 0) {
      setIsDirty(false)
    }
    await inventoryWorkbookQuery.refetch()
  }

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
              disabled={inventoryWorkbookQuery.isFetching || saveWorkbookMutation.isPending}
              onClick={() => void inventoryWorkbookQuery.refetch()}
            >
              <RefreshCw className={cn('size-4', inventoryWorkbookQuery.isFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              type="button"
              disabled={!workbookData || !isDirty || saveWorkbookMutation.isPending || inventoryWorkbookQuery.isFetching}
              onClick={() => void handleSave()}
            >
              <Save className={cn('size-4', saveWorkbookMutation.isPending && 'animate-pulse')} />
              {saveWorkbookMutation.isPending ? 'Saving...' : isDirty ? 'Save changes' : 'Saved'}
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

      {saveWorkbookMutation.isError ? <InventoryGridSaveError error={saveWorkbookMutation.error} /> : null}
      {saveResult ? <InventoryGridSaveSummary result={saveResult} /> : null}

      {workbookData && !inventoryWorkbookQuery.isError ? (
        <div className="inventory-grid-card overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-text-primary">{workbookName}</h2>
              <p className="text-sm text-text-secondary">
                {productCount ?? 0} products · {sheetCount} workbook sheet{sheetCount === 1 ? '' : 's'} · {isDirty ? 'unsaved changes' : 'saved'}
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
