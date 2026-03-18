import { useState, useEffect } from 'react'

interface DbForm {
  host:     string
  port:     number
  database: string
  user:     string
  password: string
}

const DEFAULTS: DbForm = {
  host:     'localhost',
  port:     5432,
  database: 'pesadeproductos',
  user:     'postgres',
  password: '',
}

interface SetupPageProps {
  onComplete: () => void
}

export function SetupPage({ onComplete }: SetupPageProps) {
  const [form,    setForm]    = useState<DbForm>(DEFAULTS)
  const [testing, setTesting] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [testOk,  setTestOk]  = useState<boolean | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  // Load existing saved config to pre-fill
  useEffect(() => {
    window.electronAPI.setup.getDb().then((res) => {
      if (res.success && res.data) {
        const d = res.data as DbForm & { passwordSet: boolean }
        setForm((f) => ({
          ...f,
          host:     d.host     || f.host,
          port:     d.port     || f.port,
          database: d.database || f.database,
          user:     d.user     || f.user,
        }))
      }
    })
  }, [])

  function change(key: keyof DbForm, val: string | number) {
    setForm((f) => ({ ...f, [key]: val }))
    setTestOk(null)
    setError(null)
  }

  async function handleTest() {
    setTesting(true)
    setTestOk(null)
    setError(null)
    const res = await window.electronAPI.setup.testDb(form)
    setTesting(false)
    if (res.success) {
      setTestOk(true)
    } else {
      setTestOk(false)
      setError(res.error ?? 'No se pudo conectar')
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const res = await window.electronAPI.setup.saveDb(form)
    setSaving(false)
    if (res.success) {
      window.electronAPI.setup.notifyDone()
      onComplete()
    } else {
      setError(res.error ?? 'Error al guardar')
    }
  }

  const inputClass = `
    w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2
    text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500
    transition-colors duration-150
  `

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🐓</div>
          <h1 className="text-2xl font-bold text-white">PesaDeProductos</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Configuración inicial de base de datos
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-xl">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-5">
            Conexión a PostgreSQL
          </p>

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Host</label>
              <input className={inputClass} value={form.host}
                onChange={(e) => change('host', e.target.value)} placeholder="localhost" />
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-400 mb-1">Puerto</label>
              <input className={inputClass} type="number" value={form.port}
                onChange={(e) => change('port', Number(e.target.value))} />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">Base de datos</label>
            <input className={inputClass} value={form.database}
              onChange={(e) => change('database', e.target.value)} placeholder="pesadeproductos" />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">Usuario</label>
            <input className={inputClass} value={form.user}
              onChange={(e) => change('user', e.target.value)} placeholder="postgres" />
          </div>

          <div className="mb-6">
            <label className="block text-xs text-gray-400 mb-1">Contraseña</label>
            <input className={inputClass} type="password" value={form.password}
              onChange={(e) => change('password', e.target.value)}
              placeholder="••••••••" autoComplete="new-password" />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Test result */}
          {testOk === true && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-sm">
              ✓ Conexión exitosa
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={testing || saving || !form.password}
              className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300
                         hover:border-indigo-500 hover:text-white disabled:opacity-40
                         transition-colors duration-150 text-sm font-medium"
            >
              {testing ? 'Probando...' : 'Probar conexión'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || testing || !form.password}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500
                         disabled:bg-gray-700 disabled:text-gray-500
                         text-white font-semibold transition-colors duration-150 text-sm"
            >
              {saving ? 'Guardando...' : 'Guardar y continuar →'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-600 mt-4">
            Esta configuración se guarda localmente y solo necesitas hacerla una vez.
          </p>
        </div>

        {/* Prereq reminder */}
        <p className="text-center text-xs text-gray-600 mt-4">
          Asegúrate de que PostgreSQL esté corriendo y la base de datos{' '}
          <span className="font-mono text-gray-500">{form.database}</span> exista.
        </p>
      </div>
    </div>
  )
}
