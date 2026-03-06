import { useScaleStore } from '../../store/scale.store'

export function StatusIndicator() {
  const { connected, portName, error } = useScaleStore((s) => s.status)

  if (connected) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-green-400 font-medium">Pesa conectada</span>
        {portName && <span className="text-gray-500">({portName})</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="h-2 w-2 rounded-full bg-gray-600" />
      <span className="text-gray-500">Pesa desconectada</span>
      {error && <span className="text-red-400 truncate max-w-40" title={error}>— {error}</span>}
    </div>
  )
}
