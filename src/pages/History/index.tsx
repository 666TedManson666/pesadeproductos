import { useState, useEffect } from 'react'
import { PageHeader }     from '../../components/Layout/PageHeader'
import { HistoryFilters } from './HistoryFilters'
import { HistoryTable }   from './HistoryTable'
import { ExportBar }      from './ExportBar'
import { weighingsApi }   from '../../api/electron.api'
import type { Weighing, WeighingsSummary, GetWeighingsPayload } from '../../types'

export default function History() {
  const [rows,    setRows]    = useState<Weighing[]>([])
  const [total,   setTotal]   = useState(0)
  const [summary, setSummary] = useState<WeighingsSummary[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch(filters: GetWeighingsPayload) {
    setLoading(true)
    const res = await weighingsApi.getMany(filters)
    setLoading(false)

    if (res.success && res.data) {
      const data = res.data as { rows: Weighing[]; total: number; summary: WeighingsSummary[] }
      setRows(data.rows)
      setTotal(data.total)
      setSummary(data.summary)
    }
  }

  // Load today's records on mount
  useEffect(() => {
    const from = new Date(); from.setHours(0,0,0,0)
    const to   = new Date(); to.setHours(23,59,59,999)
    handleSearch({ dateFrom: from.toISOString(), dateTo: to.toISOString(), limit: 500 })
  }, [])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Consulta de Pesajes"
        subtitle="Filtra y consulta el historial de pesajes"
        actions={<ExportBar rows={rows} />}
      />

      <HistoryFilters onSearch={handleSearch} loading={loading} />

      {loading ? (
        <div className="flex justify-center py-16 text-gray-500">
          <svg className="h-6 w-6 animate-spin mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Cargando...
        </div>
      ) : (
        <HistoryTable rows={rows} total={total} summary={summary} />
      )}
    </div>
  )
}
