import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Lock, User, AlertCircle, ArrowRight, CheckCircle2, GraduationCap, School } from 'lucide-react'

export const LoginView: React.FC = () => {
  const { login, loginStudent, isLoading } = useAuth()
  const [loginMode, setLoginMode] = useState<'DOCENTE' | 'ESTUDIANTE'>('DOCENTE')
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [studentCode, setStudentCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResetSuccess(null)

    if (loginMode === 'ESTUDIANTE') {
      if (!studentCode.trim()) {
        setError('Por favor ingresa tu código de estudiante')
        return
      }
      const res = await loginStudent(studentCode)
      if (!res.ok) {
        setError('Código de estudiante no encontrado. Verifica tu carné o matrícula.')
      }
      return
    }

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
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain mx-auto mb-3 drop-shadow-2xl"
          />
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100">
            Institución Educativa General Santander
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
            Plataforma Institucional de Preinformes Académicos
          </p>
        </div>

        <div className="mt-6 sm:mt-8 bg-slate-900 py-6 sm:py-8 px-5 sm:px-10 shadow-2xl border border-slate-800 rounded-3xl space-y-6">
          {/* SELECTOR DE MODO: DOCENTE VS ESTUDIANTE */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => {
                setLoginMode('DOCENTE')
                setError(null)
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                loginMode === 'DOCENTE'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <School className="w-4 h-4" />
              <span>Docentes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('ESTUDIANTE')
                setError(null)
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                loginMode === 'ESTUDIANTE'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Estudiantes</span>
            </button>
          </div>

          {resetSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-3">
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
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {loginMode === 'DOCENTE' ? (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Usuario Institucional
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      placeholder="Ej: cflorez o admin"
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="block w-full pl-10 pr-3 py-3 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
                      className="block w-full pl-10 pr-3 py-3 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500 transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 transition active:scale-[0.99]"
                >
                  <span>{isLoading ? 'Comprobando...' : 'Iniciar Sesión'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Código de Matrícula o Documento
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      placeholder="Ej: EST-001 o tu código de alumno"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      className="block w-full pl-10 pr-3 py-3 text-sm bg-slate-950 border border-purple-800/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-slate-500 transition font-mono"
                      required
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Consulta tu estado académico, materias al día y preinforme oficial en línea.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-900 disabled:opacity-50 transition active:scale-[0.99]"
                >
                  <span>{isLoading ? 'Buscando Estudiante...' : 'Consultar Mi Preinforme'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
