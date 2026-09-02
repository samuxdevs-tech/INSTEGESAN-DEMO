import { supabase } from '../lib/supabase'

export interface BroadcastAnnouncement {
  enabled: boolean
  message: string
  type: 'info' | 'warning' | 'critical'
  updatedAt: string
}

export interface SystemState {
  maintenanceMode: boolean
  maintenanceMessage: string
  announcement: BroadcastAnnouncement
}

const STORAGE_SYSTEM_STATE = 'instegesans_system_state_v1'

const defaultState: SystemState = {
  maintenanceMode: false,
  maintenanceMessage: 'La plataforma se encuentra en mantenimiento preventivo programado. El servicio se restablecerá a la mayor brevedad.',
  announcement: {
    enabled: false,
    message: '',
    type: 'warning',
    updatedAt: new Date().toISOString()
  }
}

export const getSystemState = (): SystemState => {
  if (typeof window === 'undefined') return defaultState
  try {
    const raw = localStorage.getItem(STORAGE_SYSTEM_STATE)
    if (!raw) return defaultState
    return { ...defaultState, ...JSON.parse(raw) }
  } catch (e) {
    return defaultState
  }
}

export const setSystemState = (newState: Partial<SystemState>): SystemState => {
  const current = getSystemState()
  const updated: SystemState = { ...current, ...newState }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SYSTEM_STATE, JSON.stringify(updated))
      
      ;(async () => {
        try {
          await supabase.from('configuracion_sistema').upsert({
            id: 'global_state',
            maintenance_mode: updated.maintenanceMode,
            maintenance_message: updated.maintenanceMessage,
            announcement: updated.announcement,
            updated_at: new Date().toISOString()
          })
        } catch (err) {}
      })()
    } catch (e) {}
  }
  return updated
}

export const setMaintenanceMode = (enabled: boolean, message?: string) => {
  return setSystemState({
    maintenanceMode: enabled,
    ...(message ? { maintenanceMessage: message } : {})
  })
}

export const setBroadcastAnnouncement = (
  enabled: boolean,
  message: string,
  type: 'info' | 'warning' | 'critical' = 'warning'
) => {
  return setSystemState({
    announcement: {
      enabled,
      message,
      type,
      updatedAt: new Date().toISOString()
    }
  })
}
