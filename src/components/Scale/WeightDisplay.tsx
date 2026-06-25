const KG_TO_LB = 2.20462
const LB_TO_KG = 0.453592

interface WeightDisplayProps {
  weight: number | null
  stable: boolean
  unit?:  'kg' | 'lb'
}

function StabilityDot({ stable, hasWeight }: { stable: boolean; hasWeight: boolean }) {
  if (!hasWeight) return <span className="h-2.5 w-2.5 rounded-full bg-gray-700" />
  if (stable) return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
    </span>
  )
  return <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse" />
}

export function WeightDisplay({ weight, stable, unit = 'kg' }: WeightDisplayProps) {
  // Normalize to kg for display regardless of the scale's native unit
  const weightKg = weight !== null
    ? (unit === 'lb' ? weight * LB_TO_KG : weight)
    : null

  const kgStr = weightKg !== null ? weightKg.toFixed(3).padStart(10, '0') : '----.---'
  const lbStr = weightKg !== null ? (weightKg * KG_TO_LB).toFixed(3).padStart(10, '0') : '----.---'

  const hasWeight = weight !== null

  const kgColor   = !hasWeight ? 'text-gray-700' : stable ? 'text-green-400' : 'text-yellow-400'
  const lbColor   = !hasWeight ? 'text-gray-700' : stable ? 'text-violet-300' : 'text-yellow-400'
  const kgBorder  = !hasWeight ? 'border-gray-800' : stable ? 'border-green-700/60' : 'border-yellow-700/60'
  const lbBorder  = !hasWeight ? 'border-gray-800' : stable ? 'border-violet-700/60' : 'border-yellow-700/60'
  const kgBg      = !hasWeight ? 'bg-kiosk-card/40' : stable ? 'bg-green-950/40' : 'bg-yellow-950/30'
  const lbBg      = !hasWeight ? 'bg-kiosk-card/40' : stable ? 'bg-violet-950/40' : 'bg-yellow-950/30'

  const statusText  = !hasWeight ? 'Sin señal' : stable ? 'Estable' : 'Oscilando'
  const statusColor = !hasWeight ? 'text-gray-600' : stable ? 'text-green-400' : 'text-yellow-400'

  return (
    <div className="grid grid-cols-2 gap-2 px-4 pt-3 pb-1">
      {/* KG card */}
      <div className={`rounded-xl border-2 px-3 py-2 select-none transition-all duration-300 ${kgBorder} ${kgBg}`}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-6 h-6 rounded-md bg-blue-700 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
            kg
          </span>
          <span className="text-[10px] font-bold text-blue-300/70 tracking-widest uppercase">
            Kilogramos
          </span>
        </div>
        <div className={`font-mono font-black text-2xl tracking-wider transition-colors duration-200 ${kgColor}`}>
          {kgStr}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <StabilityDot stable={stable} hasWeight={hasWeight} />
          <span className={`text-[10px] font-bold uppercase tracking-wide ${statusColor}`}>{statusText}</span>
        </div>
      </div>

      {/* LB card */}
      <div className={`rounded-xl border-2 px-3 py-2 select-none transition-all duration-300 ${lbBorder} ${lbBg}`}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-6 h-6 rounded-md bg-violet-700 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
            lb
          </span>
          <span className="text-[10px] font-bold text-violet-300/70 tracking-widest uppercase">
            Libras
          </span>
        </div>
        <div className={`font-mono font-black text-2xl tracking-wider transition-colors duration-200 ${lbColor}`}>
          {lbStr}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <StabilityDot stable={stable} hasWeight={hasWeight} />
          <span className={`text-[10px] font-bold uppercase tracking-wide ${statusColor}`}>{statusText}</span>
        </div>
      </div>
    </div>
  )
}
