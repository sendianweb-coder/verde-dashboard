import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { Search } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { DataTablePagination } from './DataTablePagination'

interface DataTableProps<TData> {
  data: TData[]
  columns: Array<ColumnDef<TData>>
  title?: string
  description?: string
  resultsLabel?: string
  isLoading?: boolean
  hasError?: boolean
  errorTitle?: string
  errorDescription?: string
  emptyTitle?: string
  emptyDescription?: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  enableSearch?: boolean
  enableRowSelection?: boolean
  filters?: ReactNode
  actions?: ReactNode
  pageSizeOptions?: number[]
  initialPageSize?: number
  hidePagination?: boolean
  manualPagination?: boolean
  pageIndex?: number
  pageSize?: number
  pageCount?: number
  totalResults?: number
  onPageChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
  getRowId?: (originalRow: TData, index: number) => string
  onRowClick?: (row: TData) => void
  sorting?: SortingState
  onSortingChange?: (updater: SortingState | ((old: SortingState) => SortingState)) => void
}

export function DataTable<TData>({
  data,
  columns,
  title,
  description,
  resultsLabel = 'records',
  isLoading = false,
  hasError = false,
  errorTitle = 'Unable to load records',
  errorDescription = 'Please refresh the page and try again.',
  emptyTitle = 'No records found',
  emptyDescription = 'Try changing your filters or come back later.',
  searchPlaceholder = 'Search here...',
  searchValue,
  onSearchChange,
  enableSearch = true,
  enableRowSelection = false,
  filters,
  actions,
  pageSizeOptions,
  initialPageSize = 10,
  hidePagination = false,
  manualPagination = false,
  pageIndex,
  pageSize,
  pageCount,
  totalResults,
  onPageChange,
  onPageSizeChange,
  getRowId,
  onRowClick,
  sorting: propSorting,
  onSortingChange: propOnSortingChange,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const sorting = propSorting ?? internalSorting
  const setSorting = propOnSortingChange ?? setInternalSorting
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  const activeSearchValue = searchValue ?? globalFilter
  const activePagination = {
    pageIndex: pageIndex ?? pagination.pageIndex,
    pageSize: pageSize ?? pagination.pageSize,
  }

  const tableColumns = useMemo<Array<ColumnDef<TData>>>(() => {
    if (!enableRowSelection) {
      return columns
    }

    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all rows"
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        enableHiding: false,
        enableSorting: false,
      },
      ...columns,
    ]
  }, [columns, enableRowSelection])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      globalFilter: activeSearchValue,
      rowSelection,
      pagination: activePagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: (value) => {
      const nextValue = typeof value === 'function' ? value(activeSearchValue) : value
      setGlobalFilter(String(nextValue))
      if (onSearchChange) {
        onSearchChange(String(nextValue))
        return
      }
    },
    onPaginationChange: (updater) => {
      const nextPagination = typeof updater === 'function' ? updater(activePagination) : updater
      setPagination(nextPagination)

      if (nextPagination.pageIndex !== activePagination.pageIndex) {
        onPageChange?.(nextPagination.pageIndex)
      }

      if (nextPagination.pageSize !== activePagination.pageSize) {
        onPageSizeChange?.(nextPagination.pageSize)
      }
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualFiltering: Boolean(onSearchChange),
    manualPagination,
    pageCount,
    enableRowSelection,
    getRowId,
  })

  const hasToolbar = Boolean(title || description || enableSearch || filters || actions)
  const rows = table.getRowModel().rows

  return (
    <section>
      <div className="overflow-hidden rounded-xl border border-border bg-surface-raised">
        {hasToolbar ? (
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            {title || description ? (
              <div className="min-w-0">
                {title ? <h3 className="text-base font-medium text-text-primary">{title}</h3> : null}
                {description ? <p className="mt-0.5 text-sm text-text-secondary">{description}</p> : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {enableSearch ? (
                <div className="relative w-full sm:w-[220px]">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    aria-label="Search table"
                    placeholder={searchPlaceholder}
                    value={activeSearchValue}
                    onChange={(event) => table.setGlobalFilter(event.target.value)}
                    className="h-9 bg-surface pl-8 text-sm shadow-none"
                  />
                </div>
              ) : null}
              {filters}
              {actions}
            </div>
          </div>
        ) : null}

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-surface hover:bg-surface">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-left"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24">
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            ) : hasError ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="px-4 py-2">
                  <EmptyState title={errorTitle} description={errorDescription} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="px-4 py-2">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={cn(onRowClick && 'cursor-pointer')}
                  onClick={() => {
                    if (onRowClick) {
                      onRowClick(row.original)
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {hidePagination ? null : (
          <DataTablePagination
            table={table}
            pageSizeOptions={pageSizeOptions}
            resultsLabel={resultsLabel}
            totalResults={totalResults}
          />
        )}
      </div>
    </section>
  )
}
