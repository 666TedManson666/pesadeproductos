import { useMemo } from 'react'
import type { Warehouse } from '../../types'

interface WarehouseSelectProps {
  warehouses:  Warehouse[]
  value:       number | null
  onChange:    (id: number | null) => void
  disabled?:   boolean
  label?:      string
}

export function WarehouseSelect({
  warehouses,
  value,
  onChange,
  disabled = false,
  label = 'Almacén / Ruta',
}: WarehouseSelectProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, Warehouse[]>()
    for (const wh of warehouses) {
      const list = map.get(wh.agencyName) ?? []
      list.push(wh)
      map.set(wh.agencyName, list)
    }
    return map
  }, [warehouses])

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full rounded-lg bg-gray-800 border border-gray-600 text-gray-100 px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">— Seleccionar almacén —</option>
        {Array.from(grouped.entries()).map(([agency, items]) => (
          <optgroup key={agency} label={agency}>
            {items.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
                {wh.type !== 'RUTA' ? ` (${wh.type})` : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
