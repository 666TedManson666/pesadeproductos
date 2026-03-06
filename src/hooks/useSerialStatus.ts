import { useEffect } from 'react'
import { useScaleStore } from '../store/scale.store'
import type { SerialStatus } from '../types'

/**
 * Subscribes to serial:statusChange and updates the scale store.
 * Call once at the app shell level.
 */
export function useSerialStatus(): void {
  const setStatus = useScaleStore((s) => s.setStatus)

  useEffect(() => {
    const handler = (s: SerialStatus) => setStatus(s)
    window.electronAPI.onStatusChange(handler)
    return () => window.electronAPI.removeListener('serial:statusChange')
  }, [setStatus])
}
