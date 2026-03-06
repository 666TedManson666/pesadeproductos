import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { serialApi } from '../../api/electron.api'
import type { SerialConfig } from '../../types'

interface ConnectionTesterProps {
  config: SerialConfig
}

export function ConnectionTester({ config }: ConnectionTesterProps) {
  const [testing, setTesting]   = useState(false)
  const [result,  setResult]    = useState<string | null>(null)
  const [isError, setIsError]   = useState(false)

  async function handleTest() {
    setTesting(true)
    setResult(null)
    const res = await serialApi.testConnection(config)
    setTesting(false)

    if (res.success) {
      const sample = (res.data as { rawSample: string | null }).rawSample
      if (sample) {
        setResult(`Dato recibido: "${sample}"`)
        setIsError(false)
      } else {
        setResult('Puerto abierto pero sin datos en 3 segundos. Verifica la pesa.')
        setIsError(false)
      }
    } else {
      setResult(res.error ?? 'Error desconocido')
      setIsError(true)
    }
  }

  async function handleConnect() {
    setTesting(true)
    const res = await serialApi.connect(config)
    setTesting(false)
    if (res.success) {
      setResult('Conectado exitosamente.')
      setIsError(false)
    } else {
      setResult(res.error ?? 'Error al conectar')
      setIsError(true)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button variant="secondary" size="sm" loading={testing} onClick={handleTest}>
          Probar conexión
        </Button>
        <Button variant="primary" size="sm" loading={testing} onClick={handleConnect}>
          Conectar pesa
        </Button>
      </div>
      {result && (
        <div className={`rounded-lg px-3 py-2 text-sm font-mono ${
          isError
            ? 'bg-red-950 border border-red-800 text-red-300'
            : 'bg-gray-800 border border-gray-700 text-green-300'
        }`}>
          {result}
        </div>
      )}
    </div>
  )
}
