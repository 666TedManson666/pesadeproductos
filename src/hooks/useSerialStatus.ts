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
    console.log('[HOOK-DEBUG] useSerialStatus: montando, registrando onStatusChange')
    const handler = (s: SerialStatus) => {
      console.log('[HOOK-DEBUG] Status serial recibido:', JSON.stringify(s))
      setStatus(s)
    }
    window.electronAPI.onStatusChange(handler)
    return () => {
      console.log('[HOOK-DEBUG] useSerialStatus: desmontando')
      window.electronAPI.removeListener('serial:statusChange')
    }
  }, [setStatus])
}
