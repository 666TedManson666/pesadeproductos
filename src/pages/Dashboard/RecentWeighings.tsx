import { useSessionStore } from '../../store/session.store'
import { Table } from '../../components/ui/Table'
import type { Weighing } from '../../types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const columns = [
  { key: 'capturedAt', header: 'Hora',    render: (r: Weighing) => formatDate(r.capturedAt) },
  { key: 'productName', header: 'Producto', render: (r: Weighing) => (
    <span title={r.productName} className="block max-w-[180px] truncate">{r.productName}</span>
  )},
  { key: 'weightKg', header: 'Peso (kg)', align: 'right' as const,
    render: (r: Weighing) => (
      <span className="font-mono font-semibold text-green-400">{Number(r.weightKg).toFixed(3)}</span>
    )},
]

export function RecentWeighings() {
  const { recentWeighings, activeSession } = useSessionStore()

  const totalKg = recentWeighings.reduce((sum, w) => sum + Number(w.weightKg), 0)

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300">
          Pesajes Recientes
          {activeSession && (
            <span className="ml-2 text-xs text-gray-500 font-normal">
              — {activeSession.warehouseName}
            </span>
          )}
        </h2>
        <span className="text-xs text-gray-500">{recentWeighings.length} registros</span>
      </div>

      <div className="flex-1 overflow-auto">
        <Table
          columns={columns}
          data={recentWeighings}
          keyExtract={(r) => r.id}
          emptyText="Sin pesajes en esta sesión"
          compact
          footer={
            recentWeighings.length > 0 ? (
              <>
                <td className="px-3 py-2 text-xs text-gray-400 font-semibold" colSpan={2}>
                  Total sesión
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-white">
                  {totalKg.toFixed(3)} kg
                </td>
              </>
            ) : undefined
          }
        />
      </div>
    </div>
  )
}
