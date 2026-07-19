import type { InventoryWorkbookResponse } from '@/types/inventoryWorkbook'

export type DateTimeCell = {
  sheetId: string
  rowIndex: number
  columnIndex: number
}

export const getDateTimeCellKey = ({ sheetId, rowIndex, columnIndex }: DateTimeCell) =>
  `${sheetId}:${rowIndex}:${columnIndex}`

export const getUpdatedAtCells = (workbookData?: InventoryWorkbookResponse): DateTimeCell[] => {
  if (!workbookData) {
    return []
  }

  const cells: DateTimeCell[] = []

  for (const sheetMetadata of workbookData.metadata.sheets) {
    const updatedAtColumn = sheetMetadata.columns.find((column) => column.key === 'updatedAt')
    if (!updatedAtColumn) {
      continue
    }

    for (const rowIndexText of Object.keys(sheetMetadata.rowIdentities ?? {})) {
      const rowIndex = Number(rowIndexText)
      if (Number.isInteger(rowIndex)) {
        cells.push({ sheetId: sheetMetadata.sheetId, rowIndex, columnIndex: updatedAtColumn.columnIndex })
      }
    }
  }

  return cells
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export const formatInventoryDateTime = (value: unknown) => {
  const date = value instanceof Date ? value : new Date(typeof value === 'string' || typeof value === 'number' ? value : '')
  return Number.isNaN(date.getTime()) ? String(value ?? '') : dateTimeFormatter.format(date)
}

export const drawInventoryDateTime = (
  context: CanvasRenderingContext2D,
  cell: { startX: number; startY: number; endX: number; endY: number },
  value: unknown,
) => {
  const width = cell.endX - cell.startX
  const height = cell.endY - cell.startY

  context.clearRect(cell.startX + 1, cell.startY + 1, Math.max(width - 2, 0), Math.max(height - 2, 0))
  context.save()
  context.beginPath()
  context.rect(cell.startX + 4, cell.startY + 1, Math.max(width - 8, 0), Math.max(height - 2, 0))
  context.clip()
  context.fillStyle = '#525252'
  context.font = '12px InterVariable, Inter, sans-serif'
  context.textAlign = 'left'
  context.textBaseline = 'middle'
  context.fillText(formatInventoryDateTime(value), cell.startX + 6, cell.startY + height / 2)
  context.restore()
}
