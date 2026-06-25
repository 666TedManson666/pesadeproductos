import { create } from 'zustand'
import type { SerialStatus, ParsedWeight } from '../types'

interface ScaleData {
  weight:  number | null
  rawData: string | null
  stable:  boolean
  status:  SerialStatus
}

interface ScaleStore {
  scales:    { 1: ScaleData; 2: ScaleData }
  setWeight: (id: 1 | 2, w: ParsedWeight) => void
  setStatus: (id: 1 | 2, s: SerialStatus) => void
}

const defaultStatus: SerialStatus = {
  connected:  false,
  portName:   null,
  error:      null,
  lastReadAt: null,
}

const defaultScale: ScaleData = {
  weight:  null,
  rawData: null,
  stable:  false,
  status:  defaultStatus,
}

export const useScaleStore = create<ScaleStore>((set) => ({
  scales: { 1: { ...defaultScale }, 2: { ...defaultScale } },

  setWeight: (id, w) =>
    set((state) => ({
      scales: {
        ...state.scales,
        [id]: { ...state.scales[id], weight: w.value, rawData: w.raw, stable: w.stable },
      },
    })),

  setStatus: (id, s) =>
    set((state) => ({
      scales: {
        ...state.scales,
        [id]: { ...state.scales[id], status: s },
      },
    })),
}))
