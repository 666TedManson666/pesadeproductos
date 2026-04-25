import { useEffect } from 'react'
import { useScaleStore } from '../store/scale.store'
import type { ParsedWeight } from '../types'

/**
 * Subscribes to the serial:weightUpdate push event from the main process
 * and writes updates into the scale store.
 * Call this hook once at the app shell level.
 */
export function useScaleWeight(): void {
  const setWeight = useScaleStore((s) => s.setWeight)

  useEffect(() => {
    console.log('[HOOK-DEBUG] useScaleWeight: montando, registrando onWeightUpdate')
    const handler = (w: ParsedWeight) => {
      console.log('[HOOK-DEBUG] Peso recibido en hook:', JSON.stringify(w))
      setWeight(w)
    }
    window.electronAPI.onWeightUpdate(handler)
    return () => {
      console.log('[HOOK-DEBUG] useScaleWeight: desmontando, removiendo listeners')
      window.electronAPI.removeListener('serial:weightUpdate')
    }
  }, [setWeight])
}
