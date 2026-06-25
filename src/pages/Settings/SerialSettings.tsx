import { useState, useEffect } from 'react'
import { Input }   from '../../components/ui/Input'
import { Select }  from '../../components/ui/Select'
import { Button }  from '../../components/ui/Button'
import { useSettingsStore } from '../../store/settings.store'
import { serialApi }        from '../../api/electron.api'
import { ConnectionTester } from './ConnectionTester'
import type { SerialConfig, AvailablePort } from '../../types'

function ScaleForm({
  config,
  onSave,
  ports,
  onRefreshPorts,
}: {
  config:          SerialConfig
  onSave:          (c: SerialConfig) => Promise<void>
  ports:           AvailablePort[]
  onRefreshPorts:  () => void
}) {
  const [form,   setForm]   = useState<SerialConfig>(config)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => { setForm(config) }, [config])

  function set<K extends keyof SerialConfig>(key: K, value: SerialConfig[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Puerto Serial</h3>

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
              <Button variant="ghost" size="sm" onClick={onRefreshPorts} title="Actualizar lista de puertos">
                ↻
              </Button>
            </div>
          </div>

          <Select label="Baud Rate" value={String(form.baudRate)}
            onChange={(e) => set('baudRate', Number(e.target.value))}>
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

        <Select label="Fin de línea (delimiter)" value={form.delimiter}
          onChange={(e) => set('delimiter', e.target.value as SerialConfig['delimiter'])}>
          <option value="CR">CR — \r (más común en básculas industriales)</option>
          <option value="LF">LF — \n</option>
          <option value="CRLF">CR+LF — \r\n</option>
        </Select>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Formato de Peso</h3>
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

      <div className="flex items-center gap-4">
        <Button variant="primary" size="md" loading={saving} onClick={handleSave}>
          {saved ? '✓ Guardado' : 'Guardar configuración'}
        </Button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Prueba de Conexión</h3>
        <ConnectionTester config={form} />
      </div>
    </div>
  )
}

export function SerialSettings() {
  const { serialConfig, serialConfig2, saveSerialConfig, saveSerialConfig2 } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<1 | 2>(1)
  const [ports, setPorts] = useState<AvailablePort[]>([])

  function refreshPorts() {
    serialApi.listPorts().then((r) => { if (r.success) setPorts(r.data ?? []) })
  }

  useEffect(() => { refreshPorts() }, [])

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-900/80 rounded-xl border border-gray-800 w-fit">
        <button
          onClick={() => setActiveTab(1)}
          className={[
            'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-black tracking-wide transition-all',
            activeTab === 1
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50',
          ].join(' ')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          PESA 1
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={[
            'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-black tracking-wide transition-all',
            activeTab === 2
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50',
          ].join(' ')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          PESA 2
        </button>
      </div>

      {activeTab === 1 ? (
        <ScaleForm
          config={serialConfig}
          onSave={saveSerialConfig}
          ports={ports}
          onRefreshPorts={refreshPorts}
        />
      ) : (
        <ScaleForm
          config={serialConfig2}
          onSave={saveSerialConfig2}
          ports={ports}
          onRefreshPorts={refreshPorts}
        />
      )}
    </div>
  )
}
