import { supabase } from '../lib/supabase'

export type AuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'IMPERSONATION'
  | 'PREINFORME_SAVE'
  | 'PASSWORD_CHANGE'
  | 'STUDENT_CREATE'
  | 'STUDENT_TRANSFER'
  | 'STUDENT_DELETE'
  | 'BACKUP_DOWNLOAD'
  | 'BACKUP_RESTORE'
  | 'PERIOD_TOGGLE'

export interface AuditLogEntry {
  id: string
  timestamp: string
  eventType: AuditEventType
  userName: string
  userRole?: string
  details: string
  deviceInfo: {
    deviceType: 'Móvil' | 'Computador' | 'Tablet'
    os: string
    browser: string
    resolution: string
    userAgentShort: string
  }
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'
}

// Device & Browser Detection Helper
export const getDeviceInfo = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceType: 'Computador' as const,
      os: 'Desconocido',
      browser: 'Desconocido',
      resolution: 'N/A',
      userAgentShort: 'Servidor'
    }
  }

  const ua = navigator.userAgent
  let deviceType: 'Móvil' | 'Computador' | 'Tablet' = 'Computador'
  let os = 'Windows'
  let browser = 'Chrome'

  // Detect Device Type
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'Tablet'
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) {
    deviceType = 'Móvil'
  } else {
    deviceType = 'Computador'
  }

  // Detect OS
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11'
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1'
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7'
  else if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s([0-9.]+)/)
    os = match ? `Android ${match[1]}` : 'Android'
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    const match = ua.match(/OS\s([0-9_]+)/)
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS'
  } else if (/Mac OS X/i.test(ua)) {
    os = 'macOS'
  } else if (/Linux/i.test(ua)) {
    os = 'Linux'
  }

  // Detect Browser
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge'
  else if (/Chrome\//i.test(ua) && !/Chromium|Edg/i.test(ua)) browser = 'Google Chrome'
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari'
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox'
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera'

  const resolution = `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`

  return {
    deviceType,
    os,
    browser,
    resolution,
    userAgentShort: `${browser} en ${os}`
  }
}

const STORAGE_KEY = 'instegesans_forensic_audit_logs'

export const recordAuditLog = (
  eventType: AuditEventType,
  userName: string,
  details: string,
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL' = 'INFO',
  userRole?: string
) => {
  try {
    const entry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      eventType,
      userName,
      userRole,
      details,
      deviceInfo: getDeviceInfo(),
      severity
    }

    // Save to localStorage
    const existingStr = localStorage.getItem(STORAGE_KEY)
    let logs: AuditLogEntry[] = existingStr ? JSON.parse(existingStr) : []
    logs.unshift(entry)
    if (logs.length > 500) logs = logs.slice(0, 500)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))

    // Optional async sync to Supabase table if it exists
    ;(async () => {
      try {
        await supabase.from('logs_auditoria').insert({
          event_type: eventType,
          user_name: userName,
          user_role: userRole,
          details: details,
          device_type: entry.deviceInfo.deviceType,
          os: entry.deviceInfo.os,
          browser: entry.deviceInfo.browser,
          resolution: entry.deviceInfo.resolution,
          severity: severity,
          created_at: entry.timestamp
        })
      } catch (err) {
        // Table may not exist yet, ignore
      }
    })()

    return entry
  } catch (e) {
    console.error('Error grabando log de auditoría:', e)
    return null
  }
}

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY)
    if (!existingStr) return []
    return JSON.parse(existingStr)
  } catch (e) {
    return []
  }
}

export const clearAuditLogs = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {}
}
