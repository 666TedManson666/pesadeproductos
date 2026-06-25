import { useEffect } from 'react'
import { useScaleStore } from '../store/scale.store'
import type { SerialStatus } from '../types'

/**
 * Subscribes to serial:statusChange:1 and serial:statusChange:2 push events
 * and updates the per-scale store.
 * Call once at the app shell level.
 */
export function useSerialStatus(): void {
  const setStatus = useScaleStore((s) => s.setStatus)

  useEffect(() => {
    const h1 = (s: SerialStatus) => setStatus(1, s)
    const h2 = (s: SerialStatus) => setStatus(2, s)
    window.electronAPI.onStatusChange(1, h1)
    window.electronAPI.onStatusChange(2, h2)
    return () => {
      window.electronAPI.removeListener('serial:statusChange:1')
      window.electronAPI.removeListener('serial:statusChange:2')
    }
  }, [setStatus])
}
