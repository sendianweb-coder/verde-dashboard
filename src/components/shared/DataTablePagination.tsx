import type { Table } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions?: number[]
  resultsLabel?: string
  totalResults?: number
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [5, 10, 20, 50],
  resultsLabel = 'records',
  totalResults,
}: DataTablePaginationProps<TData>) {
  const {
    pageIndex,
    pageSize,
  } = table.getState().pagination
  const totalRows = totalResults ?? table.getFilteredRowModel().rows.length
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className="flex flex-col gap-4 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
        <span>
          {totalRows === 0 ? `0 ${resultsLabel}` : `Showing ${from} to ${to} of ${totalRows} ${resultsLabel}`}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
            <SelectTrigger className="h-8 w-[72px] rounded-md shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 shadow-none"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 shadow-none"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-2 text-sm tabular-nums text-text-primary">
          {pageIndex + 1} / {table.getPageCount() || 1}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 shadow-none"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Go to next page"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 shadow-none"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          aria-label="Go to last page"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
