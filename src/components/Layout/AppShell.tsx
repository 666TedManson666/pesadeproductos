import React, { useEffect } from 'react'
import { NavSidebar } from './NavSidebar'
import { useScaleWeight }  from '../../hooks/useScaleWeight'
import { useSerialStatus } from '../../hooks/useSerialStatus'
import { useSettingsStore } from '../../store/settings.store'
import { useSessionStore }  from '../../store/session.store'
import { sessionsApi }  from '../../api/electron.api'
import type { Session } from '../../types'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  // Register IPC event listeners once, at the app shell level
  useScaleWeight()
  useSerialStatus()

  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const setSession   = useSessionStore((s) => s.setSession)

  useEffect(() => {
    loadSettings()

    // Restore any previously opened session
    sessionsApi.getActive().then((res) => {
      if (res.success && res.data) setSession(res.data as Session)
    })
  }, [loadSettings, setSession])

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
