import { useState, useEffect } from 'react'
import { WeightDisplay } from '../../components/Scale/WeightDisplay'
import { WarehouseSelect } from '../../components/Forms/WarehouseSelect'
import { ProductSelect } from '../../components/Forms/ProductSelect'
import { ModeToggle } from '../../components/Forms/ModeToggle'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useScaleStore } from '../../store/scale.store'
import { useSessionStore } from '../../store/session.store'
import { useSettingsStore } from '../../store/settings.store'
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut'
import { weighingsApi, sessionsApi, productsApi, warehousesApi } from '../../api/electron.api'
import type { Product, Warehouse, Session, Weighing } from '../../types'

export function WeighingPanel() {
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [capturing, setCapturing] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { weight, stable, rawData } = useScaleStore()
  const { unit } = useSettingsStore((s) => s.serialConfig)

  const {
    mode, setMode,
    activeSession, setSession,
    selectedWarehouseId, setWarehouse,
    selectedProductId, setProduct,
    addWeighing,
  } = useSessionStore()

  useEffect(() => {
    productsApi.getAll().then((r) => { if (r.success) setProducts(r.data ?? []) })
    warehousesApi.getAll().then((r) => { if (r.success) setWarehouses(r.data ?? []) })
  }, [])

  const canCapture = weight !== null
    && weight > 0
    && stable
    && selectedWarehouseId !== null
    && selectedProductId !== null
    && (mode === 'QUICK' || activeSession !== null)

  async function handleCapture() {
    if (!canCapture) return
    setCapturing(true)
    setError(null)

    const res = await weighingsApi.capture({
      warehouseId: selectedWarehouseId!,
      productId: selectedProductId!,
      weightKg: weight!,
      sessionId: activeSession?.id,
      mode,
      rawData: rawData ?? undefined,
    })

    if (res.success && res.data) {
      addWeighing(res.data as Weighing)
      showNotification(`✓ ${(res.data as Weighing).weightKg} kg guardado`)
      if (mode === 'QUICK') setProduct(null)
    } else {
      setError(res.error ?? 'Error al guardar')
    }
    setCapturing(false)
  }

  async function handleOpenSession() {
    if (!selectedWarehouseId) return
    const res = await sessionsApi.open({ warehouseId: selectedWarehouseId })
    if (res.success && res.data) {
      setSession(res.data as Session)
      showNotification('Sesión abierta')
    }
  }

  async function handleCloseSession() {
    if (!activeSession) return
    const res = await sessionsApi.close({ sessionId: activeSession.id })
    if (res.success) {
      setSession(null)
      setWarehouse(null)
      showNotification('Sesión cerrada')
    }
  }

  function showNotification(msg: string) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2000)
  }

  useKeyboardShortcut(['Enter', 'F5'], handleCapture, canCapture && !capturing)

  return (
    <div className="flex flex-col gap-5">
      {/* Mode toggle */}
      <ModeToggle value={mode} onChange={setMode} />

      {/* Weight display */}
      <WeightDisplay weight={weight} stable={stable} unit={unit} />

      {/* Keyboard hint */}
      <p className="text-center text-xs text-gray-600">
        Presiona <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-gray-400 font-mono text-xs">Enter</kbd>
        {' '}o{' '}
        <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-gray-400 font-mono text-xs">F5</kbd>
        {' '}para capturar
      </p>

      {/* Session status */}
      {mode === 'SESSION' && (
        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
          {activeSession ? (
            <div className="flex items-center justify-between">
              <div>
                <Badge color="green" dot>Sesión activa</Badge>
                <p className="text-xs text-gray-400 mt-1">{activeSession.warehouseName}</p>
              </div>
              <Button variant="danger" size="sm" onClick={handleCloseSession}>
                Cerrar sesión
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">
                Selecciona un almacén y abre la sesión para comenzar
              </p>
              <Button
                variant="success"
                size="sm"
                fullWidth
                disabled={!selectedWarehouseId}
                onClick={handleOpenSession}
              >
                Abrir sesión
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Selects */}
      <WarehouseSelect
        warehouses={warehouses}
        value={selectedWarehouseId}
        onChange={setWarehouse}
        disabled={mode === 'SESSION' && activeSession !== null}
      />

      <ProductSelect
        products={products}
        value={selectedProductId}
        onChange={setProduct}
      />

      {/* Capture button */}
      <Button
        variant="primary"
        size="xl"
        fullWidth
        disabled={!canCapture}
        loading={capturing}
        onClick={handleCapture}
        className="mt-1"
      >
        {capturing ? 'Guardando...' : 'CAPTURAR PESO'}
      </Button>

      {/* Feedback */}
      {notification && (
        <div className="text-center text-sm font-medium text-green-400 animate-pulse">
          {notification}
        </div>
      )}
      {error && (
        <div className="text-center text-sm font-medium text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
