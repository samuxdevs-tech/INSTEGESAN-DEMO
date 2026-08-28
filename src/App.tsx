import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { LoginView } from './components/LoginView'
import { TeacherDashboard } from './components/TeacherDashboard'
import { TeacherGradingSheet } from './components/TeacherGradingSheet'
import { AdminDashboard } from './components/AdminDashboard'
import { PrintReportsView } from './components/PrintReportsView'
import { Asignacion } from './types/database'

export function App() {
  const { user, effectiveUser } = useAuth()
  const [selectedAsignacion, setSelectedAsignacion] = useState<Asignacion | null>(null)
  const [viewReports, setViewReports] = useState(false)

  if (!user) {
    return <LoginView />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        onGoHome={() => {
          setSelectedAsignacion(null)
          setViewReports(false)
        }}
      />

      <main className="flex-1">
        {effectiveUser?.rol === 'DOCENTE' && (
          <>
            {selectedAsignacion ? (
              <TeacherGradingSheet
                asignacion={selectedAsignacion}
                onBack={() => setSelectedAsignacion(null)}
              />
            ) : (
              <TeacherDashboard
                onSelectAsignacion={(asig) => setSelectedAsignacion(asig)}
              />
            )}
          </>
        )}

        {effectiveUser?.rol === 'ADMIN' && (
          <>
            {viewReports ? (
              <PrintReportsView onBack={() => setViewReports(false)} />
            ) : (
              <AdminDashboard onOpenReports={() => setViewReports(true)} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
