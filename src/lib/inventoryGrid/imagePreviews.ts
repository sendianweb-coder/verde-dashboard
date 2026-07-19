import type { InventoryWorkbookResponse, UniverCellPrimitive } from '@/types/inventoryWorkbook'

export const IMAGE_PREVIEW_LAYOUT = {
  size: 36,
  padding: 4,
} as const

const MAX_CACHED_IMAGES = 100

export type ImagePreviewCell = {
  sheetId: string
  rowIndex: number
  columnIndex: number
  rowToken: string
  imageUrl: string
}

type ImagePreviewCacheEntry = {
  image: HTMLImageElement
  status: 'loading' | 'ready' | 'error'
  refreshCallbacks: Set<() => void>
}

export const getImagePreviewCellKey = ({ sheetId, rowIndex, columnIndex }: Pick<ImagePreviewCell, 'sheetId' | 'rowIndex' | 'columnIndex'>) =>
  `${sheetId}:${rowIndex}:${columnIndex}`

export const isHttpImageUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.trim() === '') {
    return false
  }

  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'blob:'
  } catch {
    return false
  }
}

export const getImagePreviewCells = (workbookData?: InventoryWorkbookResponse): ImagePreviewCell[] => {
  if (!workbookData) {
    return []
  }

  const cells: ImagePreviewCell[] = []

  for (const sheetMetadata of workbookData.metadata.sheets) {
    const imageUrlColumn = sheetMetadata.columns.find((column) => column.key === 'imageUrl')
    const sheet = workbookData.workbook.sheets[sheetMetadata.sheetId]

    if (!imageUrlColumn || !sheet) {
      continue
    }

    for (const rowIndexText of Object.keys(sheetMetadata.rowIdentities ?? {})) {
      const rowIndex = Number(rowIndexText)
      if (!Number.isInteger(rowIndex)) {
        continue
      }

      const rowToken = sheetMetadata.rowIdentities?.[rowIndex]
      if (!rowToken) {
        continue
      }

      const value = sheet.cellData[rowIndex]?.[imageUrlColumn.columnIndex]?.v as UniverCellPrimitive | undefined
      cells.push({
        sheetId: sheetMetadata.sheetId,
        rowIndex,
        columnIndex: imageUrlColumn.columnIndex,
        rowToken,
        imageUrl: typeof value === 'string' ? value.trim() : '',
      })
    }
  }

  return cells
}

export class ImagePreviewCache {
  private readonly entries = new Map<string, ImagePreviewCacheEntry>()

  get(url: string, onSettled: () => void): ImagePreviewCacheEntry | undefined {
    if (!isHttpImageUrl(url)) {
      return undefined
    }

    const existing = this.entries.get(url)
    if (existing) {
      this.entries.delete(url)
      this.entries.set(url, existing)
      if (existing.status === 'loading') {
        existing.refreshCallbacks.add(onSettled)
      }
      return existing
    }

    const image = new Image()
    const entry: ImagePreviewCacheEntry = {
      image,
      status: 'loading',
      refreshCallbacks: new Set([onSettled]),
    }

    const settle = (status: ImagePreviewCacheEntry['status']) => {
      entry.status = status
      for (const refresh of entry.refreshCallbacks) {
        refresh()
      }
      entry.refreshCallbacks.clear()
    }

    image.onload = () => settle('ready')
    image.onerror = () => settle('error')
    image.src = url
    this.entries.set(url, entry)
    this.trim()

    return entry
  }

  invalidate(url: string | undefined) {
    if (url) {
      this.entries.delete(url)
    }
  }

  clear() {
    this.entries.clear()
  }

  private trim() {
    while (this.entries.size > MAX_CACHED_IMAGES) {
      const oldestUrl = this.entries.keys().next().value
      if (!oldestUrl) {
        return
      }
      this.entries.delete(oldestUrl)
    }
  }
}

export const drawImagePreview = (
  context: CanvasRenderingContext2D,
  cell: { startX: number; startY: number; endX: number; endY: number },
  entry: ImagePreviewCacheEntry | undefined,
) => {
  const width = cell.endX - cell.startX
  const height = cell.endY - cell.startY
  const previewSize = Math.min(IMAGE_PREVIEW_LAYOUT.size, width - IMAGE_PREVIEW_LAYOUT.padding * 2, height - IMAGE_PREVIEW_LAYOUT.padding * 2)
  const x = cell.startX + (width - previewSize) / 2
  const y = cell.startY + (height - previewSize) / 2

  context.clearRect(cell.startX + 1, cell.startY + 1, Math.max(width - 2, 0), Math.max(height - 2, 0))
  context.fillStyle = '#f3f4f6'
  context.fillRect(x, y, previewSize, previewSize)
  context.strokeStyle = '#e5e7eb'
  context.strokeRect(x + 0.5, y + 0.5, Math.max(previewSize - 1, 0), Math.max(previewSize - 1, 0))

  if (entry?.status !== 'ready' || entry.image.naturalWidth === 0 || entry.image.naturalHeight === 0) {
    context.strokeStyle = '#9ca3af'
    context.beginPath()
    context.moveTo(x + previewSize * 0.24, y + previewSize * 0.7)
    context.lineTo(x + previewSize * 0.43, y + previewSize * 0.5)
    context.lineTo(x + previewSize * 0.58, y + previewSize * 0.64)
    context.lineTo(x + previewSize * 0.76, y + previewSize * 0.42)
    context.stroke()
    return
  }

  const scale = Math.min(previewSize / entry.image.naturalWidth, previewSize / entry.image.naturalHeight)
  const imageWidth = entry.image.naturalWidth * scale
  const imageHeight = entry.image.naturalHeight * scale
  context.drawImage(entry.image, x + (previewSize - imageWidth) / 2, y + (previewSize - imageHeight) / 2, imageWidth, imageHeight)
}
