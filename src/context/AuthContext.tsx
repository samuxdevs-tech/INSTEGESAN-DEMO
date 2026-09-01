import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Docente, Periodo } from '../types/database'

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
 setUser(superDev)
 setImpersonatedUser(null)
 setIsLoading(false)
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
 return { ok: false, isReset: true }
 }

 const { data, error } = await supabase
 .from('docentes')
 .select('id, nombre, usuario, rol, password')
 .ilike('usuario', cleanUser.toLowerCase())
 .single()

 if (error || !data) {
 setIsLoading(false)
 return { ok: false }
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
 return { ok: true }
 }

 setIsLoading(false)
 return { ok: false }
 } catch (e) {
 console.error('Error en login:', e)
 setIsLoading(false)
 return { ok: false }
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
