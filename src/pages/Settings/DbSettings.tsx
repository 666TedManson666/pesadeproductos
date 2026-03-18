import { useState, useEffect } from 'react'
import type { DbConfigPayload } from '../../types/electron.d'

const inputClass = `
  w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2
  text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500
  transition-colors duration-150 text-sm
`

export function DbSettings() {
  const [form,    setForm]    = useState<DbConfigPayload>({ host: 'localhost', port: 5432, database: 'pesadeproductos', user: 'postgres', password: '' })
  const [testing, setTesting] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [testOk,  setTestOk]  = useState<boolean | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI.setup.getDb().then((res) => {
      if (res.success && res.data) {
        const d = res.data as DbConfigPayload & { passwordSet: boolean }
        setForm((f) => ({ ...f, host: d.host || f.host, port: d.port || f.port, database: d.database || f.database, user: d.user || f.user }))
      }
    })
  }, [])

  function change(key: keyof DbConfigPayload, val: string | number) {
    setForm((f) => ({ ...f, [key]: val }))
    setTestOk(null); setError(null); setSuccess(null)
  }

  async function handleTest() {
    setTesting(true); setTestOk(null); setError(null)
    const res = await window.electronAPI.setup.testDb(form)
    setTesting(false)
    if (res.success) { setTestOk(true) }
    else { setTestOk(false); setError(res.error ?? 'No se pudo conectar') }
  }

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(null)
    const res = await window.electronAPI.setup.saveDb(form)
    setSaving(false)
    if (res.success) { setSuccess('Credenciales guardadas. Las tablas fueron creadas/actualizadas.') }
    else { setError(res.error ?? 'Error al guardar') }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">
        Base de Datos (PostgreSQL)
      </p>

      <div className="flex gap-3 mb-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Host</label>
          <input className={inputClass} value={form.host} onChange={(e) => change('host', e.target.value)} placeholder="localhost" />
        </div>
        <div className="w-24">
          <label className="block text-xs text-gray-400 mb-1">Puerto</label>
          <input className={inputClass} type="number" value={form.port} onChange={(e) => change('port', Number(e.target.value))} />
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-xs text-gray-400 mb-1">Base de datos</label>
        <input className={inputClass} value={form.database} onChange={(e) => change('database', e.target.value)} />
      </div>

      <div className="mb-3">
        <label className="block text-xs text-gray-400 mb-1">Usuario</label>
        <input className={inputClass} value={form.user} onChange={(e) => change('user', e.target.value)} />
      </div>

      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-1">Contraseña</label>
        <input className={inputClass} type="password" value={form.password} onChange={(e) => change('password', e.target.value)} placeholder="••••••••" autoComplete="new-password" />
      </div>

      {error   && <div className="mb-3 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-xs">{error}</div>}
      {success && <div className="mb-3 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-xs">{success}</div>}
      {testOk === true && <div className="mb-3 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-xs">✓ Conexión exitosa</div>}

      <div className="flex gap-3">
        <button onClick={handleTest} disabled={testing || saving}
          className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-white disabled:opacity-40 transition-colors text-sm">
          {testing ? 'Probando...' : 'Probar conexión'}
        </button>
        <button onClick={handleSave} disabled={saving || testing}
          className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold transition-colors text-sm">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
