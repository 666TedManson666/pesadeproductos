import { useState, useEffect, useRef } from 'react'
import { useScaleStore } from '../../store/scale.store'
import { useSettingsStore } from '../../store/settings.store'
import type { MaintenanceEvent, MaintenancePhase, MaintenanceStatus } from '../../types'

const MAX_LOG = 200

// ─── Phase metadata ───────────────────────────────────────────────────────────

interface PhaseMeta {
  id:    MaintenancePhase
  label: string
  desc:  string
  icon:  string
}

const PHASES: PhaseMeta[] = [
  { id: 'CONEXION',    label: 'Conexión',     desc: 'Puerto serial abierto',          icon: '🔌' },
  { id: 'BYTES_CRUDOS', label: 'Bytes crudos', desc: 'Datos llegando del hardware',   icon: '📡' },
  { id: 'LINEA',       label: 'Línea',         desc: 'ReadlineParser separó la línea', icon: '✂️' },
  { id: 'REGEX',       label: 'Regex',         desc: 'Se extrajo el número de peso',   icon: '🔍' },
  { id: 'ESTABILIDAD', label: 'Estabilidad',   desc: 'Valor sostenido ≥1 segundo',     icon: '⚖️' },
  { id: 'IPC',         label: 'IPC',           desc: 'Enviado al renderer via Electron', icon: '⚡' },
  { id: 'PANTALLA',    label: 'Pantalla',      desc: 'Recibido y visible en React',    icon: '🖥️' },
]

// ─── Phase state ──────────────────────────────────────────────────────────────

interface PhaseState {
  status:  MaintenanceStatus
  message: string
  detail:  string
  lastTs:  number | null
  count:   number
}

const IDLE_STATE: PhaseState = {
  status:  'idle',
  message: 'Sin actividad',
  detail:  '',
  lastTs:  null,
  count:   0,
}

type PhasesMap = Record<MaintenancePhase, PhaseState>

function makeIdleMap(): PhasesMap {
  return Object.fromEntries(PHASES.map((p) => [p.id, { ...IDLE_STATE }])) as PhasesMap
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(s: MaintenanceStatus): string {
  return s === 'ok'   ? 'bg-green-500'
       : s === 'error' ? 'bg-red-500'
       : s === 'warn'  ? 'bg-yellow-400'
       : 'bg-gray-600'
}

function statusBorder(s: MaintenanceStatus): string {
  return s === 'ok'    ? 'border-green-600/40 bg-green-950/20'
       : s === 'error' ? 'border-red-600/40 bg-red-950/20'
       : s === 'warn'  ? 'border-yellow-600/40 bg-yellow-950/20'
       : 'border-gray-700 bg-gray-900/40'
}

function statusLabel(s: MaintenanceStatus): string {
  return s === 'ok'    ? 'OK'
       : s === 'error' ? 'ERROR'
       : s === 'warn'  ? 'AVISO'
       : 'INACTIVO'
}

function statusTextColor(s: MaintenanceStatus): string {
  return s === 'ok'    ? 'text-green-400'
       : s === 'error' ? 'text-red-400'
       : s === 'warn'  ? 'text-yellow-400'
       : 'text-gray-500'
}

function logStatusIcon(s: MaintenanceStatus): string {
  return s === 'ok' ? '✓' : s === 'error' ? '✗' : s === 'warn' ? '⚠' : '·'
}

function logStatusClass(s: MaintenanceStatus): string {
  return s === 'ok'    ? 'text-green-400'
       : s === 'error' ? 'text-red-400'
       : s === 'warn'  ? 'text-yellow-400'
       : 'text-gray-500'
}

function relativeTime(ts: number | null): string {
  if (ts === null) return '—'
  const diff = Date.now() - ts
  if (diff < 2000)   return 'ahora'
  if (diff < 60000)  return `hace ${Math.floor(diff / 1000)}s`
  if (diff < 3600000) return `hace ${Math.floor(diff / 60000)}min`
  return `hace ${Math.floor(diff / 3600000)}h`
}

function fmtTime(ts: number): string {
  const d   = new Date(ts)
  const hms = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const ms  = String(d.getMilliseconds()).padStart(3, '0')
  return `${hms}.${ms}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const [phases, setPhases] = useState<PhasesMap>(makeIdleMap)
  const [log, setLog]       = useState<MaintenanceEvent[]>([])
  const logRef              = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [, forceRender]     = useState(0)

  const { weight, stable, rawData, status: serialStatus } = useScaleStore()
  const { serialConfig } = useSettingsStore()

  // Re-render every second to refresh relative timestamps
  useEffect(() => {
    const id = setInterval(() => forceRender((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Subscribe to maintenance events from main process
  useEffect(() => {
    const handler = (e: MaintenanceEvent) => {
      setPhases((prev) => ({
        ...prev,
        [e.phase]: {
          status:  e.status,
          message: e.message,
          detail:  e.detail ?? '',
          lastTs:  e.ts,
          count:   (prev[e.phase].count ?? 0) + 1,
        },
      }))
      setLog((prev) => {
        const next = [e, ...prev]
        return next.length > MAX_LOG ? next.slice(0, MAX_LOG) : next
      })
    }
    window.electronAPI.onMaintenanceEvent(handler)
    return () => window.electronAPI.removeListener('maintenance:event')
  }, [])

  // Track PANTALLA phase: every time a new weight arrives in the hook store it's proof
  // the renderer received the IPC event successfully.
  const prevWeightRef = useRef<number | null>(undefined as unknown as null)
  useEffect(() => {
    if (weight === prevWeightRef.current) return
    prevWeightRef.current = weight

    const event: MaintenanceEvent = {
      phase:   'PANTALLA',
      status:  weight !== null ? (stable ? 'ok' : 'warn') : 'idle',
      message: weight !== null
        ? (stable ? `Peso estable: ${weight} ${serialConfig.unit}` : `Peso oscilando: ${weight} ${serialConfig.unit}`)
        : 'Sin peso en pantalla',
      detail:  rawData ?? undefined,
      ts:      Date.now(),
    }
    setPhases((prev) => ({
      ...prev,
      PANTALLA: {
        status:  event.status,
        message: event.message,
        detail:  event.detail ?? '',
        lastTs:  event.ts,
        count:   (prev.PANTALLA.count ?? 0) + 1,
      },
    }))
    setLog((prev) => {
      const next = [event, ...prev]
      return next.length > MAX_LOG ? next.slice(0, MAX_LOG) : next
    })
  }, [weight, stable, rawData, serialConfig.unit])

  // Auto-scroll log to top (newest first)
  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = 0
    }
  }, [log, autoScroll])

  function handleClear() {
    setPhases(makeIdleMap())
    setLog([])
  }

  return (
    <div className="flex flex-col gap-6 h-full">

      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Mantenimiento</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Diagnóstico del pipeline de datos — de la pesa a la pantalla
          </p>
        </div>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-xs font-semibold text-gray-400 border border-gray-700
                     rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* ─── Config summary ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs font-mono">
        <ConfigBadge label="Puerto" value={serialConfig.port} />
        <ConfigBadge label="Baud"   value={String(serialConfig.baudRate)} />
        <ConfigBadge label="Bits"   value={`${serialConfig.dataBits}/${serialConfig.stopBits}/${serialConfig.parity}`} />
        <ConfigBadge label="Regex"  value={serialConfig.weightRegex} />
        <ConfigBadge label="Unidad" value={serialConfig.unit} />
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${serialStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
          <span className={serialStatus.connected ? 'text-green-400' : 'text-gray-500'}>
            {serialStatus.connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* ─── Pipeline ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-1.5">
        {PHASES.map((phase, i) => {
          const state = phases[phase.id]
          return (
            <div key={phase.id} className="flex flex-col items-center gap-1">
              <PhaseCard phase={phase} state={state} />
              {i < PHASES.length - 1 && (
                <div className="hidden" />
              )}
            </div>
          )
        })}
      </div>

      {/* Pipeline flow arrows */}
      <div className="flex items-center gap-1">
        {PHASES.map((phase, i) => {
          const state = phases[phase.id]
          return (
            <div key={phase.id} className="flex items-center flex-1 min-w-0">
              <FlowDot status={state.status} />
              {i < PHASES.length - 1 && (
                <div className="flex-1 h-px bg-gray-700 mx-1 relative">
                  <div
                    className={`absolute inset-0 transition-all duration-500 ${
                      state.status === 'ok' ? 'bg-green-600' :
                      state.status === 'error' ? 'bg-red-600' :
                      state.status === 'warn' ? 'bg-yellow-600' : 'bg-gray-700'
                    }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ─── Bottom: Detail cards + Log ────────────────────────────── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Phase detail list */}
        <div className="flex flex-col gap-2 w-80 flex-shrink-0 overflow-y-auto">
          {PHASES.map((phase) => {
            const state = phases[phase.id]
            return (
              <div
                key={phase.id}
                className={`rounded-lg border px-3 py-2.5 transition-colors ${statusBorder(state.status)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{phase.icon}</span>
                    <span className="text-xs font-bold text-white">{phase.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${statusColor(state.status)}`} />
                    <span className={`text-xs font-bold ${statusTextColor(state.status)}`}>
                      {statusLabel(state.status)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-300 truncate" title={state.message}>{state.message}</p>
                {state.detail && (
                  <p className="text-xs text-gray-500 font-mono truncate mt-0.5" title={state.detail}>
                    {state.detail}
                  </p>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-gray-600">{phase.desc}</span>
                  <span className="text-xs text-gray-600 tabular-nums">
                    {relativeTime(state.lastTs)}
                    {state.count > 0 && <span className="ml-1.5 text-gray-700">({state.count})</span>}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Event log */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Log de eventos ({log.length})
            </p>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-3 h-3 accent-brand-500"
              />
              <span className="text-xs text-gray-500">Auto-scroll</span>
            </label>
          </div>
          <div
            ref={logRef}
            className="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-950 p-3 font-mono text-xs space-y-0.5"
          >
            {log.length === 0 ? (
              <p className="text-gray-700 text-center py-8">
                Esperando eventos...<br />
                <span className="text-gray-800">Pon algo en la pesa para ver el flujo de datos</span>
              </p>
            ) : (
              log.map((e, i) => (
                <LogLine key={i} event={e} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfigBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-600">{label}:</span>
      <span className="text-gray-300">{value}</span>
    </div>
  )
}

function PhaseCard({ phase, state }: { phase: PhaseMeta; state: PhaseState }) {
  return (
    <div className={`w-full rounded-xl border p-2 text-center transition-all duration-300 ${statusBorder(state.status)}`}>
      <div className="text-xl mb-1">{phase.icon}</div>
      <p className="text-xs font-bold text-white leading-tight">{phase.label}</p>
      <div className="flex items-center justify-center gap-1 mt-1.5">
        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
          state.status === 'ok'    ? 'bg-green-500 animate-pulse' :
          state.status === 'error' ? 'bg-red-500 animate-pulse' :
          state.status === 'warn'  ? 'bg-yellow-400 animate-pulse' : 'bg-gray-700'
        }`} />
        <span className={`text-xs font-semibold ${statusTextColor(state.status)}`}>
          {statusLabel(state.status)}
        </span>
      </div>
      {state.count > 0 && (
        <p className="text-xs text-gray-700 mt-1">{state.count}</p>
      )}
    </div>
  )
}

function FlowDot({ status }: { status: MaintenanceStatus }) {
  return (
    <div className={`h-3 w-3 rounded-full flex-shrink-0 transition-colors duration-300 ${
      status === 'ok'    ? 'bg-green-500' :
      status === 'error' ? 'bg-red-500' :
      status === 'warn'  ? 'bg-yellow-400' : 'bg-gray-700'
    }`} />
  )
}

function LogLine({ event }: { event: MaintenanceEvent }) {
  const meta = PHASES.find((p) => p.id === event.phase)
  return (
    <div className="flex items-start gap-2 py-0.5 border-b border-gray-900 last:border-0">
      <span className="text-gray-700 flex-shrink-0 tabular-nums">{fmtTime(event.ts)}</span>
      <span className={`w-20 flex-shrink-0 font-bold ${logStatusClass(event.status)}`}>
        {logStatusIcon(event.status)} {meta?.label ?? event.phase}
      </span>
      <span className="text-gray-400 truncate flex-1" title={event.message}>{event.message}</span>
      {event.detail && (
        <span className="text-gray-600 truncate max-w-xs hidden xl:block" title={event.detail}>
          {event.detail}
        </span>
      )}
    </div>
  )
}
