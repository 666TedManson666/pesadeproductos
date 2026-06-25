import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScaleStore }         from '../../store/scale.store'
import { useScaleSelectorStore } from '../../store/scaleSelector.store'

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
        d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  )
}

export function KioskHeader() {
  const scale1Status              = useScaleStore((s) => s.scales[1].status)
  const scale2Status              = useScaleStore((s) => s.scales[2].status)
  const { activeScale, setScale } = useScaleSelectorStore()
  const navigate                  = useNavigate()
  const [now, setNow]             = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateStr = now.toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const is1 = activeScale === 1
  const is2 = activeScale === 2

  const activeStatus = is1 ? scale1Status : scale2Status

  return (
    <header className="flex items-center justify-between px-5 py-2 bg-kiosk-header border-b border-kiosk-border select-none flex-shrink-0 gap-4">

      {/* Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center text-lg shadow-lg">🐓</div>
        <div>
          <p className="text-sm font-black text-white tracking-wide leading-tight">
            PESA <span className="text-brand-400">PRODUCCIÓN</span>
          </p>
          <p className="text-[9px] text-gray-500 tracking-widest uppercase">Sistema de pesaje</p>
        </div>
      </div>

      {/* ── SCALE SWITCHER ── */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-900/80 rounded-2xl border border-gray-700/60 shadow-inner">

        {/* Pesa 1 */}
        <button
          onClick={() => setScale(1)}
          className={[
            'flex items-center gap-2 px-5 py-2 rounded-xl font-black text-sm tracking-wide transition-all duration-200',
            is1
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/60 scale-105'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50',
          ].join(' ')}
        >
          <ScaleIcon className="w-4 h-4" />
          PESA 1
          {/* Status dot for scale 1 */}
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
            scale1Status.connected ? 'bg-green-400' : 'bg-red-500'
          } ${is1 && scale1Status.connected ? 'animate-pulse' : ''}`} />
        </button>

        <span className="text-gray-700 font-black text-xs">/</span>

        {/* Pesa 2 */}
        <button
          onClick={() => setScale(2)}
          className={[
            'flex items-center gap-2 px-5 py-2 rounded-xl font-black text-sm tracking-wide transition-all duration-200',
            is2
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/60 scale-105'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50',
          ].join(' ')}
        >
          <ScaleIcon className="w-4 h-4" />
          PESA 2
          {/* Status dot for scale 2 */}
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
            scale2Status.connected ? 'bg-green-400' : 'bg-red-500'
          } ${is2 && scale2Status.connected ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      {/* Status + time + nav */}
      <div className="flex items-center gap-3 flex-shrink-0">

        {/* Active scale connection pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase transition-colors ${
          activeStatus.connected
            ? 'bg-green-950/60 border-green-700/60 text-green-400'
            : 'bg-red-950/60 border-red-700/60 text-red-400'
        }`}>
          <span className="relative flex h-2 w-2">
            {activeStatus.connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${activeStatus.connected ? 'bg-green-400' : 'bg-red-500'}`} />
          </span>
          {activeStatus.connected ? `${activeStatus.portName}` : 'Desconectado'}
        </div>

        <div className="h-4 w-px bg-gray-700" />

        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-mono">{dateStr}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white">
          <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono font-bold">{timeStr}</span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        <button onClick={() => navigate('/history')} title="Consultas"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button onClick={() => navigate('/settings')} title="Configuración"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  )
}
