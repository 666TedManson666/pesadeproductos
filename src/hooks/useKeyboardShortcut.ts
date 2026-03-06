import { useEffect, useCallback } from 'react'

/**
 * Triggers a callback when the specified key is pressed.
 * Defaults to Enter and F5 for capturing weight.
 */
export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  enabled = true
): void {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return
      if (keys.includes(e.key)) {
        e.preventDefault()
        callback()
      }
    },
    [keys, callback, enabled]
  )

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}
