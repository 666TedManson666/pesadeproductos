import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../store/session.store'
import { weighingsApi, settingsApi } from '../../api/electron.api'
import type { Weighing } from '../../types'

function getProductAccent(name: string) {
  const u = name.toUpperCase()
  if (u.includes('FILETITO'))                                                                              return { border: 'border-l-blue-500',   badge: 'bg-blue-500',   emoji: '🫀' }
  if (u.includes('FILETE'))                                                                                return { border: 'border-l-stone-500',  badge: 'bg-stone-500',  emoji: '🥩' }
  if (u.includes('PECHUGA'))                                                                               return { border: 'border-l-orange-400', badge: 'bg-orange-400', emoji: '🍗' }
  if (u.includes('MUSLO') || u.includes('ENCUENTRO'))                                                     return { border: 'border-l-green-500',  badge: 'bg-green-500',  emoji: '🍖' }
  if (u.includes('ALAS'))                                                                                  return { border: 'border-l-lime-500',   badge: 'bg-lime-500',   emoji: '🍗' }
  if (u.includes('ROSTY') && u.includes('CHICO'))                                                         return { border: 'border-l-purple-500', badge: 'bg-purple-500', emoji: '🍗' }
  if (u.includes('ROSTY'))                                                                                 return { border: 'border-l-rose-500',   badge: 'bg-rose-500',   emoji: '🍗' }
  if (u.includes('HIGADO') || u.includes('MOLLEJAS') || u.includes('CABEZA') || u.includes('PICAD') || u.includes('MENUDO'))
                                                                                                           return { border: 'border-l-blue-500',   badge: 'bg-blue-500',   emoji: '🫀' }
  if (u.includes('GALLINA') || u.includes('GALLO') || u.includes('PATITAS') || u.includes('PESCUEZO'))   return { border: 'border-l-pink-400',   badge: 'bg-pink-400',   emoji: '🐔' }
  if (u.includes('POLLO'))                                                                                 return { border: 'border-l-sky-500',    badge: 'bg-sky-500',    emoji: '🐔' }
  if (u.includes('HUEVO'))                                                                                 return { border: 'border-l-yellow-500', badge: 'bg-yellow-500', emoji: '🥚' }
  return                                                                                                    { border: 'border-l-gray-500',          badge: 'bg-gray-600',   emoji: '📦' }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })
}

export function RecentWeighings() {
  const navigate = useNavigate()
  const { recentWeighings, removeWeighing } = useSessionStore()
  const [deleting, setDeleting] = useState(false)

  const totalKg = recentWeighings.reduce((sum, w) => sum + Number(w.weightKg), 0)

  async function handleDeleteLast() {
    if (recentWeighings.length === 0 || deleting) return
    setDeleting(true)
    const last = recentWeighings[0]
    const res = await weighingsApi.delete({ id: last.id })
    if (res.success) removeWeighing(last.id)
    setDeleting(false)
  }

  async function handleReconnect() {
    await settingsApi.connectFromSaved()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-kiosk-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-xs font-black text-white uppercase tracking-widest">Pesajes Recientes</h2>
          </div>
          <span className="text-xs text-gray-600 tabular-nums">{recentWeighings.length}</span>
        </div>
        {totalKg > 0 && (
          <p className="text-xs text-gray-600 mt-0.5">
            Total: <span className="text-green-400 font-bold font-mono">{totalKg.toFixed(3)} kg</span>
          </p>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {recentWeighings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
            <svg className="w-14 h-14 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <p className="text-xs text-gray-700 font-medium">Sin pesajes en esta sesión</p>
          </div>
        ) : (
          <div>
            {recentWeighings.map((w: Weighing, i) => {
              const a = getProductAccent(w.productName)
              const isFirst = i === 0
              return (
                <div
                  key={w.id}
                  className={[
                    'flex items-center gap-3 px-4 py-2.5 border-l-4',
                    a.border,
                    'hover:bg-white/[0.03] transition-colors',
                    isFirst ? 'bg-white/[0.04]' : '',
                    i < recentWeighings.length - 1 ? 'border-b border-gray-800/40' : '',
                  ].join(' ')}
                >
                  <div className={`w-9 h-9 rounded-xl ${a.badge} flex items-center justify-center text-base flex-shrink-0 shadow-sm`}>
                    {a.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-200 truncate leading-tight">{w.productName}</p>
                    <p className="text-[10px] text-gray-600 truncate mt-0.5">{w.warehouseName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black font-mono text-green-400 leading-tight">
                      {Number(w.weightKg).toFixed(3)}
                      <span className="text-[10px] text-gray-600 font-normal ml-0.5">kg</span>
                    </p>
                    <p className="text-[10px] text-gray-700 tabular-nums">{formatTime(w.capturedAt)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-3 border-t border-kiosk-border flex-shrink-0 space-y-2">
        {/* Delete last */}
        <button
          onClick={handleDeleteLast}
          disabled={recentWeighings.length === 0 || deleting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
            bg-red-700 hover:bg-red-600 active:bg-red-800
            text-white font-bold text-sm border border-red-600/60
            transition-all disabled:opacity-30 disabled:cursor-not-allowed
            shadow-md shadow-red-950/40"
        >
          {deleting ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
          Eliminar Último
        </button>

        {/* Nav buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl
              bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50
              text-gray-400 hover:text-gray-200 text-xs font-bold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuración
          </button>
          <button
            onClick={handleReconnect}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl
              bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50
              text-gray-400 hover:text-gray-200 text-xs font-bold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            Conectar Balanza
          </button>
        </div>
      </div>
    </div>
  )
}
