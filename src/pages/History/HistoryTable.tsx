import { Table }  from '../../components/ui/Table'
import type { Weighing, WeighingsSummary } from '../../types'

interface HistoryTableProps {
  rows:    Weighing[]
  total:   number
  summary: WeighingsSummary[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-PA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

const columns = [
  { key: 'capturedAt',    header: 'Fecha/Hora',  render: (r: Weighing) => formatDate(r.capturedAt) },
  { key: 'warehouseName', header: 'Almacén',      render: (r: Weighing) => (
    <span className="text-xs">{r.warehouseName}</span>
  )},
  { key: 'productName',   header: 'Producto',     render: (r: Weighing) => (
    <span title={r.productName}>{r.productCode} — {r.productName}</span>
  )},
  { key: 'weightKg',      header: 'Peso (kg)', align: 'right' as const,
    render: (r: Weighing) => (
      <span className="font-mono font-semibold text-green-400">{Number(r.weightKg).toFixed(3)}</span>
    )},
  { key: 'mode', header: 'Modo', render: (r: Weighing) => (
    <span className={`text-xs font-medium ${r.mode === 'SESSION' ? 'text-blue-400' : 'text-gray-400'}`}>
      {r.mode}
    </span>
  )},
]

export function HistoryTable({ rows, total, summary }: HistoryTableProps) {
  const grandTotal = summary.reduce((s, x) => s + Number(x.totalKg), 0)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {summary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {summary.map((s) => (
            <div key={s.productId} className="bg-gray-900 rounded-xl border border-gray-800 p-3">
              <p className="text-xs text-gray-500 truncate" title={s.productName}>{s.productName}</p>
              <p className="text-lg font-mono font-bold text-white mt-1">{Number(s.totalKg).toFixed(1)}</p>
              <p className="text-xs text-gray-500">kg — {s.count} pesajes</p>
            </div>
          ))}
          <div className="bg-brand-900/30 rounded-xl border border-brand-700/50 p-3">
            <p className="text-xs text-brand-400">TOTAL GENERAL</p>
            <p className="text-lg font-mono font-bold text-white mt-1">{grandTotal.toFixed(1)}</p>
            <p className="text-xs text-brand-400">{total} registros</p>
          </div>
        </div>
      )}

      {/* Data table */}
      <Table
        columns={columns}
        data={rows}
        keyExtract={(r) => r.id}
        emptyText="No hay registros para los filtros seleccionados"
      />
    </div>
  )
}
