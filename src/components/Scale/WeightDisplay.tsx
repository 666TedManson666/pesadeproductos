interface WeightDisplayProps {
  weight:  number | null
  stable:  boolean
  unit?:   string
}

export function WeightDisplay({ weight, stable, unit = 'kg' }: WeightDisplayProps) {
  const display = weight !== null ? weight.toFixed(3) : '---.-'

  const colorClass = weight === null
    ? 'text-gray-600'
    : stable
    ? 'text-green-400'
    : 'text-yellow-400'

  return (
    <div className="flex flex-col items-center justify-center bg-gray-950 rounded-2xl border border-gray-700 p-6 select-none">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
        Peso en Pesa
      </p>
      <div className={`font-mono font-bold text-7xl tracking-wider transition-colors duration-150 ${colorClass}`}>
        {display}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className="text-2xl font-light text-gray-400">{unit}</span>
        {weight !== null && (
          <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
            stable
              ? 'bg-green-900/50 text-green-400 border border-green-700'
              : 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
          }`}>
            {stable ? 'Estable' : 'Oscilando'}
          </span>
        )}
      </div>
    </div>
  )
}
