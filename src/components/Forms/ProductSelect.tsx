import type { Product } from '../../types'

interface ProductSelectProps {
  products:  Product[]
  value:     number | null
  onChange:  (id: number | null) => void
  disabled?: boolean
  label?:    string
}

export function ProductSelect({
  products,
  value,
  onChange,
  disabled = false,
  label = 'Producto',
}: ProductSelectProps) {
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
        <option value="">— Seleccionar producto —</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            [{p.code}] {p.name}
          </option>
        ))}
      </select>
    </div>
  )
}
