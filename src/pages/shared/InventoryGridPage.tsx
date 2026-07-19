import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import enUS from '@univerjs/preset-sheets-core/locales/en-US'
import { createUniver, LocaleType } from '@univerjs/presets'
import type { IWorkbookData } from '@univerjs/presets'
import { AlertCircle, CheckCircle2, Maximize2, Minimize2, RefreshCw, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import '@univerjs/preset-sheets-core/lib/index.css'
import './inventoryGrid.css'

import { ImageUrlEditorDialog, type ImageUrlEditorTarget } from '@/components/shared/inventory/ImageUrlEditorDialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  useInventoryWorkbook,
  useSaveInventoryWorkbookChanges,
  useUploadInventoryWorkbookImage,
} from '@/hooks/useInventoryWorkbook'
import { getErrorMessage } from '@/lib/errors'
import {
  drawInventoryDateTime,
  getDateTimeCellKey,
  getUpdatedAtCells,
} from '@/lib/inventoryGrid/dateTimeCells'
import {
  drawImagePreview,
  getImagePreviewCellKey,
  getImagePreviewCells,
  ImagePreviewCache,
  type ImagePreviewCell,
} from '@/lib/inventoryGrid/imagePreviews'
import {
  drawPublishedToggle,
  getPublishedToggleCellKey,
  getPublishedToggleCells,
  isPublishedToggleEnabled,
} from '@/lib/inventoryGrid/publishedToggle'
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
  'totalQuantity',
  'imageUrl',
  'published',
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
  Event?: {
    SheetValueChanged?: unknown
    CellClicked?: unknown
    BeforeSheetEditStart?: unknown
  }
  addEvent?: (event: unknown, handler: (params: unknown) => void) => UniverDisposable
}

type SheetValueChangedEvent = {
  effectedRanges?: Array<{ getSheetId: () => string; getRow: () => number; getLastRow: () => number; getColumn: () => number; getLastColumn: () => number }>
}
type WorksheetCellEvent = {
  row: number
  column: number
  worksheet: { getSheetId: () => string; getRange: (row: number, column: number) => { getValue: () => unknown; setValue: (value: unknown) => void } }
}

type CellClickedEvent = WorksheetCellEvent
type BeforeSheetEditStartEvent = WorksheetCellEvent & { cancel?: boolean }

type DirtyRows = Map<string, InventoryWorkbookRowChange>

type StagedImageUpload = {
  target: ImageUrlEditorTarget
  image: File
  previewUrl: string
}

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

  if (['latinName', 'potSize', 'height', 'imageUrl'].includes(key)) {
    return isBlank(value) ? null : String(value).trim()
  }

  if (key === 'price') {
    return isBlank(value) ? Number.NaN : Number(value)
  }

  if (key === 'totalQuantity') {
    return isBlank(value) ? Number.NaN : Math.trunc(Number(value))
  }

  if (key === 'published') {
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
  const inventoryGridCardRef = useRef<HTMLDivElement>(null)
  const univerContainerRef = useRef<HTMLDivElement>(null)
  const univerAPIRef = useRef<UniverInstances['univerAPI'] | null>(null)
  const activeWorkbookRef = useRef<SaveableWorkbook | null>(null)
  const runtimeWorkbookRef = useRef<IWorkbookData | null>(null)
  const workbookSourceRef = useRef<UniverWorkbookSnapshot | undefined>(undefined)
  const fullscreenStateRef = useRef(false)
  const tokenOverridesRef = useRef<Map<string, { rowToken: string; baseUpdatedAt: string }>>(new Map())
  const imagePreviewCellsRef = useRef<Map<string, ImagePreviewCell>>(new Map())
  const publishedToggleCellsRef = useRef<Set<string>>(new Set())
  const updatedAtCellsRef = useRef<Set<string>>(new Set())
  const imagePreviewUrlsRef = useRef<Map<string, string>>(new Map())
  const stagedImageUploadsRef = useRef<Map<string, StagedImageUpload>>(new Map())
  const stagedImagePreviewUrlsRef = useRef<Map<string, string>>(new Map())
  const imagePreviewCacheRef = useRef(new ImagePreviewCache())
  const toolbarActionsRef = useRef<{ refresh: () => void; save: () => void }>({ refresh: () => undefined, save: () => undefined })
  const saveInFlightRef = useRef(false)
  const queuedAutosaveRef = useRef(false)
  const inventoryWorkbookQuery = useInventoryWorkbook()
  const saveWorkbookChangesMutation = useSaveInventoryWorkbookChanges()
  const uploadInventoryWorkbookImageMutation = useUploadInventoryWorkbookImage()
  const [dirtyRows, setDirtyRows] = useState<DirtyRows>(() => new Map())
  const [saveResult, setSaveResult] = useState<InventoryWorkbookChangesResponse | null>(null)
  const [hasConflict, setHasConflict] = useState(false)
  const [imageUrlEditorTarget, setImageUrlEditorTarget] = useState<ImageUrlEditorTarget | null>(null)
  const [stagedImageUploadCount, setStagedImageUploadCount] = useState(0)
  const [isSavingStagedImages, setIsSavingStagedImages] = useState(false)
  const [stagedImageUploadError, setStagedImageUploadError] = useState<unknown>(null)
  const [isInventoryGridFullscreen, setIsInventoryGridFullscreen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState<string | null>(null)
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

  useEffect(() => {
    const stagedUploads = stagedImageUploadsRef.current
    const stagedPreviewUrls = stagedImagePreviewUrlsRef.current

    return () => {
      for (const { previewUrl } of stagedUploads.values()) {
        URL.revokeObjectURL(previewUrl)
      }
      stagedUploads.clear()
      stagedPreviewUrls.clear()
    }
  }, [])

  const rebuildDirtyRowsFromRuntime = useCallback(async (): Promise<DirtyRows> => {
    const fWorkbook = activeWorkbookRef.current ?? (univerAPIRef.current?.getActiveWorkbook() as unknown as SaveableWorkbook | null)
    if (!fWorkbook) {
      return new Map()
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

    return nextDirtyRows
  }, [workbookBaseline])

  const captureRuntimeWorkbook = useCallback(async () => {
    const fWorkbook = activeWorkbookRef.current
    if (!fWorkbook) {
      return
    }

    runtimeWorkbookRef.current = await Promise.resolve(fWorkbook.save())
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement === inventoryGridCardRef.current
      if (isFullscreen === fullscreenStateRef.current) {
        return
      }

      void captureRuntimeWorkbook()
        .catch(() => setFullscreenError('Unable to preserve workbook changes while switching fullscreen mode.'))
        .finally(() => {
          fullscreenStateRef.current = isFullscreen
          setIsInventoryGridFullscreen(isFullscreen)
        })
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [captureRuntimeWorkbook])

  const handleFullscreenToggle = useCallback(async () => {
    const card = inventoryGridCardRef.current
    if (!card) {
      setFullscreenError('Fullscreen is unavailable because the workbook editor is not ready.')
      return
    }

    try {
      setFullscreenError(null)
      await captureRuntimeWorkbook()
      if (document.fullscreenElement === card) {
        await document.exitFullscreen()
      } else {
        await card.requestFullscreen()
      }
    } catch {
      setFullscreenError('Fullscreen was blocked by the browser. Allow fullscreen and try again.')
    }
  }, [captureRuntimeWorkbook])

  const refreshActiveImagePreviewCanvas = useCallback(() => {
    univerAPIRef.current?.getActiveWorkbook()?.getActiveSheet()?.refreshCanvas()
  }, [])

  const invalidateAffectedImagePreviews = useCallback(
    (event: SheetValueChangedEvent) => {
      const affectedSheetIds = new Set<string>()

      for (const range of event.effectedRanges ?? []) {
        for (const [cellKey, cell] of imagePreviewCellsRef.current.entries()) {
          if (
            cell.sheetId !== range.getSheetId() ||
            cell.rowIndex < range.getRow() ||
            cell.rowIndex > range.getLastRow() ||
            cell.columnIndex < range.getColumn() ||
            cell.columnIndex > range.getLastColumn()
          ) {
            continue
          }

          const worksheet = univerAPIRef.current?.getActiveWorkbook()?.getSheetBySheetId(cell.sheetId)
          const value = worksheet?.getRange(cell.rowIndex, cell.columnIndex).getValue()
          const imageUrl = typeof value === 'string' ? value.trim() : ''
          imagePreviewCacheRef.current.invalidate(imagePreviewUrlsRef.current.get(cellKey))
          imagePreviewCacheRef.current.invalidate(imageUrl)
          imagePreviewUrlsRef.current.set(cellKey, imageUrl)
          affectedSheetIds.add(cell.sheetId)
        }
      }

      const workbook = univerAPIRef.current?.getActiveWorkbook()
      for (const sheetId of affectedSheetIds) {
        workbook?.getSheetBySheetId(sheetId)?.refreshCanvas()
      }
    },
    [],
  )

  useEffect(() => {
    const container = univerContainerRef.current

    if (!container || !workbook) {
      return
    }

    if (workbookSourceRef.current !== workbook) {
      workbookSourceRef.current = workbook
      runtimeWorkbookRef.current = workbook as unknown as IWorkbookData
    }

    const workbookForUniver = runtimeWorkbookRef.current ?? (workbook as unknown as IWorkbookData)
    const imagePreviewCache = imagePreviewCacheRef.current

    activeWorkbookRef.current = null
    univerAPIRef.current = null
    tokenOverridesRef.current.clear()
    imagePreviewCellsRef.current.clear()
    publishedToggleCellsRef.current.clear()
    updatedAtCellsRef.current.clear()
    imagePreviewUrlsRef.current.clear()
    imagePreviewCache.clear()
    container.replaceChildren()

    const { univer, univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: enUS,
      },
      presets: [
        UniverSheetsCorePreset({
          container,
          header: true,
          toolbar: true,
          ribbonType: isInventoryGridFullscreen ? 'classic' : 'simple',
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

    const fWorkbook = univerAPI.createWorkbook(workbookForUniver as Partial<IWorkbookData>)
    const disposables: UniverDisposable[] = []
    const eventApi = univerAPI as UniverAPIWithEvents

    univerAPIRef.current = univerAPI
    activeWorkbookRef.current = fWorkbook as unknown as SaveableWorkbook

    let headerSetupFrame: number | undefined
    const initializeHeaders = () => {
      if (!fWorkbook.getActiveSheet()?.getSkeleton()) {
        headerSetupFrame = window.requestAnimationFrame(initializeHeaders)
        return
      }

      for (const sheetMetadata of workbookData.metadata.sheets) {
        const worksheet = fWorkbook.getSheetBySheetId(sheetMetadata.sheetId)
        if (!worksheet) {
          continue
        }

        worksheet.customizeColumnHeader({
          headerStyle: {
            backgroundColor: '#f3f3f3',
            borderColor: '#ededed',
            fontColor: '#525252',
            fontFamily: 'InterVariable, Inter, sans-serif',
            fontSize: 12,
            textAlign: 'left',
            textBaseline: 'middle',
          },
          columnsCfg: Object.fromEntries(sheetMetadata.columns.map((column) => [column.columnIndex, column.title])),
        })
        worksheet.customizeRowHeader({
          headerStyle: {
            backgroundColor: '#f3f3f3',
            borderColor: '#ededed',
            fontColor: '#7c7c7c',
            fontFamily: 'InterVariable, Inter, sans-serif',
            fontSize: 12,
            textAlign: 'center',
            textBaseline: 'middle',
          },
        })
      }
    }
    headerSetupFrame = window.requestAnimationFrame(initializeHeaders)

    univerAPI
      .createSubmenu({ id: 'verde.inventory.tools', title: 'Tools', tooltip: 'Inventory workbook tools' })
      .addSubmenu(
        univerAPI.createMenu({
          id: 'verde.inventory.tools.save',
          title: 'Save changes',
          action: () => toolbarActionsRef.current.save(),
        }),
      )
      .addSubmenu(
        univerAPI.createMenu({
          id: 'verde.inventory.tools.refresh',
          title: 'Refresh workbook',
          action: () => toolbarActionsRef.current.refresh(),
        }),
      )
      .appendTo('ribbon.start.others')

    const imagePreviewCells = getImagePreviewCells(workbookData)
    imagePreviewCellsRef.current = new Map(imagePreviewCells.map((cell) => [getImagePreviewCellKey(cell), cell]))
    publishedToggleCellsRef.current = new Set(getPublishedToggleCells(workbookData).map(getPublishedToggleCellKey))
    updatedAtCellsRef.current = new Set(getUpdatedAtCells(workbookData).map(getDateTimeCellKey))
    imagePreviewUrlsRef.current = new Map(imagePreviewCells.map((cell) => [getImagePreviewCellKey(cell), cell.imageUrl]))

    disposables.push(
      univerAPI.getSheetHooks().onCellRender([
        {
          drawWith: (context, info) => {
            const cellKey = getImagePreviewCellKey({ sheetId: info.subUnitId, rowIndex: info.row, columnIndex: info.col })
            const value = info.data?.v

            if (publishedToggleCellsRef.current.has(cellKey)) {
              drawPublishedToggle(context, info.primaryWithCoord, isPublishedToggleEnabled(value))
              return
            }

            if (updatedAtCellsRef.current.has(cellKey)) {
              drawInventoryDateTime(context, info.primaryWithCoord, value)
              return
            }

            if (imagePreviewCellsRef.current.has(cellKey)) {
              const imageUrl = stagedImagePreviewUrlsRef.current.get(cellKey) ?? (typeof value === 'string' ? value.trim() : '')
              const image = imagePreviewCacheRef.current.get(imageUrl, refreshActiveImagePreviewCanvas)
              drawImagePreview(context, info.primaryWithCoord, image)
            }
          },
        },
      ]),
    )

    if (typeof eventApi.addEvent === 'function') {
      if (eventApi.Event?.SheetValueChanged) {
        disposables.push(
          eventApi.addEvent(eventApi.Event.SheetValueChanged, (event) => {
            void rebuildDirtyRowsFromRuntime()
            invalidateAffectedImagePreviews(event as SheetValueChangedEvent)
          }),
        )
      }

      if (eventApi.Event?.BeforeSheetEditStart) {
        disposables.push(
          eventApi.addEvent(eventApi.Event.BeforeSheetEditStart, (event) => {
            const cellEvent = event as BeforeSheetEditStartEvent
            const cellKey = getPublishedToggleCellKey({
              sheetId: cellEvent.worksheet.getSheetId(),
              rowIndex: cellEvent.row,
              columnIndex: cellEvent.column,
            })
            if (
              publishedToggleCellsRef.current.has(cellKey) ||
              updatedAtCellsRef.current.has(cellKey) ||
              imagePreviewCellsRef.current.has(cellKey)
            ) {
              cellEvent.cancel = true
            }
          }),
        )
      }

      if (eventApi.Event?.CellClicked) {
        disposables.push(
          eventApi.addEvent(eventApi.Event.CellClicked, (event) => {
            const cellEvent = event as CellClickedEvent
            const cellKey = getPublishedToggleCellKey({
              sheetId: cellEvent.worksheet.getSheetId(),
              rowIndex: cellEvent.row,
              columnIndex: cellEvent.column,
            })

            if (publishedToggleCellsRef.current.has(cellKey)) {
              const range = cellEvent.worksheet.getRange(cellEvent.row, cellEvent.column)
              range.setValue(!isPublishedToggleEnabled(range.getValue()))
              return
            }

            const previewCell = imagePreviewCellsRef.current.get(cellKey)
            if (!previewCell) {
              return
            }

            const value = cellEvent.worksheet.getRange(cellEvent.row, cellEvent.column).getValue()
            setImageUrlEditorTarget({ ...previewCell, imageUrl: typeof value === 'string' ? value : '' })
          }),
        )
      }
    }

    return () => {
      if (headerSetupFrame !== undefined) {
        window.cancelAnimationFrame(headerSetupFrame)
      }
      imagePreviewCellsRef.current.clear()
      publishedToggleCellsRef.current.clear()
      updatedAtCellsRef.current.clear()
      imagePreviewUrlsRef.current.clear()
      imagePreviewCache.clear()
      for (const disposable of disposables) {
        disposable.dispose()
      }
      activeWorkbookRef.current = null
      univerAPIRef.current = null
      univerAPI.dispose()
      univer.dispose()
      container.replaceChildren()
    }
  }, [invalidateAffectedImagePreviews, isInventoryGridFullscreen, rebuildDirtyRowsFromRuntime, refreshActiveImagePreviewCanvas, workbook, workbookData])

  const handleApplyImageUrl = useCallback(
    async (target: ImageUrlEditorTarget, imageUrl: string) => {
      const worksheet = univerAPIRef.current?.getActiveWorkbook()?.getSheetBySheetId(target.sheetId)
      if (!worksheet) {
        return
      }

      const cellKey = getImagePreviewCellKey(target)
      imagePreviewCacheRef.current.invalidate(imagePreviewUrlsRef.current.get(cellKey))
      imagePreviewCacheRef.current.invalidate(imageUrl)
      imagePreviewUrlsRef.current.set(cellKey, imageUrl)
      worksheet.getRange(target.rowIndex, target.columnIndex).setValue(imageUrl)
      worksheet.refreshCanvas()
      setImageUrlEditorTarget(null)
    },
    [],
  )

  const handleStageImage = useCallback(
    async (target: ImageUrlEditorTarget, image: File) => {
      const cellKey = getImagePreviewCellKey(target)
      const existing = stagedImageUploadsRef.current.get(cellKey)
      if (existing) {
        URL.revokeObjectURL(existing.previewUrl)
      }

      const previewUrl = URL.createObjectURL(image)
      stagedImageUploadsRef.current.set(cellKey, { target, image, previewUrl })
      stagedImagePreviewUrlsRef.current.set(cellKey, previewUrl)
      setStagedImageUploadCount(stagedImageUploadsRef.current.size)
      setStagedImageUploadError(null)
      univerAPIRef.current?.getActiveWorkbook()?.getSheetBySheetId(target.sheetId)?.refreshCanvas()
      setImageUrlEditorTarget(null)
    },
    [],
  )

  const uploadStagedImagesForManualSave = useCallback(async () => {
    const stagedUploads = [...stagedImageUploadsRef.current.entries()]
    if (stagedUploads.length === 0) {
      return
    }

    setIsSavingStagedImages(true)
    try {
      for (const [cellKey, stagedUpload] of stagedUploads) {
        const { imageUrl } = await uploadInventoryWorkbookImageMutation.mutateAsync({
          rowToken: stagedUpload.target.rowToken,
          image: stagedUpload.image,
        })

        stagedImageUploadsRef.current.delete(cellKey)
        stagedImagePreviewUrlsRef.current.delete(cellKey)
        URL.revokeObjectURL(stagedUpload.previewUrl)
        setStagedImageUploadCount(stagedImageUploadsRef.current.size)
        await handleApplyImageUrl(stagedUpload.target, imageUrl)
      }

      setStagedImageUploadCount(stagedImageUploadsRef.current.size)
    } finally {
      setIsSavingStagedImages(false)
    }
  }, [handleApplyImageUrl, uploadInventoryWorkbookImageMutation])

  const flushDeltaSave = useCallback(
    async (saveMode: 'manual' | 'autosave') => {
      const hasStagedImages = stagedImageUploadsRef.current.size > 0
      if (!workbookData || (dirtyRows.size === 0 && !hasStagedImages) || (hasConflict && saveMode === 'autosave')) {
        return null
      }

      if (saveInFlightRef.current) {
        queuedAutosaveRef.current = true
        return null
      }

      saveInFlightRef.current = true
      setSaveResult(null)

      try {
        if (saveMode === 'manual' && hasStagedImages) {
          await uploadStagedImagesForManualSave()
        }

        const currentDirtyRows = hasStagedImages ? await rebuildDirtyRowsFromRuntime() : dirtyRows
        if (currentDirtyRows.size === 0) {
          return null
        }

        const clientMutationId = `inventory-workbook-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const changes = [...currentDirtyRows.values()]
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
    [
      dirtyRows,
      hasConflict,
      inventoryWorkbookQuery,
      rebuildDirtyRowsFromRuntime,
      saveWorkbookChangesMutation,
      uploadStagedImagesForManualSave,
      workbookData,
    ],
  )

  useEffect(() => {
    if (!AUTOSAVE_ENABLED || dirtyRows.size === 0 || stagedImageUploadCount > 0 || hasConflict) {
      return
    }

    const timeout = window.setTimeout(() => {
      void flushDeltaSave('autosave')
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [dirtyRows, flushDeltaSave, hasConflict, stagedImageUploadCount])

  const handleSave = useCallback(async () => {
    setStagedImageUploadError(null)
    try {
      await flushDeltaSave('manual')
    } catch (error) {
      setStagedImageUploadError(error)
    }
  }, [flushDeltaSave])

  useEffect(() => {
    toolbarActionsRef.current = {
      refresh: () => {
        if (!inventoryWorkbookQuery.isFetching && !saveWorkbookChangesMutation.isPending && stagedImageUploadCount === 0 && dirtyCellCount === 0) {
          void inventoryWorkbookQuery.refetch()
        }
      },
      save: () => {
        if (workbookData && (dirtyCellCount > 0 || stagedImageUploadCount > 0) && !saveWorkbookChangesMutation.isPending && !isSavingStagedImages && !inventoryWorkbookQuery.isFetching) {
          void handleSave()
        }
      },
    }
  }, [
    dirtyCellCount,
    handleSave,
    inventoryWorkbookQuery,
    isSavingStagedImages,
    saveWorkbookChangesMutation.isPending,
    stagedImageUploadCount,
    workbookData,
  ])

  const isSaving = saveWorkbookChangesMutation.isPending || isSavingStagedImages
  const saveButtonText = isSaving
    ? 'Saving...'
    : dirtyCellCount > 0 || stagedImageUploadCount > 0
      ? `Save ${dirtyRowCount} row${dirtyRowCount === 1 ? '' : 's'} / ${dirtyCellCount} cell${dirtyCellCount === 1 ? '' : 's'}${stagedImageUploadCount > 0 ? ` · ${stagedImageUploadCount} image${stagedImageUploadCount === 1 ? '' : 's'} staged` : ''}`
      : 'Saved'

  const statusText = isSaving
    ? 'Saving'
    : hasConflict
      ? 'Conflict'
      : saveWorkbookChangesMutation.isError
        ? 'Save failed'
        : dirtyCellCount > 0 || stagedImageUploadCount > 0
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
              disabled={inventoryWorkbookQuery.isFetching || isSaving || stagedImageUploadCount > 0 || dirtyCellCount > 0}
              onClick={() => void inventoryWorkbookQuery.refetch()}
            >
              <RefreshCw className={cn('size-4', inventoryWorkbookQuery.isFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              type="button"
              disabled={!workbookData || (dirtyCellCount === 0 && stagedImageUploadCount === 0) || isSaving || inventoryWorkbookQuery.isFetching}
              onClick={() => void handleSave()}
            >
              <Save className={cn('size-4', isSaving && 'animate-pulse')} />
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
      {stagedImageUploadError ? <InventoryGridSaveError error={stagedImageUploadError} /> : null}
      {saveResult ? <InventoryGridSaveSummary result={saveResult} /> : null}

      <ImageUrlEditorDialog
        target={imageUrlEditorTarget}
        onStage={handleStageImage}
        onClose={() => setImageUrlEditorTarget(null)}
      />

      {workbookData && !inventoryWorkbookQuery.isError ? (
        <div ref={inventoryGridCardRef} className="inventory-grid-workspace inventory-grid-card overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-text-primary">{workbookName}</h2>
              <p className="text-sm text-text-secondary">
                {productCount ?? 0} products · {sheetCount} workbook sheet{sheetCount === 1 ? '' : 's'} · {statusText}
                {dirtyCellCount > 0 ? ` · ${dirtyRowCount} changed rows / ${dirtyCellCount} cells` : ''}
                {AUTOSAVE_ENABLED ? ' · autosave on' : ''}
              </p>
            </div>
            <div className="flex w-fit items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-text-secondary">
                Univer workbook
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={isInventoryGridFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                onClick={() => void handleFullscreenToggle()}
              >
                {isInventoryGridFullscreen ? <Minimize2 /> : <Maximize2 />}
                {isInventoryGridFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              </Button>
            </div>
          </div>

          {fullscreenError ? (
            <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {fullscreenError}
            </div>
          ) : null}

          {workbook ? (
            <div className="inventory-grid-host h-[72vh] min-h-[560px] overflow-hidden bg-white">
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
