import React from 'react'

interface Column<T> {
  key:       string
  header:    string
  render?:   (row: T) => React.ReactNode
  align?:    'left' | 'center' | 'right'
  className?: string
}

interface TableProps<T> {
  columns:    Column<T>[]
  data:       T[]
  keyExtract: (row: T) => string | number
  emptyText?: string
  footer?:    React.ReactNode
  compact?:   boolean
}

export function Table<T>({
  columns,
  data,
  keyExtract,
  emptyText = 'Sin registros',
  footer,
  compact = false,
}: TableProps<T>) {
  const cellPad = compact ? 'px-3 py-2' : 'px-4 py-3'

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${cellPad} text-xs font-semibold text-gray-400 uppercase tracking-wider text-${col.align ?? 'left'} ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-gray-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtract(row)}
                className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${cellPad} text-gray-200 text-${col.align ?? 'left'} ${col.className ?? ''}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="border-t border-gray-600 bg-gray-800/80">{footer}</tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
