export type UniverCellPrimitive = string | number | boolean | null

export interface UniverCellData {
  v?: UniverCellPrimitive
  s?: string
  t?: number
  f?: string
  si?: string
  [key: string]: unknown
}

export interface UniverDimensionData {
  h?: number
  w?: number
  hd?: number
  [key: string]: unknown
}

export interface UniverWorksheetSnapshot {
  id: string
  name: string
  hidden?: number
  freeze?: {
    xSplit?: number
    ySplit?: number
    startRow?: number
    startColumn?: number
    [key: string]: unknown
  }
  rowCount: number
  columnCount: number
  defaultColumnWidth?: number
  defaultRowHeight?: number
  mergeData?: unknown[]
  cellData: Record<string, Record<string, UniverCellData>>
  rowData?: Record<string, UniverDimensionData>
  columnData?: Record<string, UniverDimensionData>
  rowHeader?: { width?: number; [key: string]: unknown }
  columnHeader?: { height?: number; [key: string]: unknown }
  showGridlines?: number
  rightToLeft?: number
  [key: string]: unknown
}

export interface UniverWorkbookSnapshot {
  id: string
  name: string
  appVersion: string
  locale: string
  styles: Record<string, unknown>
  sheetOrder: string[]
  sheets: Record<string, UniverWorksheetSnapshot>
  resources?: Array<Record<string, unknown>>
  [key: string]: unknown
}

export type InventoryWorkbookColumnType = 'text' | 'numeric' | 'checkbox' | 'calendar'

export interface InventoryWorkbookColumnMetadata {
  key: string
  title: string
  type: InventoryWorkbookColumnType
  width: number
  readOnly: boolean
  required?: boolean
  productField?: string
  columnIndex: number
}

export interface InventoryWorkbookCategoryMetadata {
  id: string
  name: string
  parentId: string | null
}

export interface InventoryWorkbookSheetMetadata {
  sheetId: string
  categoryId: string
  categoryName: string
  headerRowIndex: number
  firstDataRowIndex: number
  productIdColumnIndex: number
  columns: InventoryWorkbookColumnMetadata[]
}

export interface InventoryWorkbookMetadata {
  scope: 'category' | 'workbook'
  generatedAt: string
  category?: InventoryWorkbookCategoryMetadata
  sheets: InventoryWorkbookSheetMetadata[]
}

export interface InventoryWorkbookResponse {
  workbook: UniverWorkbookSnapshot
  metadata: InventoryWorkbookMetadata
}
