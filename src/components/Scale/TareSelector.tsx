import { useState } from 'react'
import { useTareStore, totalTareKg, totalTareUnits, type TareItem } from '../../store/tare.store'

const KG_TO_LB = 2.20462
const LB_TO_KG = 0.453592

interface TareSelectorProps {
  /** Unidad nativa de la pesa activa, para mostrar los pesos en kg o lb. */
  unit: 'kg' | 'lb'
}

/** Convierte un peso en kg a la unidad de pantalla. */
function toUnit(kg: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? kg * KG_TO_LB : kg
}

function fmt(value: number, unit: 'kg' | 'lb'): string {
  return value.toFixed(unit === 'lb' ? 1 : 2)
}

export function TareSelector({ unit }: TareSelectorProps) {
  const { items, counts, increment, decrement, clearCounts, saveItems } = useTareStore()
  const [editing, setEditing] = useState(false)
  const [saved,   setSaved]   = useState(false)

  async function handleSave(next: TareItem[]) {
    await saveItems(next)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const tareKg    = totalTareKg(items, counts)
  const tareUnit  = toUnit(tareKg, unit)
  const unitsUsed = totalTareUnits(counts)

  return (
    <div className="rounded-xl border-2 border-amber-800/40 bg-amber-950/20 px-3 py-2.5">
      {/* Encabezado */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[18px] leading-none">📦</span>
        <span className="text-[11px] font-black text-amber-300/80 uppercase tracking-widest">
          Tara / Envases
        </span>

        {unitsUsed > 0 && !editing && !saved && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-900/40 border border-amber-700/40 px-2 py-0.5 rounded-full">
            −{fmt(tareUnit, unit)} {unit}
          </span>
        )}

        {saved && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-300 bg-green-900/40 border border-green-600/50 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Guardado
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {unitsUsed > 0 && !editing && (
            <button
              onClick={clearCounts}
              className="text-[10px] font-bold text-amber-400/80 hover:text-amber-200 underline underline-offset-2"
            >
              limpiar
            </button>
          )}
          <button
            onClick={() => setEditing((e) => !e)}
            title={editing ? 'Terminar edición' : 'Editar envases y pesos'}
            className={[
              'flex items-center justify-center w-6 h-6 rounded-lg border transition-colors',
              editing
                ? 'bg-amber-600 border-amber-400 text-white'
                : 'border-amber-700/40 text-amber-400/70 hover:text-amber-200 hover:border-amber-600',
            ].join(' ')}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {editing ? (
        <TareEditor unit={unit} items={items} onSave={handleSave} />
      ) : (
        <>
          {/* Cuadrícula de envases con steppers */}
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => {
              const n = counts[item.id] ?? 0
              const active = n > 0
              return (
                <div
                  key={item.id}
                  className={[
                    'flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors',
                    active
                      ? 'bg-amber-900/30 border-amber-600/50'
                      : 'bg-gray-900/40 border-gray-700/40',
                  ].join(' ')}
                >
                  <span className="text-[20px] leading-none flex-shrink-0">{item.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-bold truncate ${active ? 'text-amber-100' : 'text-gray-300'}`}>
                      {item.name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {fmt(toUnit(item.weightKg, unit), unit)} {unit} c/u
                    </div>
                  </div>

                  {/* Stepper − N + */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => decrement(item.id)}
                      disabled={n === 0}
                      className="w-7 h-7 rounded-md bg-gray-800 border border-gray-700 text-gray-300 text-lg font-black leading-none flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className={`w-6 text-center text-sm font-black tabular-nums ${active ? 'text-amber-200' : 'text-gray-500'}`}>
                      {n}
                    </span>
                    <button
                      onClick={() => increment(item.id)}
                      className="w-7 h-7 rounded-md bg-amber-700/80 border border-amber-600 text-white text-lg font-black leading-none flex items-center justify-center hover:bg-amber-600 active:bg-amber-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total de tara */}
          {unitsUsed > 0 && (
            <div className="flex items-center justify-between mt-2 px-2 py-1.5 rounded-lg bg-amber-900/30 border border-amber-700/40">
              <span className="text-[11px] font-bold text-amber-300/80 uppercase tracking-wide">
                Tara total ({unitsUsed} {unitsUsed === 1 ? 'envase' : 'envases'})
              </span>
              <span className="text-sm font-black text-amber-200 font-mono tabular-nums">
                −{fmt(tareUnit, unit)} {unit}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Editor de envases (modo escalable) ──────────────────────────────────────────

function TareEditor({
  unit, items, onSave,
}: {
  unit:   'kg' | 'lb'
  items:  TareItem[]
  onSave: (items: TareItem[]) => void
}) {
  // Editamos en la unidad de pantalla; guardamos en kg.
  const [draft, setDraft] = useState<Array<TareItem & { weightInput: string }>>(
    items.map((i) => ({ ...i, weightInput: fmt(toUnit(i.weightKg, unit), unit) }))
  )

  function updateField(idx: number, field: 'name' | 'emoji' | 'weightInput', value: string) {
    setDraft((d) => d.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))
  }

  function removeItem(idx: number) {
    setDraft((d) => d.filter((_, i) => i !== idx))
  }

  function addItem() {
    const id = `envase-${Date.now()}`
    setDraft((d) => [...d, { id, name: 'Nuevo envase', emoji: '📦', weightKg: 0, weightInput: '0' }])
  }

  function commit() {
    const cleaned: TareItem[] = draft
      .map((it) => {
        const num = parseFloat(it.weightInput.replace(',', '.')) || 0
        const weightKg = unit === 'lb' ? num * LB_TO_KG : num
        return {
          id:       it.id,
          name:     it.name.trim() || 'Envase',
          emoji:    it.emoji.trim() || '📦',
          weightKg: Math.max(0, weightKg),
        }
      })
    onSave(cleaned)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] text-amber-400/70 mb-0.5">
        Edita nombre, ícono y peso unitario (en {unit}). Los cambios se guardan para ambas pesas.
      </p>

      {draft.map((it, idx) => (
        <div key={it.id} className="flex items-center gap-1.5 rounded-lg bg-gray-900/50 border border-gray-700/50 px-2 py-1.5">
          <input
            value={it.emoji}
            onChange={(e) => updateField(idx, 'emoji', e.target.value)}
            className="w-9 text-center text-lg bg-gray-800 border border-gray-700 rounded-md py-1 focus:outline-none focus:border-amber-600"
            maxLength={2}
          />
          <input
            value={it.name}
            onChange={(e) => updateField(idx, 'name', e.target.value)}
            className="flex-1 min-w-0 text-xs font-bold text-gray-200 bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 focus:outline-none focus:border-amber-600"
            placeholder="Nombre"
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <input
              value={it.weightInput}
              onChange={(e) => updateField(idx, 'weightInput', e.target.value)}
              inputMode="decimal"
              className="w-16 text-right text-xs font-mono text-amber-200 bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 focus:outline-none focus:border-amber-600"
              placeholder="0"
            />
            <span className="text-[10px] text-gray-500 font-bold w-4">{unit}</span>
          </div>
          <button
            onClick={() => removeItem(idx)}
            title="Eliminar"
            className="w-7 h-7 flex-shrink-0 rounded-md bg-red-950/50 border border-red-800/50 text-red-400 flex items-center justify-center hover:bg-red-900/50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={addItem}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-700/50 text-amber-300 text-[11px] font-bold hover:bg-amber-900/30"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar envase
        </button>
        <button
          onClick={commit}
          className="ml-auto px-3 py-1.5 rounded-lg bg-amber-600 border border-amber-400 text-white text-[11px] font-black hover:bg-amber-500"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  )
}
