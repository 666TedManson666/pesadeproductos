import { Button } from '../../components/ui/Button'
import type { Weighing } from '../../types'

interface ExportBarProps {
  rows: Weighing[]
}

function buildCsv(rows: Weighing[]): string {
  const header = 'Fecha,Hora,Almacén,Producto,Código,Peso (kg),Modo'
  const lines  = rows.map((r) => {
    const d = new Date(r.capturedAt)
    const date = d.toLocaleDateString('es-PA')
    const time = d.toLocaleTimeString('es-PA')
    return [date, time, `"${r.warehouseName}"`, `"${r.productName}"`, r.productCode, r.weightKg, r.mode].join(',')
  })
  return [header, ...lines].join('\n')
}

export function ExportBar({ rows }: ExportBarProps) {
  function handleCsv() {
    const csv  = buildCsv(rows)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `pesajes_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    window.print()
  }

  if (rows.length === 0) return null

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500">{rows.length} registros</span>
      <Button variant="secondary" size="sm" onClick={handleCsv}>
        Exportar CSV
      </Button>
      <Button variant="ghost" size="sm" onClick={handlePrint}>
        Imprimir
      </Button>
    </div>
  )
}
