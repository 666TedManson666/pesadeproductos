import { PageHeader }      from '../../components/Layout/PageHeader'
import { WeighingPanel }   from './WeighingPanel'
import { RecentWeighings } from './RecentWeighings'

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Pesaje de Productos"
        subtitle="Captura el peso de los productos cargados al camión"
      />

      <div className="flex-1 grid grid-cols-[360px_1fr] gap-6 min-h-0">
        {/* Left: controls */}
        <div className="overflow-y-auto">
          <WeighingPanel />
        </div>

        {/* Right: recent weighings */}
        <div className="min-h-0 flex flex-col bg-gray-900/40 rounded-2xl border border-gray-800 p-4">
          <RecentWeighings />
        </div>
      </div>
    </div>
  )
}
