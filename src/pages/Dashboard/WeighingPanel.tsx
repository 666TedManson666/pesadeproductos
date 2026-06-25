import { useState, useEffect } from 'react'
import { WeightDisplay }         from '../../components/Scale/WeightDisplay'
import { TareSelector }          from '../../components/Scale/TareSelector'
import { useScaleStore }         from '../../store/scale.store'
import { useScaleSelectorStore } from '../../store/scaleSelector.store'
import { useSessionStore }       from '../../store/session.store'
import { useSettingsStore }      from '../../store/settings.store'
import { useTareStore, totalTareKg } from '../../store/tare.store'
import { useKeyboardShortcut }   from '../../hooks/useKeyboardShortcut'
import { weighingsApi, sessionsApi, productsApi, warehousesApi } from '../../api/electron.api'
import type { Product, Warehouse, Session, Weighing } from '../../types'

const KG_TO_LB = 2.20462
const LB_TO_KG = 0.453592

// ─── Style + icon helpers ──────────────────────────────────────────────────────

const Emoji = ({ e }: { e: string }) => (
  <span className="text-[28px] leading-none select-none" role="img">{e}</span>
)

const EmojiSm = ({ e }: { e: string }) => (
  <span className="text-[22px] leading-none select-none" role="img">{e}</span>
)

interface ProductStyle {
  bg:    string
  hover: string
  ring:  string
  icon:  JSX.Element
}

function getProductStyle(name: string): ProductStyle {
  const u = name.toUpperCase()
  if (u.includes('FILETITO'))
    return { bg: 'bg-blue-500',   hover: 'hover:bg-blue-400',   ring: 'ring-blue-300',   icon: <Emoji e="🫀" /> }
  if (u.includes('FILETE'))
    return { bg: 'bg-stone-500',  hover: 'hover:bg-stone-400',  ring: 'ring-stone-300',  icon: <Emoji e="🥩" /> }
  if (u.includes('PECHUGA'))
    return { bg: 'bg-orange-400', hover: 'hover:bg-orange-300', ring: 'ring-orange-200', icon: <Emoji e="🍗" /> }
  if (u.includes('MUSLO') || u.includes('ENCUENTRO'))
    return { bg: 'bg-green-500',  hover: 'hover:bg-green-400',  ring: 'ring-green-300',  icon: <Emoji e="🍖" /> }
  if (u.includes('ALAS'))
    return { bg: 'bg-lime-500',   hover: 'hover:bg-lime-400',   ring: 'ring-lime-300',   icon: <Emoji e="🍗" /> }
  if (u.includes('ROSTY') && u.includes('CHICO'))
    return { bg: 'bg-purple-500', hover: 'hover:bg-purple-400', ring: 'ring-purple-300', icon: <Emoji e="🍗" /> }
  if (u.includes('ROSTY'))
    return { bg: 'bg-rose-500',   hover: 'hover:bg-rose-400',   ring: 'ring-rose-300',   icon: <Emoji e="🍗" /> }
  if (u.includes('HIGADO') || u.includes('MOLLEJAS') || u.includes('CABEZA') || u.includes('PICAD') || u.includes('MENUDO'))
    return { bg: 'bg-blue-500',   hover: 'hover:bg-blue-400',   ring: 'ring-blue-300',   icon: <Emoji e="🫀" /> }
  if (u.includes('GALLINA') || u.includes('GALLO') || u.includes('PATITAS') || u.includes('PESCUEZO'))
    return { bg: 'bg-pink-400',   hover: 'hover:bg-pink-300',   ring: 'ring-pink-200',   icon: <Emoji e="🐔" /> }
  if (u.includes('POLLO'))
    return { bg: 'bg-sky-500',    hover: 'hover:bg-sky-400',    ring: 'ring-sky-300',    icon: <Emoji e="🐔" /> }
  if (u.includes('HUEVO'))
    return { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-400', ring: 'ring-yellow-300', icon: <Emoji e="🥚" /> }
  return   { bg: 'bg-gray-600',   hover: 'hover:bg-gray-500',   ring: 'ring-gray-400',   icon: <Emoji e="📦" /> }
}

function getWarehouseIcon(type: string, name: string): JSX.Element {
  const u = name.toUpperCase()
  if (u.includes('CLIENTE'))              return <EmojiSm e="🧑‍💼" />
  if (u.includes('OTRO') || u.includes('OTHER')) return <EmojiSm e="➕" />
  if (type === 'RUTA')                    return <EmojiSm e="🚚" />
  return                                         <EmojiSm e="🏪" />
}

// ─── Main component ────────────────────────────────────────────────────────────

export function WeighingPanel() {
  const [products,     setProducts]     = useState<Product[]>([])
  const [warehouses,   setWarehouses]   = useState<Warehouse[]>([])
  const [capturing,    setCapturing]    = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [error,        setError]        = useState<string | null>(null)
  const [reading,      setReading]      = useState(false)

  const { activeScale } = useScaleSelectorStore()
  const scaleData = useScaleStore((s) => s.scales[activeScale])
  const { weight, stable, rawData, status } = scaleData
  const { unit } = useSettingsStore((s) => activeScale === 1 ? s.serialConfig : s.serialConfig2)

  // ── Tara (envases) ───────────────────────────────────────────────────────────
  const tareItems  = useTareStore((s) => s.items)
  const tareCounts = useTareStore((s) => s.counts)
  const tareKg     = totalTareKg(tareItems, tareCounts)

  // Peso bruto (lo que marca la pesa) normalizado a kg, y peso neto = bruto − tara
  const grossKg = weight !== null ? (unit === 'lb' ? weight * LB_TO_KG : weight) : null
  const netKg   = grossKg !== null ? grossKg - tareKg : null
  const netUnit = netKg !== null ? (unit === 'lb' ? netKg * KG_TO_LB : netKg) : null

  const {
    mode, setMode,
    activeSession, setSession,
    selectedWarehouseId, setWarehouse,
    selectedProductId,   setProduct,
    addWeighing,
  } = useSessionStore()

  useEffect(() => {
    productsApi.getAll().then((r)   => { if (r.success) setProducts(r.data ?? []) })
    warehousesApi.getAll().then((r) => { if (r.success) setWarehouses(r.data ?? []) })
  }, [])

  const canCapture = weight !== null
    && weight > 0
    && netKg !== null
    && netKg > 0
    && stable
    && selectedWarehouseId !== null
    && selectedProductId   !== null
    && (mode === 'QUICK' || activeSession !== null)

  // ── Handlers (logic unchanged) ───────────────────────────────────────────────

  async function handleCapture() {
    if (!canCapture) return
    setCapturing(true)
    setError(null)
    // Guardamos el peso NETO (bruto − tara de envases)
    const weightKg = netKg!
    // Anotamos la tara en rawData para trazabilidad, sin romper el dato crudo original
    const rawWithTare = tareKg > 0
      ? `${rawData ?? ''} | bruto:${grossKg!.toFixed(3)}kg tara:${tareKg.toFixed(3)}kg`
      : rawData ?? undefined
    const res = await weighingsApi.capture({
      warehouseId: selectedWarehouseId!,
      productId:   selectedProductId!,
      weightKg,
      sessionId:   activeSession?.id,
      mode,
      rawData:     rawWithTare,
    })
    if (res.success && res.data) {
      addWeighing(res.data as Weighing)
      showNotification(`${Number((res.data as Weighing).weightKg).toFixed(3)} kg guardado`)
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
    setTimeout(() => setNotification(null), 2500)
  }

  async function handleReadNow() {
    setReading(true)
    if (activeScale === 1) await window.electronAPI.serial.readNow()
    else                   await window.electronAPI.serial2.readNow()
    setTimeout(() => setReading(false), 800)
  }

  useKeyboardShortcut(['F5'], handleCapture, canCapture && !capturing)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Dual weight display */}
      <WeightDisplay weight={weight} stable={stable} unit={unit} />

      {/* Banner de peso NETO — solo si hay tara aplicada */}
      {tareKg > 0 && weight !== null && weight > 0 && (
        <div className="mx-4 mt-1 flex items-stretch rounded-xl overflow-hidden border-2 border-green-700/50 shadow-lg shadow-green-950/40">
          <div className="flex-1 flex flex-col items-center justify-center py-1.5 bg-gray-900/60">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Bruto</span>
            <span className="text-sm font-mono font-black text-gray-400 tabular-nums">
              {Number(weight).toFixed(unit === 'lb' ? 1 : 2)} {unit}
            </span>
          </div>
          <div className="flex items-center justify-center px-1 bg-gray-900/60 text-gray-600 font-black">−</div>
          <div className="flex-1 flex flex-col items-center justify-center py-1.5 bg-amber-950/40">
            <span className="text-[9px] font-bold text-amber-500/80 uppercase tracking-wider">Tara</span>
            <span className="text-sm font-mono font-black text-amber-300 tabular-nums">
              {(unit === 'lb' ? tareKg * KG_TO_LB : tareKg).toFixed(unit === 'lb' ? 1 : 2)} {unit}
            </span>
          </div>
          <div className="flex items-center justify-center px-1 bg-gray-900/60 text-gray-600 font-black">=</div>
          <div className={`flex-[1.3] flex flex-col items-center justify-center py-1.5 ${netUnit !== null && netUnit > 0 ? 'bg-green-700/90' : 'bg-red-800/70'}`}>
            <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Neto</span>
            <span className="text-lg font-mono font-black text-white tabular-nums leading-none">
              {netUnit !== null ? netUnit.toFixed(unit === 'lb' ? 1 : 2) : '--'} {unit}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 px-4 pb-4 pt-2">

        {/* Top toolbar: read now + mode toggle */}
        <div className="flex gap-2 items-stretch">
          <button
            onClick={handleReadNow}
            disabled={reading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all flex-shrink-0
              ${status.connected
                ? 'border-brand-600/50 bg-brand-950/50 text-brand-400 hover:bg-brand-900/40'
                : 'border-amber-700/50 bg-amber-950/40 text-amber-400 hover:bg-amber-900/30'}
              disabled:opacity-40`}
          >
            <svg className={`w-3.5 h-3.5 ${reading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {reading ? 'Leyendo...' : 'Leer Peso'}
          </button>

          <div className="flex items-center gap-0.5 bg-gray-900/70 rounded-xl p-0.5 border border-gray-700/50 flex-1">
            {/* Pesaje Rápido */}
            <button
              onClick={() => setMode('QUICK')}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-black transition-all duration-200',
                mode === 'QUICK'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-900/50'
                  : 'text-gray-600 hover:text-gray-300 hover:bg-gray-800/50',
              ].join(' ')}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Rápido
            </button>

            {/* Modo Sesión */}
            <button
              onClick={() => setMode('SESSION')}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-black transition-all duration-200',
                mode === 'SESSION'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-900/50'
                  : 'text-gray-600 hover:text-gray-300 hover:bg-gray-800/50',
              ].join(' ')}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Sesión
            </button>
          </div>

          <div className="flex items-center text-xs text-gray-700 gap-1 flex-shrink-0">
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-500 font-mono">F5</kbd>
            <span className="text-gray-700">capturar</span>
          </div>
        </div>

        {/* Session panel */}
        {mode === 'SESSION' && (
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-gray-800/40 rounded-xl border border-gray-700/40">
            {activeSession ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                  </span>
                  <span className="text-xs font-bold text-green-400">Sesión activa</span>
                  <span className="text-xs text-gray-500">— {activeSession.warehouseName}</span>
                </div>
                <button
                  onClick={handleCloseSession}
                  className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800/50 text-red-400 text-xs font-bold hover:bg-red-900/50 transition-colors"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-600">Selecciona un destino y abre la sesión</p>
                <button
                  onClick={handleOpenSession}
                  disabled={!selectedWarehouseId}
                  className="px-3 py-1.5 rounded-lg bg-green-950/60 border border-green-800/50 text-green-400 text-xs font-bold hover:bg-green-900/50 transition-colors disabled:opacity-30"
                >
                  Abrir sesión
                </button>
              </>
            )}
          </div>
        )}

        {/* ─── Tara / Envases ───────────────────────────────────────────────────── */}
        <TareSelector unit={unit} />

        {/* ─── Step 1: Product ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">1</span>
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Producto</span>
            {selectedProductId && (
              <span className="ml-auto text-[10px] text-gray-600 font-medium">toca para cambiar</span>
            )}
          </div>

          {selectedProductId === null ? (
            /* Grid expandido */
            <div className="grid grid-cols-3 gap-2">
              {products.map((p) => {
                const s = getProductStyle(p.name)
                return (
                  <button
                    key={p.id}
                    onClick={() => setProduct(p.id)}
                    className={[
                      'flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl',
                      'text-white font-bold text-xs text-center leading-tight',
                      'transition-all duration-150 border-2 select-none min-h-[76px]',
                      `${s.bg} border-transparent ${s.hover} opacity-85 hover:opacity-100`,
                    ].join(' ')}
                  >
                    <span className="opacity-90">{s.icon}</span>
                    <span>{p.name}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            /* Solo el seleccionado — toca para cambiar */
            (() => {
              const p = products.find((x) => x.id === selectedProductId)!
              const s = p ? getProductStyle(p.name) : getProductStyle('')
              return (
                <button
                  onClick={() => setProduct(null)}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                    'text-white font-bold text-sm border-2 select-none',
                    'transition-all duration-150',
                    `${s.bg} border-white/30 ring-1 ${s.ring} shadow-md hover:border-white/60`,
                  ].join(' ')}
                >
                  <span className="flex-shrink-0">{s.icon}</span>
                  <span className="flex-1 text-left">{p?.name}</span>
                  <span className="flex items-center gap-1 text-[10px] font-normal text-white/50 bg-black/20 px-2 py-1 rounded-lg">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    cambiar
                  </span>
                </button>
              )
            })()
          )}
        </div>

        {/* ─── Step 2: Destino ──────────────────────────────────────────────────── */}
        <div className={mode === 'SESSION' && activeSession ? 'opacity-40 pointer-events-none' : ''}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">2</span>
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Destino / Ruta</span>
            {selectedWarehouseId && (
              <span className="ml-auto text-[10px] text-gray-600 font-medium">toca para cambiar</span>
            )}
          </div>

          {selectedWarehouseId === null ? (
            /* Grid expandido */
            <div className="grid grid-cols-3 gap-2">
              {warehouses.map((wh) => (
                <button
                  key={wh.id}
                  onClick={() => setWarehouse(wh.id)}
                  className={[
                    'flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl',
                    'text-white font-bold text-xs text-center leading-tight',
                    'transition-all duration-150 border-2 select-none min-h-[72px]',
                    'bg-purple-900/70 border-transparent hover:bg-purple-800/80 opacity-85 hover:opacity-100',
                  ].join(' ')}
                >
                  <span className="opacity-90">{getWarehouseIcon(wh.type, wh.name)}</span>
                  <span>{wh.name}</span>
                </button>
              ))}
            </div>
          ) : (
            /* Solo el seleccionado — toca para cambiar */
            (() => {
              const wh = warehouses.find((x) => x.id === selectedWarehouseId)!
              return (
                <button
                  onClick={() => setWarehouse(null)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white font-bold text-sm border-2 select-none transition-all duration-150 bg-purple-700 border-white/30 ring-1 ring-purple-400 shadow-md hover:border-white/60"
                >
                  <span className="flex-shrink-0">{wh && getWarehouseIcon(wh.type, wh.name)}</span>
                  <span className="flex-1 text-left">{wh?.name}</span>
                  <span className="flex items-center gap-1 text-[10px] font-normal text-white/50 bg-black/20 px-2 py-1 rounded-lg">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    cambiar
                  </span>
                </button>
              )
            })()
          )}
        </div>

        {/* ─── Capture button ───────────────────────────────────────────────────── */}
        <button
          onClick={handleCapture}
          disabled={!canCapture || capturing}
          className={[
            'w-full flex items-center justify-center gap-3 py-5 rounded-2xl',
            'font-black text-xl uppercase tracking-widest border-2 select-none',
            'transition-all duration-200',
            canCapture && !capturing
              ? 'bg-green-600 hover:bg-green-500 active:bg-green-700 border-green-400/60 text-white shadow-xl shadow-green-950/60'
              : 'bg-gray-800/40 border-gray-700/40 text-gray-600 cursor-not-allowed',
          ].join(' ')}
        >
          {capturing ? (
            <>
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              {tareKg > 0 ? 'Capturar Neto' : 'Capturar Peso'}
              {canCapture && netUnit !== null && (
                <span className="text-sm font-normal text-green-300/70">
                  — {netUnit.toFixed(unit === 'lb' ? 1 : 3)} {unit}
                </span>
              )}
            </>
          )}
        </button>

        {error && (
          <div className="text-center text-sm font-bold text-red-400 bg-red-950/40 rounded-xl px-3 py-2 border border-red-800/50">
            {error}
          </div>
        )}
      </div>

      {/* Toast notification */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex items-center gap-2 bg-green-700 text-white text-sm font-bold px-6 py-3 rounded-full shadow-2xl shadow-green-950/80 animate-bounce">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            {notification}
          </div>
        </div>
      )}
    </div>
  )
}
