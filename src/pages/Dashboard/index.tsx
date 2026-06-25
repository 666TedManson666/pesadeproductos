import { KioskHeader }              from './KioskHeader'
import { WeighingPanel }             from './WeighingPanel'
import { RecentWeighings }           from './RecentWeighings'
import { useScaleSelectorStore }     from '../../store/scaleSelector.store'

const SCALE_THEME = {
  1: {
    bar:    'bg-teal-600',
    badge:  'bg-teal-700/80 border-teal-500/60 text-teal-200',
    glow:   'shadow-teal-900/40',
    label:  'PESA 1',
    dot:    'bg-teal-400',
  },
  2: {
    bar:    'bg-amber-500',
    badge:  'bg-amber-700/80 border-amber-500/60 text-amber-200',
    glow:   'shadow-amber-900/40',
    label:  'PESA 2',
    dot:    'bg-amber-400',
  },
} as const

export default function Dashboard() {
  const { activeScale } = useScaleSelectorStore()
  const theme = SCALE_THEME[activeScale]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <KioskHeader />

      {/* Franja de color delgada que indica visualmente la pesa activa */}
      <div className={`h-1 w-full flex-shrink-0 transition-colors duration-300 ${theme.bar}`} />

      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Left: controls */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Badge inline — siempre visible, no obstruye */}
          <div className={`flex items-center gap-2 mx-4 mt-3 px-3 py-2 rounded-xl border text-xs font-black tracking-widest uppercase transition-all duration-300 w-fit ${theme.badge}`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${theme.dot}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.dot}`} />
            </span>
            Activo: {theme.label}
          </div>

          <div className="flex-1 overflow-y-auto">
            <WeighingPanel />
          </div>
        </div>

        {/* Right: recent weighings */}
        <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col border-l border-kiosk-border bg-kiosk-surface/50 overflow-hidden">
          <RecentWeighings />
        </div>
      </div>
    </div>
  )
}
