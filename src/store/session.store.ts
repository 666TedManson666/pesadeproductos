import { create } from 'zustand'
import type { Session, Weighing } from '../types'

type WeighingMode = 'SESSION' | 'QUICK'

interface SessionStore {
  mode:               WeighingMode
  activeSession:      Session | null
  selectedWarehouseId: number | null
  selectedProductId:  number | null
  recentWeighings:    Weighing[]

  setMode:        (m: WeighingMode)    => void
  setSession:     (s: Session | null)  => void
  setWarehouse:   (id: number | null)  => void
  setProduct:     (id: number | null)  => void
  addWeighing:    (w: Weighing)        => void
  clearRecent:    ()                   => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  mode:                'QUICK',
  activeSession:       null,
  selectedWarehouseId: null,
  selectedProductId:   null,
  recentWeighings:     [],

  setMode:      (mode)    => set({ mode }),
  setSession:   (session) => set({ activeSession: session }),
  setWarehouse: (id)      => set({ selectedWarehouseId: id }),
  setProduct:   (id)      => set({ selectedProductId: id }),

  addWeighing: (w) =>
    set((state) => ({
      recentWeighings: [w, ...state.recentWeighings].slice(0, 50),
    })),

  clearRecent: () => set({ recentWeighings: [] }),
}))
