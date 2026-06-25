import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { NavSidebar } from './NavSidebar'
import { useScaleWeight }  from '../../hooks/useScaleWeight'
import { useSerialStatus } from '../../hooks/useSerialStatus'
import { useSettingsStore } from '../../store/settings.store'
import { useSessionStore }  from '../../store/session.store'
import { sessionsApi, settingsApi } from '../../api/electron.api'
import type { Session } from '../../types'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  useScaleWeight()
  useSerialStatus()

  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const setSession   = useSessionStore((s) => s.setSession)
  const location     = useLocation()
  const isKiosk      = location.pathname === '/'

  useEffect(() => {
    loadSettings()
    sessionsApi.getActive().then((res) => {
      if (res.success && res.data) setSession(res.data as Session)
    })
    // Connect both scales from saved settings
    settingsApi.connectFromSaved()
    settingsApi.connectFromSaved2()
  }, [loadSettings, setSession])

  if (isKiosk) {
    return (
      <div className="h-screen bg-kiosk-bg text-gray-100 overflow-hidden">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
