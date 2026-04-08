"use client";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  className?: string;
  headerClassName?: string;
  cell: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  emptyHint?: string;
  loading?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyHint = "暂无数据",
  loading = false,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-100 bg-zinc-50/80 text-zinc-500">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide ${col.headerClassName ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-zinc-400">
                加载中…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-zinc-400">
                {emptyHint}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={String(getRowKey(row))} className="hover:bg-zinc-50/80">
                {columns.map((col) => (
                  <td key={col.id} className={`px-3 py-2.5 text-zinc-800 ${col.className ?? ""}`}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
