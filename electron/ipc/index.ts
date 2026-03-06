import { registerProductHandlers }  from './products.ipc'
import { registerWarehouseHandlers } from './warehouses.ipc'
import { registerSessionHandlers }   from './sessions.ipc'
import { registerWeighingHandlers }  from './weighings.ipc'
import { registerSettingsHandlers }  from './settings.ipc'

export function registerAllHandlers(): void {
  registerProductHandlers()
  registerWarehouseHandlers()
  registerSessionHandlers()
  registerWeighingHandlers()
  registerSettingsHandlers()
}
