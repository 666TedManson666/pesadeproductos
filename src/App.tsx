import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppShell }    from './components/Layout/AppShell'
import { SetupPage }   from './pages/Setup/index'
import Dashboard       from './pages/Dashboard/index'
import History         from './pages/History/index'
import Settings        from './pages/Settings/index'
import Maintenance     from './pages/Maintenance/index'

export default function App() {
  // null = loading, false = needs setup, true = ready
  const [dbReady, setDbReady] = useState<boolean | null>(null)

  useEffect(() => {
    console.log('[APP-DEBUG] App montada, llamando app:getStatus...')
    window.electronAPI.app.getStatus()
      .then(({ dbReady }) => {
        console.log('[APP-DEBUG] app:getStatus respondió dbReady=' + dbReady)
        setDbReady(dbReady)
      })
      .catch((err) => {
        console.error('[APP-DEBUG] ⚠️ app:getStatus falló:', err)
        setDbReady(false)
      })
  }, [])

  // Loading splash while we wait for the IPC response
  if (dbReady === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🐓</div>
          <p className="text-gray-400 text-sm animate-pulse">Iniciando sistema...</p>
        </div>
      </div>
    )
  }

  if (!dbReady) {
    return (
      <SetupPage
        onComplete={() => {
          window.electronAPI.setup.notifyDone()
          setDbReady(true)
        }}
      />
    )
  }

  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/"             element={<Dashboard />}    />
          <Route path="/history"      element={<History />}      />
          <Route path="/settings"     element={<Settings />}     />
          <Route path="/maintenance"  element={<Maintenance />}  />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}
