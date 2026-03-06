import { useState, useEffect } from 'react'
import { Input }   from '../../components/ui/Input'
import { Select }  from '../../components/ui/Select'
import { Button }  from '../../components/ui/Button'
import { useSettingsStore } from '../../store/settings.store'
import { serialApi }        from '../../api/electron.api'
import { ConnectionTester } from './ConnectionTester'
import type { SerialConfig, AvailablePort } from '../../types'

export function SerialSettings() {
  const { serialConfig, saveSerialConfig } = useSettingsStore()
  const [form,    setForm]    = useState<SerialConfig>(serialConfig)
  const [ports,   setPorts]   = useState<AvailablePort[]>([])
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => { setForm(serialConfig) }, [serialConfig])

  useEffect(() => {
    serialApi.listPorts().then((r) => { if (r.success) setPorts(r.data ?? []) })
  }, [])

  function set<K extends keyof SerialConfig>(key: K, value: SerialConfig[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await saveSerialConfig(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Port selection */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Puerto Serial
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Puerto</label>
            <div className="flex gap-2">
              <select
                value={form.port}
                onChange={(e) => set('port', e.target.value)}
                className="flex-1 rounded-lg bg-gray-800 border border-gray-600 text-gray-100 px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {ports.length === 0 && <option value={form.port}>{form.port}</option>}
                {ports.map((p) => (
                  <option key={p.path} value={p.path}>
                    {p.path}{p.manufacturer ? ` — ${p.manufacturer}` : ''}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => serialApi.listPorts().then((r) => { if (r.success) setPorts(r.data ?? []) })}
                title="Actualizar lista de puertos"
              >
                ↻
              </Button>
            </div>
          </div>

          <Select
            label="Baud Rate"
            value={String(form.baudRate)}
            onChange={(e) => set('baudRate', Number(e.target.value))}
          >
            {[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select label="Bits de datos" value={String(form.dataBits)}
            onChange={(e) => set('dataBits', Number(e.target.value) as 5|6|7|8)}>
            {[5, 6, 7, 8].map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>

          <Select label="Bits de parada" value={String(form.stopBits)}
            onChange={(e) => set('stopBits', Number(e.target.value) as 1|1.5|2)}>
            {[1, 1.5, 2].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>

          <Select label="Paridad" value={form.parity}
            onChange={(e) => set('parity', e.target.value as SerialConfig['parity'])}>
            {['none','even','odd','mark','space'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Weight parsing */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Formato de Peso
        </h3>
        <p className="text-xs text-gray-500">
          Expresión regular para extraer el valor numérico del dato crudo de la pesa.
          El primer grupo de captura <code className="text-gray-300">( )</code> debe contener el número.
        </p>

        <Input
          label="Regex de peso"
          value={form.weightRegex}
          onChange={(e) => set('weightRegex', e.target.value)}
          placeholder="([0-9]+\.?[0-9]*)"
          className="font-mono"
        />

        <Select label="Unidad" value={form.unit}
          onChange={(e) => set('unit', e.target.value as 'kg' | 'lb')}>
          <option value="kg">Kilogramos (kg)</option>
          <option value="lb">Libras (lb)</option>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button variant="primary" size="md" loading={saving} onClick={handleSave}>
          {saved ? '✓ Guardado' : 'Guardar configuración'}
        </Button>
      </div>

      {/* Connection test */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Prueba de Conexión
        </h3>
        <ConnectionTester config={form} />
      </div>
    </div>
  )
}
