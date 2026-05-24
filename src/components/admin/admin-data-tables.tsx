"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { AdminActionButton } from "@/components/admin/admin-action-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { DenseTable } from "@/components/ui/dense-table";
import type {
  AdminCustomerRow,
  AdminInventoryRow,
  AdminOrderRow,
  AdminProductRow,
} from "@/lib/admin-data";
import type { Dictionary } from "@/types";

type AdminTableProps<TData> = Readonly<{
  copy: Dictionary["admin"];
  data: TData[];
}>;

export function AdminProductsTable({
  copy,
  data,
}: AdminTableProps<AdminProductRow>) {
  const columns: ColumnDef<AdminProductRow, unknown>[] = [
    {
      accessorKey: "sku",
      header: copy.table.columns.sku,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold">{row.original.sku}</span>
      ),
    },
    {
      accessorKey: "name",
      header: copy.table.columns.name,
      cell: ({ row }) => (
        <span className="block max-w-64 truncate">{row.original.name}</span>
      ),
    },
    { accessorKey: "brand", header: copy.table.columns.brand },
    {
      accessorKey: "quality",
      header: copy.table.columns.quality,
      cell: ({ row }) => <Badge variant="quality">{row.original.quality}</Badge>,
    },
    {
      accessorKey: "stock",
      header: copy.table.columns.stock,
      cell: ({ row }) => <span className="font-mono">{row.original.stock}</span>,
    },
    { accessorKey: "price", header: copy.table.columns.price },
    {
      accessorKey: "status",
      header: copy.table.columns.status,
      cell: ({ row }) => (
        <StatusBadge labels={copy.status} status={row.original.status} />
      ),
    },
    { accessorKey: "updatedAt", header: copy.table.columns.updatedAt },
    actionColumn<AdminProductRow>(copy),
  ];

  return (
    <DenseTable
      bulkActions={(selectedCount) => bulkActions(copy, selectedCount)}
      columns={columns}
      data={data}
      emptyMessage={copy.table.empty}
      enableRowSelection
      labels={copy.table}
      pageSize={5}
      searchKey="sku"
      searchPlaceholder={copy.table.search}
    />
  );
}

export function AdminOrdersTable({ copy, data }: AdminTableProps<AdminOrderRow>) {
  const columns: ColumnDef<AdminOrderRow, unknown>[] = [
    {
      accessorKey: "id",
      header: copy.table.columns.order,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold">{row.original.id}</span>
      ),
    },
    { accessorKey: "customer", header: copy.table.columns.customer },
    { accessorKey: "total", header: copy.table.columns.total },
    { accessorKey: "items", header: copy.table.columns.items },
    {
      accessorKey: "status",
      header: copy.table.columns.status,
      cell: ({ row }) => (
        <StatusBadge labels={copy.status} status={row.original.status} />
      ),
    },
    {
      accessorKey: "payment",
      header: copy.table.columns.payment,
      cell: ({ row }) => (
        <StatusBadge labels={copy.status} status={row.original.payment} />
      ),
    },
    { accessorKey: "createdAt", header: copy.table.columns.createdAt },
    actionColumn<AdminOrderRow>(copy),
  ];

  return (
    <DenseTable
      bulkActions={(selectedCount) => bulkActions(copy, selectedCount)}
      columns={columns}
      data={data}
      emptyMessage={copy.table.empty}
      enableRowSelection
      labels={copy.table}
      pageSize={5}
      searchKey="id"
      searchPlaceholder={copy.table.search}
    />
  );
}

export function AdminCustomersTable({
  copy,
  data,
}: AdminTableProps<AdminCustomerRow>) {
  const columns: ColumnDef<AdminCustomerRow, unknown>[] = [
    { accessorKey: "name", header: copy.table.columns.name },
    { accessorKey: "email", header: copy.table.columns.email },
    {
      accessorKey: "type",
      header: copy.table.columns.type,
      cell: ({ row }) => (
        <StatusBadge labels={copy.status} status={row.original.type} />
      ),
    },
    {
      accessorKey: "status",
      header: copy.table.columns.status,
      cell: ({ row }) => (
        <StatusBadge labels={copy.status} status={row.original.status} />
      ),
    },
    { accessorKey: "orders", header: copy.table.columns.orders },
    { accessorKey: "revenue", header: copy.table.columns.revenue },
    actionColumn<AdminCustomerRow>(copy),
  ];

  return (
    <DenseTable
      bulkActions={(selectedCount) => bulkActions(copy, selectedCount)}
      columns={columns}
      data={data}
      emptyMessage={copy.table.empty}
      enableRowSelection
      labels={copy.table}
      pageSize={5}
      searchKey="name"
      searchPlaceholder={copy.table.search}
    />
  );
}

export function AdminInventoryTable({
  copy,
  data,
}: AdminTableProps<AdminInventoryRow>) {
  const columns: ColumnDef<AdminInventoryRow, unknown>[] = [
    {
      accessorKey: "sku",
      header: copy.table.columns.sku,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold">{row.original.sku}</span>
      ),
    },
    { accessorKey: "location", header: copy.table.columns.location },
    {
      accessorKey: "available",
      header: copy.table.columns.available,
      cell: ({ row }) => (
        <span className="font-mono">{row.original.available}</span>
      ),
    },
    {
      accessorKey: "reserved",
      header: copy.table.columns.reserved,
      cell: ({ row }) => (
        <span className="font-mono">{row.original.reserved}</span>
      ),
    },
    {
      accessorKey: "status",
      header: copy.table.columns.status,
      cell: ({ row }) => (
        <StatusBadge labels={copy.status} status={row.original.status} />
      ),
    },
    { accessorKey: "updatedAt", header: copy.table.columns.updatedAt },
    actionColumn<AdminInventoryRow>(copy),
  ];

  return (
    <DenseTable
      bulkActions={(selectedCount) => bulkActions(copy, selectedCount)}
      columns={columns}
      data={data}
      emptyMessage={copy.table.empty}
      enableRowSelection
      labels={copy.table}
      pageSize={5}
      searchKey="sku"
      searchPlaceholder={copy.table.search}
    />
  );
}

function actionColumn<TData>(copy: Dictionary["admin"]): ColumnDef<TData, unknown> {
  return {
    id: "actions",
    enableSorting: false,
    header: copy.table.columns.actions,
    cell: () => (
      <div className="flex justify-end gap-1">
        <AdminActionButton action="view" labels={copy.table} variant="ghost">
          {copy.table.view}
        </AdminActionButton>
        <AdminActionButton action="edit" confirm labels={copy.table}>
          {copy.table.edit}
        </AdminActionButton>
      </div>
    ),
  };
}

function bulkActions(copy: Dictionary["admin"], selectedCount: number) {
  return (
    <>
      <AdminActionButton action="export" labels={copy.table}>
        {copy.table.bulkExport}
      </AdminActionButton>
      <AdminActionButton action="sync" confirm labels={copy.table} variant="soft">
        {copy.table.bulkStatus} ({selectedCount})
      </AdminActionButton>
    </>
  );
}
