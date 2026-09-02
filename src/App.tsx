import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { LoginView } from './components/LoginView'
import { TeacherDashboard } from './components/TeacherDashboard'
import { TeacherGradingSheet } from './components/TeacherGradingSheet'
import { AdminDashboard } from './components/AdminDashboard'
import { PrintReportsView } from './components/PrintReportsView'
import { CommitmentActView } from './components/CommitmentActView'
import { MasterControlView } from './components/master/MasterControlView'
import { StudentPortalView } from './components/student/StudentPortalView'
import { getSystemState, SystemState } from './utils/systemConfig'
import { Asignacion } from './types/database'
import { Wrench, RefreshCw, AlertTriangle, Info, AlertOctagon, ArrowLeft } from 'lucide-react'

export function App() {
  const { user, effectiveUser, impersonatedStudent, stopStudentImpersonation } = useAuth()
  const [selectedAsignacion, setSelectedAsignacion] = useState<Asignacion | null>(null)
  const [viewReports, setViewReports] = useState(false)
  const [viewActas, setViewActas] = useState(false)
  const [viewSuperMaster, setViewSuperMaster] = useState(true)
  const [sysState, setSysState] = useState<SystemState>(getSystemState())

  useEffect(() => {
    const timer = setInterval(() => {
      setSysState(getSystemState())
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // 1. PANTALLA DE MODO MANTENIMIENTO (Para docentes y alumnos, el Super Admin siempre tiene acceso)
  if (sysState.maintenanceMode && user?.rol !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100 font-sans">
        <div className="bg-slate-900 p-8 sm:p-10 rounded-3xl border border-amber-800/60 shadow-2xl max-w-lg w-full space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-950 border border-amber-700 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <Wrench className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-xs font-black uppercase">
              Mantenimiento Programado
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100">
              Plataforma en Optimización Técnica
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {sysState.maintenanceMessage || 'Estamos realizando mejoras de rendimiento. El servicio se restablecerá en breves minutos.'}
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 mx-auto active:scale-95 shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Verificar Estado</span>
          </button>
        </div>
      </div>
    )
  }

  // 2. VISTA PREVIA DE ESTUDIANTE EN VIVO (Para Super Admin / Coordinación)
  if (impersonatedStudent) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
        <div className="bg-slate-800 border-b border-slate-700 text-slate-200 px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-lg sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Vista Previa del Estudiante: <strong className="text-white">{impersonatedStudent.nombre}</strong> (Código: {impersonatedStudent.codigo})</span>
          </div>
          <button
            onClick={stopStudentImpersonation}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-bold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Administración</span>
          </button>
        </div>
        <StudentPortalView />
      </div>
    )
  }

  // 3. PANTALLA DE LOGIN
  if (!user) {
    return <LoginView />
  }

  // 4. PORTAL ESTUDIANTIL DIRECTO
  if (user?.rol === 'ESTUDIANTE') {
    return <StudentPortalView />
  }

  const handleGoHome = () => {
    setSelectedAsignacion(null)
    setViewReports(false)
    setViewActas(false)
    if (user?.rol === 'SUPER_ADMIN') {
      setViewSuperMaster(true)
    }
  }

  // 5. BANNER GLOBAL FLOTANTE
  const renderBroadcastBanner = () => {
    if (!sysState.announcement.enabled || !sysState.announcement.message) return null
    const isCritical = sysState.announcement.type === 'critical'
    const isInfo = sysState.announcement.type === 'info'

    return (
      <div
        className={`px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b shadow-md text-center ${
          isCritical
            ? 'bg-rose-950 text-rose-200 border-rose-800'
            : isInfo
            ? 'bg-blue-950 text-blue-200 border-blue-800'
            : 'bg-amber-950 text-amber-200 border-amber-800'
        }`}
      >
        {isCritical ? (
          <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />
        ) : isInfo ? (
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        )}
        <span>{sysState.announcement.message}</span>
      </div>
    )
  }

  // Si es Desarrollador / Super Admin y tiene activa la vista maestra
  if (user?.rol === 'SUPER_ADMIN' && viewSuperMaster) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {renderBroadcastBanner()}
        <Navbar
          onGoHome={handleGoHome}
          onGoMaster={() => setViewSuperMaster(true)}
        />
        <main className="flex-1">
          <MasterControlView onGoCoordinator={() => setViewSuperMaster(false)} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {renderBroadcastBanner()}
      <Navbar
        onGoHome={handleGoHome}
        onGoMaster={user?.rol === 'SUPER_ADMIN' ? () => setViewSuperMaster(true) : undefined}
      />

      <main className="flex-1">
        {viewActas ? (
          <CommitmentActView onBack={() => setViewActas(false)} />
        ) : effectiveUser?.rol === 'DOCENTE' ? (
          <>
            {selectedAsignacion ? (
              <TeacherGradingSheet
                asignacion={selectedAsignacion}
                onBack={() => setSelectedAsignacion(null)}
              />
            ) : (
              <TeacherDashboard
                onSelectAsignacion={(asig) => setSelectedAsignacion(asig)}
                onOpenActas={() => setViewActas(true)}
              />
            )}
          </>
        ) : (
          <>
            {viewReports ? (
              <PrintReportsView onBack={() => setViewReports(false)} />
            ) : (
              <AdminDashboard
                onOpenReports={() => setViewReports(true)}
                onOpenActas={() => setViewActas(true)}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
