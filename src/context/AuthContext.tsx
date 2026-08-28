import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Docente, Periodo } from '../types/database'

interface AuthContextType {
  user: Docente | null
  impersonatedUser: Docente | null
  effectiveUser: Docente | null
  activePeriod: Periodo | null
  isLoading: boolean
  login: (usuario: string, clave: string) => Promise<boolean>
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

  const login = async (usuario: string, clave: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const cleanUser = usuario.trim().toLowerCase()
      const cleanPass = clave.trim()

      const { data, error } = await supabase
        .from('docentes')
        .select('id, nombre, usuario, rol, password')
        .ilike('usuario', cleanUser)
        .single()

      if (error || !data) {
        setIsLoading(false)
        return false
      }

      if (data.password === cleanPass) {
        const loggedUser: Docente = {
          id: data.id,
          nombre: data.nombre,
          usuario: data.usuario,
          rol: data.rol as 'DOCENTE' | 'ADMIN'
        }
        setUser(loggedUser)
        setImpersonatedUser(null)
        setIsLoading(false)
        return true
      }

      setIsLoading(false)
      return false
    } catch (e) {
      console.error('Error en login:', e)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setImpersonatedUser(null)
    try {
      localStorage.removeItem('instegesans_user')
      sessionStorage.removeItem('instegesans_user')
    } catch (e) {}
  }

  const startImpersonation = (docente: Docente) => {
    if (user?.rol === 'ADMIN') {
      setImpersonatedUser(docente)
    }
  }

  const stopImpersonation = () => {
    setImpersonatedUser(null)
  }

  const togglePeriodLock = async () => {
    if (!activePeriod || user?.rol !== 'ADMIN') return
    const nuevoEstado = !activePeriod.activo
    try {
      const { error } = await supabase
        .from('periodos')
        .update({ activo: nuevoEstado })
        .eq('id', activePeriod.id)

      if (!error) {
        setActivePeriod({ ...activePeriod, activo: nuevoEstado })
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
