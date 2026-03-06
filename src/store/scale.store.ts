import { create } from 'zustand'
import type { SerialStatus, ParsedWeight } from '../types'

interface ScaleStore {
  weight:   number | null
  rawData:  string | null
  stable:   boolean
  status:   SerialStatus
  setWeight: (w: ParsedWeight) => void
  setStatus: (s: SerialStatus) => void
}

const defaultStatus: SerialStatus = {
  connected:  false,
  portName:   null,
  error:      null,
  lastReadAt: null,
}

export const useScaleStore = create<ScaleStore>((set) => ({
  weight:  null,
  rawData: null,
  stable:  false,
  status:  defaultStatus,

  setWeight: (w) => set({ weight: w.value, rawData: w.raw, stable: w.stable }),
  setStatus: (s) => set({ status: s }),
}))
