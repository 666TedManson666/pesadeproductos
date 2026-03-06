import { useState, useEffect } from 'react'
import { Input }   from '../../components/ui/Input'
import { Button }  from '../../components/ui/Button'
import { WarehouseSelect } from '../../components/Forms/WarehouseSelect'
import { ProductSelect }   from '../../components/Forms/ProductSelect'
import { warehousesApi, productsApi } from '../../api/electron.api'
import type { GetWeighingsPayload, Warehouse, Product } from '../../types'

interface HistoryFiltersProps {
  onSearch: (filters: GetWeighingsPayload) => void
  loading:  boolean
}

function todayStart() {
  const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,16)
}
function todayEnd() {
  const d = new Date(); d.setHours(23,59,59,999); return d.toISOString().slice(0,16)
}

export function HistoryFilters({ onSearch, loading }: HistoryFiltersProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products,   setProducts]   = useState<Product[]>([])
  const [dateFrom,   setDateFrom]   = useState(todayStart())
  const [dateTo,     setDateTo]     = useState(todayEnd())
  const [warehouseId, setWarehouseId] = useState<number | null>(null)
  const [productId,   setProductId]   = useState<number | null>(null)

  useEffect(() => {
    warehousesApi.getAll().then((r) => { if (r.success) setWarehouses(r.data ?? []) })
    productsApi.getAll().then((r)   => { if (r.success) setProducts(r.data ?? []) })
  }, [])

  function handleSearch() {
    onSearch({
      dateFrom:    dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo:      dateTo   ? new Date(dateTo).toISOString()   : undefined,
      warehouseId: warehouseId ?? undefined,
      productId:   productId   ?? undefined,
      limit: 500,
    })
  }

  function handleReset() {
    setDateFrom(todayStart())
    setDateTo(todayEnd())
    setWarehouseId(null)
    setProductId(null)
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label="Desde"
          type="datetime-local"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input
          label="Hasta"
          type="datetime-local"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <WarehouseSelect
          warehouses={warehouses}
          value={warehouseId}
          onChange={setWarehouseId}
          label="Almacén"
        />
        <ProductSelect
          products={products}
          value={productId}
          onChange={setProductId}
          label="Producto"
        />
      </div>

      <div className="flex gap-3 mt-4">
        <Button variant="primary" size="sm" loading={loading} onClick={handleSearch}>
          Buscar
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Limpiar
        </Button>
      </div>
    </div>
  )
}
