import { useEffect } from 'react'
import { useScaleStore } from '../store/scale.store'
import type { ParsedWeight } from '../types'

/**
 * Subscribes to serial:weightUpdate:1 and serial:weightUpdate:2 push events
 * and writes updates into the per-scale store.
 * Call this hook once at the app shell level.
 */
export function useScaleWeight(): void {
  const setWeight = useScaleStore((s) => s.setWeight)

  useEffect(() => {
    const h1 = (w: ParsedWeight) => setWeight(1, w)
    const h2 = (w: ParsedWeight) => setWeight(2, w)
    window.electronAPI.onWeightUpdate(1, h1)
    window.electronAPI.onWeightUpdate(2, h2)
    return () => {
      window.electronAPI.removeListener('serial:weightUpdate:1')
      window.electronAPI.removeListener('serial:weightUpdate:2')
    }
  }, [setWeight])
}
