import { create } from 'zustand'

interface ScaleSelectorStore {
  activeScale: 1 | 2
  setScale:    (n: 1 | 2) => void
}

export const useScaleSelectorStore = create<ScaleSelectorStore>((set) => ({
  activeScale: 1,
  setScale: (n) => set({ activeScale: n }),
}))
