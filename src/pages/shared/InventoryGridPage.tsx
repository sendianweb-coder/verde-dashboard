import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import enUS from '@univerjs/preset-sheets-core/locales/en-US'
import { createUniver, LocaleType } from '@univerjs/presets'
import type { IWorkbookData } from '@univerjs/presets'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useEffect, useRef } from 'react'

import '@univerjs/preset-sheets-core/lib/index.css'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useInventoryWorkbook } from '@/hooks/useInventoryWorkbook'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

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

export function InventoryGridPage() {
  const univerContainerRef = useRef<HTMLDivElement>(null)
  const inventoryWorkbookQuery = useInventoryWorkbook()
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

    univerAPI.createWorkbook(workbook as unknown as Partial<IWorkbookData>)

    return () => {
      univerAPI.dispose()
      univer.dispose()
      container.replaceChildren()
    }
  }, [workbook])

  return (
    <section className="space-y-6">
      <PageHeader
        title="Inventory Grid"
        subtitle="Univer workbook view for all categories. Use the sheet tabs below to switch category product lists. Editing is not saved in this phase."
        action={
          <Button
            type="button"
            variant="secondary"
            disabled={inventoryWorkbookQuery.isFetching}
            onClick={() => void inventoryWorkbookQuery.refetch()}
          >
            <RefreshCw className={cn('size-4', inventoryWorkbookQuery.isFetching && 'animate-spin')} />
            Refresh
          </Button>
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

      {workbookData && !inventoryWorkbookQuery.isError ? (
        <div className="inventory-grid-card overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-text-primary">{workbookName}</h2>
              <p className="text-sm text-text-secondary">
                {productCount ?? 0} products · {sheetCount} workbook sheet{sheetCount === 1 ? '' : 's'} · read-only preview · edits are
                not saved yet
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-text-secondary">
              Univer preview
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
