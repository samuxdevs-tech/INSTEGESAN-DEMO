import { getDeviceInfo } from './auditLogger'

export interface SystemCrashError {
  id: string
  timestamp: string
  message: string
  source?: string
  stack?: string
  userName?: string
  deviceSummary: string
  url: string
}

const STORAGE_ERRORS = 'instegesans_system_errors_v1'

export const recordSystemError = (
  message: string,
  source?: string,
  stack?: string,
  userName?: string
) => {
  if (typeof window === 'undefined') return
  try {
    const devInfo = getDeviceInfo()
    const errorEntry: SystemCrashError = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      message,
      source: source || 'Window Error',
      stack: stack || 'No stack trace available',
      userName: userName || 'Usuario Anónimo',
      deviceSummary: `${devInfo.deviceType} (${devInfo.browser} en ${devInfo.os})`,
      url: window.location.href
    }

    const raw = localStorage.getItem(STORAGE_ERRORS)
    let errors: SystemCrashError[] = raw ? JSON.parse(raw) : []
    errors.unshift(errorEntry)
    if (errors.length > 100) errors = errors.slice(0, 100)
    localStorage.setItem(STORAGE_ERRORS, JSON.stringify(errors))
  } catch (e) {}
}

export const getSystemErrors = (): SystemCrashError[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_ERRORS)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export const clearSystemErrors = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_ERRORS)
  } catch (e) {}
}

// Global listeners
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    recordSystemError(event.message, `${event.filename}:${event.lineno}`, event.error?.stack)
  })

  window.addEventListener('unhandledrejection', (event) => {
    recordSystemError(`Unhandled Promise: ${event.reason?.message || event.reason}`, 'Promise Rejection', event.reason?.stack)
  })
}
