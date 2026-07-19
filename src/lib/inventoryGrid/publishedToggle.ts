import type { InventoryWorkbookResponse } from '@/types/inventoryWorkbook'

export type PublishedToggleCell = {
  sheetId: string
  rowIndex: number
  columnIndex: number
}

export const getPublishedToggleCellKey = ({ sheetId, rowIndex, columnIndex }: PublishedToggleCell) =>
  `${sheetId}:${rowIndex}:${columnIndex}`

export const isPublishedToggleEnabled = (value: unknown) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') return ['true', '1', 'yes', 'y', 'on'].includes(value.trim().toLowerCase())
  return false
}

export const getPublishedToggleCells = (workbookData?: InventoryWorkbookResponse): PublishedToggleCell[] => {
  if (!workbookData) {
    return []
  }

  const cells: PublishedToggleCell[] = []

  for (const sheetMetadata of workbookData.metadata.sheets) {
    const publishedColumn = sheetMetadata.columns.find((column) => column.key === 'published')
    if (!publishedColumn) {
      continue
    }

    for (const rowIndexText of Object.keys(sheetMetadata.rowIdentities ?? {})) {
      const rowIndex = Number(rowIndexText)
      if (Number.isInteger(rowIndex)) {
        cells.push({ sheetId: sheetMetadata.sheetId, rowIndex, columnIndex: publishedColumn.columnIndex })
      }
    }
  }

  return cells
}

export const drawPublishedToggle = (
  context: CanvasRenderingContext2D,
  cell: { startX: number; startY: number; endX: number; endY: number },
  checked: boolean,
) => {
  const cellWidth = cell.endX - cell.startX
  const cellHeight = cell.endY - cell.startY
  const trackWidth = Math.max(0, Math.min(34, cellWidth - 10))
  const trackHeight = Math.max(0, Math.min(18, cellHeight - 10))
  if (trackWidth < 18 || trackHeight < 12) {
    return
  }

  const x = cell.startX + (cellWidth - trackWidth) / 2
  const y = cell.startY + (cellHeight - trackHeight) / 2
  const radius = trackHeight / 2
  const thumbRadius = Math.max(0, radius - 3)
  const thumbX = checked ? x + trackWidth - radius : x + radius

  context.clearRect(cell.startX + 1, cell.startY + 1, Math.max(cellWidth - 2, 0), Math.max(cellHeight - 2, 0))
  context.fillStyle = checked ? '#16a34a' : '#d4d4d4'
  context.beginPath()
  context.arc(x + radius, y + radius, radius, Math.PI / 2, (Math.PI * 3) / 2)
  context.lineTo(x + trackWidth - radius, y)
  context.arc(x + trackWidth - radius, y + radius, radius, (Math.PI * 3) / 2, Math.PI / 2)
  context.closePath()
  context.fill()

  context.fillStyle = '#ffffff'
  context.beginPath()
  context.arc(thumbX, y + radius, thumbRadius, 0, Math.PI * 2)
  context.fill()
}
