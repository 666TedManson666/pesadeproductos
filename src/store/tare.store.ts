import { create } from 'zustand'
import { settingsApi } from '../api/electron.api'
import type { SettingsMap } from '../types'

// ─── Tipos ──────────────────────────────────────────────────────────────────────

/** Definición de un envase / elemento que aporta peso muerto (tara). */
export interface TareItem {
  id:       string   // identificador estable (slug)
  name:     string   // nombre visible
  emoji:    string   // ícono
  weightKg: number   // peso unitario, SIEMPRE almacenado en kilogramos (canónico)
}

/** Clave en la tabla `settings` donde se persiste la lista de envases. */
const SETTINGS_KEY = 'tare.containers'

/** Envases por defecto (pesos dados por la clienta, en kg). */
export const DEFAULT_TARE_ITEMS: TareItem[] = [
  { id: 'pallet',         name: 'Pallet',         emoji: '🟫', weightKg: 25   },
  { id: 'carretilla',     name: 'Carretilla',     emoji: '🛒', weightKg: 12   },
  { id: 'canasta-chica',  name: 'Canasta Chica',  emoji: '🧺', weightKg: 2    },
  { id: 'canasta-grande', name: 'Canasta Grande', emoji: '🧺', weightKg: 2.5  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

interface TareStore {
  /** Catálogo de envases disponibles (editable / persistente). */
  items:   TareItem[]
  /** Cantidad seleccionada por cada envase: { [itemId]: cantidad }. */
  counts:  Record<string, number>
  loaded:  boolean

  loadItems:  () => Promise<void>
  saveItems:  (items: TareItem[]) => Promise<void>

  increment:  (id: string) => void
  decrement:  (id: string) => void
  setCount:   (id: string, n: number) => void
  clearCounts: () => void
}

export const useTareStore = create<TareStore>((set, get) => ({
  items:  DEFAULT_TARE_ITEMS,
  counts: {},
  loaded: false,

  loadItems: async () => {
    const res = await settingsApi.getAll()
    if (res.success && res.data) {
      const raw = (res.data as SettingsMap)[SETTINGS_KEY]
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as TareItem[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            set({ items: parsed, loaded: true })
            return
          }
        } catch {
          /* JSON inválido → caemos a los valores por defecto */
        }
      }
    }
    set({ loaded: true })
  },

  saveItems: async (items) => {
    set({ items })
    await settingsApi.save({ [SETTINGS_KEY]: JSON.stringify(items) })
    // Limpiamos conteos de envases que ya no existen
    const validIds = new Set(items.map((i) => i.id))
    set((state) => ({
      counts: Object.fromEntries(
        Object.entries(state.counts).filter(([id]) => validIds.has(id))
      ),
    }))
  },

  increment: (id) =>
    set((state) => ({ counts: { ...state.counts, [id]: (state.counts[id] ?? 0) + 1 } })),

  decrement: (id) =>
    set((state) => ({ counts: { ...state.counts, [id]: Math.max(0, (state.counts[id] ?? 0) - 1) } })),

  setCount: (id, n) =>
    set((state) => ({ counts: { ...state.counts, [id]: Math.max(0, Math.floor(n) || 0) } })),

  clearCounts: () => set({ counts: {} }),
}))

// ─── Selectores / helpers ────────────────────────────────────────────────────────

/** Suma total de tara (en kg) a partir del catálogo y los conteos actuales. */
export function totalTareKg(items: TareItem[], counts: Record<string, number>): number {
  return items.reduce((sum, item) => sum + item.weightKg * (counts[item.id] ?? 0), 0)
}

/** Número total de envases seleccionados (para badges/resúmenes). */
export function totalTareUnits(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0)
}
