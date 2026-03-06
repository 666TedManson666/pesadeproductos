import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/Layout/AppShell'
import Dashboard    from './pages/Dashboard/index'
import History      from './pages/History/index'
import Settings     from './pages/Settings/index'

export default function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/history"  element={<History />}   />
          <Route path="/settings" element={<Settings />}  />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}
