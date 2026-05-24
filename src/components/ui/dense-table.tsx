"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DenseTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  bulkActions?: React.ReactNode | ((selectedCount: number) => React.ReactNode);
  className?: string;
  emptyMessage?: string;
  enableRowSelection?: boolean;
  isLoading?: boolean;
  labels?: {
    rows: string;
    selected: string;
    previousPage: string;
    nextPage: string;
  };
  pageSize?: number;
  searchKey?: string;
  searchPlaceholder?: string;
};

function DenseTable<TData>({
  columns,
  data,
  bulkActions,
  className,
  enableRowSelection = false,
  emptyMessage = "No results.",
  isLoading = false,
  labels = {
    nextPage: "Next page",
    previousPage: "Previous page",
    rows: "rows",
    selected: "selected",
  },
  pageSize = 10,
  searchKey,
  searchPlaceholder = "Search...",
}: DenseTableProps<TData>) {
  "use no memo";

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // TanStack Table intentionally returns callable table APIs for render orchestration.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    enableRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const visibleColumns = table.getVisibleLeafColumns();
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className={cn("space-y-3", className)}>
      {searchKey ? (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
          />
        </div>
      ) : null}

      {enableRowSelection && selectedCount > 0 && bulkActions ? (
        <div className="flex flex-col gap-2 rounded-lg border border-primary-border bg-primary-soft px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-secondary-foreground">
            {selectedCount} {labels.selected}
          </p>
          <div className="flex flex-wrap gap-2">
            {typeof bulkActions === "function"
              ? bulkActions(selectedCount)
              : bulkActions}
          </div>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {enableRowSelection ? (
                <TableHead className="w-10">
                  <input
                    aria-label={labels.selected}
                    checked={table.getIsAllPageRowsSelected()}
                    className="size-4 rounded border-border accent-primary"
                    onChange={table.getToggleAllPageRowsSelectedHandler()}
                    type="checkbox"
                  />
                </TableHead>
              ) : null}
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <button
                      className="inline-flex items-center gap-1.5 text-left"
                      disabled={!header.column.getCanSort()}
                      onClick={header.column.getToggleSortingHandler()}
                      type="button"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() ? (
                        <SortIcon direction={header.column.getIsSorted()} />
                      ) : null}
                    </button>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: Math.min(pageSize, 8) }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`}>
                {enableRowSelection ? (
                  <TableCell>
                    <Skeleton className="size-4" />
                  </TableCell>
                ) : null}
                {visibleColumns.map((column) => (
                  <TableCell key={column.id}>
                    <Skeleton className="h-4 w-full max-w-28" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
                {enableRowSelection ? (
                  <TableCell>
                    <input
                      aria-label={labels.selected}
                      checked={row.getIsSelected()}
                      className="size-4 rounded border-border accent-primary"
                      onChange={row.getToggleSelectedHandler()}
                      type="checkbox"
                    />
                  </TableCell>
                ) : null}
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={visibleColumns.length + (enableRowSelection ? 1 : 0)}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} {labels.rows}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={labels.previousPage}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-18 text-center text-xs text-muted-foreground">
            {table.getState().pagination.pageIndex + 1} /{" "}
            {Math.max(table.getPageCount(), 1)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label={labels.nextPage}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SortIcon({
  direction,
}: Readonly<{
  direction: false | "asc" | "desc";
}>) {
  if (direction === "asc") {
    return <ArrowUp className="size-3" aria-hidden="true" />;
  }

  if (direction === "desc") {
    return <ArrowDown className="size-3" aria-hidden="true" />;
  }

  return <ArrowUpDown className="size-3 opacity-50" aria-hidden="true" />;
}

export { DenseTable };
export type { DenseTableProps };
