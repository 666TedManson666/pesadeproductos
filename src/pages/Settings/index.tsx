import { PageHeader }  from '../../components/Layout/PageHeader'
import { SerialSettings } from './SerialSettings'
import { DbSettings }    from './DbSettings'

export default function Settings() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configuración"
        subtitle="Configura el puerto serial, protocolo de la pesa y la base de datos"
      />
      <SerialSettings />
      <DbSettings />
    </div>
  )
}
