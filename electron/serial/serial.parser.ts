import type { ParsedWeight } from './serial.types'

/**
 * Parses a raw serial string from the scale.
 * The regex must contain a capture group for the numeric value.
 *
 * Designed for scales that send strings like: "15.5 KG G"
 * Recommended regex: ([0-9]+\.?[0-9]*)\s*KG\s*G
 *
 * Also compatible with other formats:
 *   "ST,GS,+   5.230kg\r\n"   → Toledo/Mettler
 *   "  5.230\r\n"              → generic
 *
 * NOTE: Stability (the `stable` flag) is determined by the SerialManager
 * via a time-based debounce, not by this parser.
 */
export function parseWeight(raw: string, regexStr: string): ParsedWeight {
  const trimmed = raw.trim()

  try {
    const regex = new RegExp(regexStr)
    const match = trimmed.match(regex)

    if (!match || match[1] === undefined) {
      return { raw: trimmed, value: null, stable: false }
    }

    const value = parseFloat(match[1])
    if (isNaN(value)) {
      return { raw: trimmed, value: null, stable: false }
    }

    // stable is always false here; SerialManager sets it after debounce check
    return { raw: trimmed, value, stable: false }
  } catch {
    return { raw: trimmed, value: null, stable: false }
  }
}
