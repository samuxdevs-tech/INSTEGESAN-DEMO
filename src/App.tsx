import { useState } from 'react'
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
import { Asignacion } from './types/database'

export function App() {
  const { user, effectiveUser } = useAuth()
  const [selectedAsignacion, setSelectedAsignacion] = useState<Asignacion | null>(null)
  const [viewReports, setViewReports] = useState(false)
  const [viewActas, setViewActas] = useState(false)
  const [viewSuperMaster, setViewSuperMaster] = useState(true)

  if (!user) {
    return <LoginView />
  }

  // Vista de Portal Estudiantil y Familiar
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

  // Si es Desarrollador / Super Admin y tiene activa la vista maestra
  if (user?.rol === 'SUPER_ADMIN' && viewSuperMaster) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
      <Navbar
        onGoHome={handleGoHome}
        onGoMaster={user?.rol === 'SUPER_ADMIN' ? () => setViewSuperMaster(true) : undefined}
      />

      <main className="flex-1">
        {/* Vista Global de Actas de Compromiso (Docentes y Coordinación) */}
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
