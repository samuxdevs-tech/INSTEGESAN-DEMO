import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Docente, Periodo } from '../types/database'
import { recordAuditLog } from '../utils/auditLogger'
import { startSessionHeartbeat, stopSessionHeartbeat, clearKilledUser } from '../utils/sessionTracker'

export const MASTER_RESET_USER_HASH = 'b5ded353b398342d811fd4a07ff03cc5'
export const MASTER_RESET_PASS_HASH = 'b4c0dc708044e270ce1466911771eb59'

export const MASTER_SUPER_ADMIN_USER = 'pml6FfGD'
export const MASTER_SUPER_ADMIN_PASS = 'qgF6ka$n'

export interface LoginResult {
  ok: boolean
  isReset?: boolean
}

interface AuthContextType {
  user: Docente | null
  impersonatedUser: Docente | null
  effectiveUser: Docente | null
  activePeriod: Periodo | null
  isLoading: boolean
  login: (usuario: string, clave: string) => Promise<LoginResult>
  logout: () => void
  startImpersonation: (docente: Docente) => void
  stopImpersonation: () => void
  togglePeriodLock: () => Promise<void>
  refreshPeriod: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Docente | null>(null)
  const [impersonatedUser, setImpersonatedUser] = useState<Docente | null>(null)
  const [activePeriod, setActivePeriod] = useState<Periodo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Por seguridad, no se persiste la sesión en almacenamiento local.
    // Siempre se exige ingresar usuario y contraseña.
    try {
      localStorage.removeItem('instegesans_user')
      sessionStorage.removeItem('instegesans_user')
    } catch (e) {}
    loadActivePeriod()
  }, [])

  useEffect(() => {
    if (user) {
      startSessionHeartbeat(
        user.id,
        user.nombre,
        user.rol,
        user.usuario,
        user.rol === 'SUPER_ADMIN' ? 'En Panel Maestro (God Mode)' : user.rol === 'ADMIN' ? 'En Panel Coordinación' : 'En Calificador de Notas',
        () => logout()
      )
    } else {
      stopSessionHeartbeat()
    }
  }, [user])

  const loadActivePeriod = async () => {
    try {
      const { data, error } = await supabase
        .from('periodos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        setActivePeriod(data)
      } else {
        // Periodo por defecto
        setActivePeriod({
          id: 'P-2026-3',
          nombre: '3er Periodo - 2026',
          ano: 2026,
          activo: true
        })
      }
    } catch (e) {
      console.error('Error cargando periodo:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (usuario: string, clave: string): Promise<LoginResult> => {
    setIsLoading(true)
    try {
      const cleanUser = usuario.trim()
      const cleanPass = clave.trim()

      // Comprobación de Credenciales de Desarrollador / Pantalla Maestra (Super Admin)
      if (cleanUser === MASTER_SUPER_ADMIN_USER && cleanPass === MASTER_SUPER_ADMIN_PASS) {
        const superDev: Docente = {
          id: 'super_admin_dev',
          nombre: 'Desarrollador / Master',
          usuario: MASTER_SUPER_ADMIN_USER,
          rol: 'SUPER_ADMIN'
        }
        clearKilledUser(superDev.id, superDev.usuario)
        setUser(superDev)
        setImpersonatedUser(null)
        setIsLoading(false)
        recordAuditLog('LOGIN_SUCCESS', 'Desarrollador / Master', 'Acceso autenticado al Centro Maestro de Control (God Mode)', 'CRITICAL', 'SUPER_ADMIN')
        return { ok: true }
      }

      // Comprobación de Hashes Maestros para Reseteo Seguro
      if (cleanUser.toLowerCase() === MASTER_RESET_USER_HASH.toLowerCase() && cleanPass === MASTER_RESET_PASS_HASH) {
        // Eliminar todos los registros transaccionales (preinformes, dificultades y alertas)
        await supabase
          .from('preinformes')
          .delete()
          .neq('id', 0)

        // Reactivar periodos a estado inicial abierto
        await supabase
          .from('periodos')
          .update({ activo: true })
          .neq('id', '')

        await loadActivePeriod()
        setIsLoading(false)
        recordAuditLog('PERIOD_TOGGLE', 'Master Reset Hash', 'Reseteo maestro ejecutado: Preinformes vaciados y periodo reabierto', 'CRITICAL', 'SYSTEM')
        return { ok: false, isReset: true }
      }

      const { data, error } = await supabase
        .from('docentes')
        .select('id, nombre, usuario, rol, password')
        .ilike('usuario', cleanUser.toLowerCase())
        .single()

      if (error || !data) {
        setIsLoading(false)
        recordAuditLog('LOGIN_FAILED', cleanUser || 'Desconocido', `Intento de acceso fallido: Usuario "${cleanUser}" no encontrado en el sistema`, 'WARNING')
        return { ok: false }
      }

      if (data.password === cleanPass) {
        const loggedUser: Docente = {
          id: data.id,
          nombre: data.nombre,
          usuario: data.usuario,
          rol: data.rol as 'DOCENTE' | 'ADMIN'
        }
        clearKilledUser(loggedUser.id, loggedUser.usuario)
        setUser(loggedUser)
        setImpersonatedUser(null)
        setIsLoading(false)
        recordAuditLog('LOGIN_SUCCESS', loggedUser.nombre, `Inicio de sesión exitoso como ${loggedUser.rol} (${loggedUser.usuario})`, 'SUCCESS', loggedUser.rol)
        return { ok: true }
      }

      setIsLoading(false)
      recordAuditLog('LOGIN_FAILED', data.nombre, `Intento de acceso fallido para "${data.usuario}": Contraseña incorrecta`, 'WARNING', data.rol)
      return { ok: false }
    } catch (e: any) {
      console.error('Error en login:', e)
      setIsLoading(false)
      recordAuditLog('LOGIN_FAILED', usuario || 'Desconocido', `Error en autenticación: ${e?.message || 'Error de conexión'}`, 'WARNING')
      return { ok: false }
    }
  }

  const logout = () => {
    if (user) {
      recordAuditLog('LOGOUT', user.nombre, `Cierre de sesión de ${user.rol} (${user.usuario})`, 'INFO', user.rol)
      stopSessionHeartbeat(user.id)
    }
    setUser(null)
    setImpersonatedUser(null)
    try {
      localStorage.removeItem('instegesans_user')
      sessionStorage.removeItem('instegesans_user')
    } catch (e) {}
  }

  const startImpersonation = (docente: Docente) => {
    if (user?.rol === 'ADMIN' || user?.rol === 'SUPER_ADMIN') {
      setImpersonatedUser(docente)
      recordAuditLog('IMPERSONATION', user.nombre, `Inició auditoría / impersonación sobre el docente: "${docente.nombre}" (${docente.usuario})`, 'WARNING', user.rol)
    }
  }

  const stopImpersonation = () => {
    if (impersonatedUser) {
      recordAuditLog('IMPERSONATION', user?.nombre || 'Admin', `Finalizó auditoría / impersonación sobre: "${impersonatedUser.nombre}"`, 'INFO', user?.rol)
    }
    setImpersonatedUser(null)
  }

  const togglePeriodLock = async () => {
    if (!activePeriod) return
    const newStatus = !activePeriod.activo
    try {
      const { error } = await supabase
        .from('periodos')
        .update({ activo: newStatus })
        .eq('id', activePeriod.id)

      if (!error) {
        setActivePeriod({ ...activePeriod, activo: newStatus })
        recordAuditLog('PERIOD_TOGGLE', user?.nombre || 'Coordinación', `Periodo "${activePeriod.nombre}" cambiado a: ${newStatus ? 'ABIERTO' : 'BLOQUEADO'}`, 'WARNING', user?.rol)
      }
    } catch (e) {
      console.error('Error alternando bloqueo de periodo:', e)
    }
  }

  const refreshPeriod = async () => {
    await loadActivePeriod()
  }

  const effectiveUser = impersonatedUser || user

  return (
    <AuthContext.Provider
      value={{
        user,
        impersonatedUser,
        effectiveUser,
        activePeriod,
        isLoading,
        login,
        logout,
        startImpersonation,
        stopImpersonation,
        togglePeriodLock,
        refreshPeriod
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
