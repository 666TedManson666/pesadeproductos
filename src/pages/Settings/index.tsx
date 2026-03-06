import { PageHeader }     from '../../components/Layout/PageHeader'
import { SerialSettings } from './SerialSettings'

export default function Settings() {
  return (
    <div>
      <PageHeader
        title="Configuración"
        subtitle="Configura el puerto serial y el protocolo de la pesa"
      />
      <SerialSettings />
    </div>
  )
}
