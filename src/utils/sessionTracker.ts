import { supabase } from '../lib/supabase'
import { getDeviceInfo } from './auditLogger'

export interface ActiveSession {
  userId: string
  userName: string
  userRole: string
  userHandle: string
  loginAt: string
  lastSeenAt: string
  currentActivity: string
  deviceSummary: string
  isOnline: boolean
}

const STORAGE_ACTIVE_SESSIONS = 'instegesans_active_sessions_v1'
const STORAGE_KILLED_USERS = 'instegesans_killed_users_v1'

let heartbeatInterval: any = null

export const startSessionHeartbeat = (
  userId: string,
  userName: string,
  userRole: string,
  userHandle: string,
  currentActivity: string = 'En Panel Principal',
  onForceLogout?: () => void
) => {
  if (typeof window === 'undefined') return

  const updateHeartbeat = () => {
    // 1. Check if user was killed remotely
    const killedUsers: string[] = JSON.parse(localStorage.getItem(STORAGE_KILLED_USERS) || '[]')
    if (killedUsers.includes(userId) || killedUsers.includes(userHandle)) {
      stopSessionHeartbeat()
      if (onForceLogout) onForceLogout()
      alert('Tu sesión ha sido cerrada remotamente por el Administrador Maestro.')
      return
    }

    // 2. Register/update heartbeat
    const devInfo = getDeviceInfo()
    const now = new Date().toISOString()

    const sessionObj: ActiveSession = {
      userId,
      userName,
      userRole,
      userHandle,
      loginAt: now,
      lastSeenAt: now,
      currentActivity,
      deviceSummary: `${devInfo.deviceType} (${devInfo.browser} en ${devInfo.os})`,
      isOnline: true
    }

    try {
      const raw = localStorage.getItem(STORAGE_ACTIVE_SESSIONS)
      let sessions: Record<string, ActiveSession> = raw ? JSON.parse(raw) : {}
      
      // Preserve original loginAt if already present
      if (sessions[userId]) {
        sessionObj.loginAt = sessions[userId].loginAt
      }
      sessions[userId] = sessionObj

      localStorage.setItem(STORAGE_ACTIVE_SESSIONS, JSON.stringify(sessions))

      // Optional async sync to Supabase table if it exists
      ;(async () => {
        try {
          await supabase
            .from('sesiones_activas')
            .upsert({
              user_id: userId,
              user_name: userName,
              user_role: userRole,
              user_handle: userHandle,
              current_activity: currentActivity,
              device_summary: sessionObj.deviceSummary,
              last_seen_at: now
            }, { onConflict: 'user_id' })
        } catch (e) {}
      })()
    } catch (e) {}
  }

  // Initial call
  updateHeartbeat()

  if (heartbeatInterval) clearInterval(heartbeatInterval)
  heartbeatInterval = setInterval(updateHeartbeat, 15000) // Update every 15s
}

export const stopSessionHeartbeat = (userId?: string) => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }

  if (userId && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_ACTIVE_SESSIONS)
      if (raw) {
        let sessions: Record<string, ActiveSession> = JSON.parse(raw)
        delete sessions[userId]
        localStorage.setItem(STORAGE_ACTIVE_SESSIONS, JSON.stringify(sessions))
      }
    } catch (e) {}
  }
}

export const getLiveActiveSessions = (): ActiveSession[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_SESSIONS)
    if (!raw) return []
    const sessions: Record<string, ActiveSession> = JSON.parse(raw)
    const now = Date.now()

    return Object.values(sessions).map(s => {
      const lastSeenTime = new Date(s.lastSeenAt).getTime()
      const diffMinutes = (now - lastSeenTime) / (1000 * 60)
      return {
        ...s,
        isOnline: diffMinutes < 2 // Online if seen in last 2 minutes
      }
    })
  } catch (e) {
    return []
  }
}

export const killUserSession = (userId: string, userHandle: string) => {
  if (typeof window === 'undefined') return
  try {
    const killedUsers: string[] = JSON.parse(localStorage.getItem(STORAGE_KILLED_USERS) || '[]')
    if (!killedUsers.includes(userId)) killedUsers.push(userId)
    if (!killedUsers.includes(userHandle)) killedUsers.push(userHandle)
    localStorage.setItem(STORAGE_KILLED_USERS, JSON.stringify(killedUsers))

    stopSessionHeartbeat(userId)
  } catch (e) {}
}

export const clearKilledUser = (userId: string, userHandle: string) => {
  if (typeof window === 'undefined') return
  try {
    let killedUsers: string[] = JSON.parse(localStorage.getItem(STORAGE_KILLED_USERS) || '[]')
    killedUsers = killedUsers.filter(u => u !== userId && u !== userHandle)
    localStorage.setItem(STORAGE_KILLED_USERS, JSON.stringify(killedUsers))
  } catch (e) {}
}
