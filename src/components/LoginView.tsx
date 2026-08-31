import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'

export const LoginView: React.FC = () => {
 const { login, isLoading } = useAuth()
 const [usuario, setUsuario] = useState('')
 const [clave, setClave] = useState('')
 const [error, setError] = useState<string | null>(null)
 const [resetSuccess, setResetSuccess] = useState<string | null>(null)

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setError(null)
 setResetSuccess(null)
 if (!usuario.trim() || !clave.trim()) {
 setError('Ingresa tu usuario y contraseña')
 return
 }

 const res = await login(usuario, clave)
 if (res.isReset) {
 setResetSuccess(
 'Base de datos restablecida con éxito. Se han eliminado todos los reportes, dificultades y estadísticas de preinformes. La base institucional (docentes, estudiantes, grados y carga académica) permanece 100% intacta.'
 )
 setUsuario('')
 setClave('')
 return
 }

 if (!res.ok) {
 setError('El usuario o la contraseña no coinciden')
 }
 }

 return (
 <div className="min-h-screen bg-slate-950 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
 <div className="sm:mx-auto sm:w-full sm:max-w-md">
 <div className="text-center">
 <img
 src="/escudo_transparente.png"
 alt="Escudo IE General Santander"
 className="w-28 h-28 object-contain mx-auto mb-3 drop-shadow-2xl"
 />
 <h2 className="text-2xl font-bold tracking-tight text-slate-100">
 Institución Educativa General Santander
 </h2>
 <p className="mt-1 text-sm text-slate-400">
 Plataforma de Preinformes Académicos
 </p>
 </div>

 <div className="mt-8 bg-slate-900 py-8 px-6 shadow-xl border border-slate-800 rounded-2xl sm:px-10">
 {resetSuccess && (
 <div className="mb-5 p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs sm:text-sm flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
 <div className="space-y-1">
 <span className="font-bold block text-emerald-100">
 Restablecimiento Maestro Ejecutado
 </span>
 <span>{resetSuccess}</span>
 </div>
 </div>
 )}

 {error && (
 <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-sm flex items-center gap-2">
 <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
 <span>{error}</span>
 </div>
 )}

 <form className="space-y-5" onSubmit={handleSubmit}>
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
 Usuario
 </label>
 <div className="relative rounded-xl shadow-sm">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
 <User className="w-5 h-5" />
 </div>
 <input
 type="text"
 value={usuario}
 onChange={(e) => setUsuario(e.target.value)}
 placeholder="Usuario"
 autoCapitalize="none"
 autoCorrect="off"
 className="block w-full pl-10 pr-3 py-3 text-base bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500 transition"
 required
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
 Contraseña
 </label>
 <div className="relative rounded-xl shadow-sm">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
 <Lock className="w-5 h-5" />
 </div>
 <input
 type="password"
 value={clave}
 onChange={(e) => setClave(e.target.value)}
 placeholder="Contraseña"
 className="block w-full pl-10 pr-3 py-3 text-base bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500 transition"
 required
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={isLoading}
 className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 transition active:scale-[0.99]"
 >
 <span>{isLoading ? 'Comprobando...' : 'Iniciar sesión'}</span>
 <ArrowRight className="w-4 h-4" />
 </button>
 </form>
 </div>
 </div>
 </div>
 )
}
