import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Docente, Grado } from '../types/database'
import { Users, Printer, CheckCircle, Clock, Lock, Unlock, Eye, Search, AlertTriangle, FileDown } from 'lucide-react'
import { generateAndDownloadTirillasPDF } from '../utils/generateTirillasPdf'

interface AdminDashboardProps {
  onOpenReports: () => void
}

interface DocenteProgress {
  docente: Docente
  totalClases: number
  clasesReportadas: number
  totalEnRiesgo: number
  alDia: boolean
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenReports }) => {
  const { activePeriod, togglePeriodLock, startImpersonation } = useAuth()
  const [docentesProgress, setDocentesProgress] = useState<DocenteProgress[]>([])
  const [allGrados, setAllGrados] = useState<Grado[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'TODOS' | 'PENDIENTES' | 'AL_DIA'>('TODOS')
  const [searchTerm, setSearchTerm] = useState('')
  const [showImpersonateModal, setShowImpersonateModal] = useState(false)

  useEffect(() => {
    loadMetrics()
  }, [activePeriod])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const { data: docs } = await supabase
        .from('docentes')
        .select('*')
        .eq('rol', 'DOCENTE')
        .order('nombre', { ascending: true })

      const { data: asigs } = await supabase
        .from('asignaciones')
        .select('id, docente_id, grado_id')

      const { data: reps } = await supabase
        .from('preinformes')
        .select('asignacion_id, en_riesgo')
        .eq('periodo_id', activePeriod?.id || 'P-2026-3')

      const { data: gradosData } = await supabase
        .from('grados')
        .select('*')
        .order('nombre', { ascending: true })

      if (gradosData) setAllGrados(gradosData)

      if (!docs || !asigs) {
        setLoading(false)
        return
      }

      const asigReportsCount: { [asigId: number]: { total: number; enRiesgo: number } } = {}
      if (reps) {
        reps.forEach((r) => {
          if (!asigReportsCount[r.asignacion_id]) {
            asigReportsCount[r.asignacion_id] = { total: 0, enRiesgo: 0 }
          }
          asigReportsCount[r.asignacion_id].total += 1
          if (r.en_riesgo) {
            asigReportsCount[r.asignacion_id].enRiesgo += 1
          }
        })
      }

      const progress: DocenteProgress[] = docs.map((d) => {
        const misAsigs = asigs.filter((a) => a.docente_id === d.id)
        let totalEnRiesgo = 0
        let clasesReportadas = 0

        misAsigs.forEach((a) => {
          const info = asigReportsCount[a.id]
          if (info && info.total > 0) {
            clasesReportadas += 1
            totalEnRiesgo += info.enRiesgo
          }
        })

        const alDia = misAsigs.length > 0 && clasesReportadas === misAsigs.length

        return {
          docente: d,
          totalClases: misAsigs.length,
          clasesReportadas,
          totalEnRiesgo,
          alDia
        }
      })

      setDocentesProgress(progress)
    } catch (e) {
      console.error('Error cargando métricas:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocentes = docentesProgress.filter((dp) => {
    const matchSearch = dp.docente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dp.docente.usuario.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchSearch) return false
    if (filter === 'PENDIENTES') return !dp.alDia
    if (filter === 'AL_DIA') return dp.alDia
    return true
  })

  const totalDocentes = docentesProgress.length
  const docentesAlDia = docentesProgress.filter((dp) => dp.alDia).length
  const totalEnRiesgoInstitucional = docentesProgress.reduce((acc, curr) => acc + curr.totalEnRiesgo, 0)
  const pctCumplimiento = totalDocentes > 0 ? Math.round((docentesAlDia / totalDocentes) * 100) : 0

  const handleDownloadTirillas = () => {
    generateAndDownloadTirillasPDF()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Panel de Coordinación Académica
          </span>
          <h2 className="text-2xl font-bold text-slate-100 mt-0.5">
            {activePeriod?.nombre}
          </h2>
          <p className="text-xs text-slate-400">
            Monitoreo y generación de documentos oficiales
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadTirillas}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition active:scale-95 shadow-sm"
            title="Descargar archivo PDF vectorial de tirillas recortables para los 31 docentes"
          >
            <FileDown className="w-4 h-4 text-blue-400" />
            <span>Descargar Tirillas (PDF)</span>
          </button>

          <button
            onClick={() => setShowImpersonateModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition active:scale-95"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            <span>Ver como docente...</span>
          </button>

          <button
            onClick={onOpenReports}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-md transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Generar Documentos (PDF)</span>
          </button>

          <button
            onClick={togglePeriodLock}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold border transition active:scale-95 ${
              activePeriod?.activo
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800 hover:bg-emerald-900/80'
                : 'bg-amber-950/70 text-amber-300 border-amber-800 hover:bg-amber-900/80'
            }`}
          >
            {activePeriod?.activo ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>Preinformes Abiertos</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Preinformes Cerrados</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Estudiantes en Riesgo</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-100">
            {totalEnRiesgoInstitucional}
          </p>
          <p className="text-xs text-slate-400 mt-1">Alertas tempranas registradas</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cumplimiento Docente</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-100">
            {pctCumplimiento}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {docentesAlDia} de {totalDocentes} profesores al día
          </p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Salones Activos</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-100">
            {allGrados.length}
          </p>
          <p className="text-xs text-slate-400 mt-1">Grados en la institución</p>
        </div>
      </div>

      {/* Tabla de Docentes */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar profesor..."
              className="w-full pl-10 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(['TODOS', 'PENDIENTES', 'AL_DIA'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f === 'TODOS' ? 'Todos' : f === 'PENDIENTES' ? 'Pendientes' : 'Al día'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">
            Cargando estado de docentes...
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredDocentes.map((dp) => (
              <div
                key={dp.docente.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850 transition"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    {dp.docente.nombre}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Usuario: {dp.docente.usuario} • {dp.totalClases} clases a cargo
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        dp.alDia
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800'
                      }`}
                    >
                      {dp.alDia ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          Al día
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          {dp.clasesReportadas} de {dp.totalClases} salones
                        </>
                      )}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {dp.totalEnRiesgo} estudiantes reportados
                    </p>
                  </div>

                  <button
                    onClick={() => startImpersonation(dp.docente)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-700 transition"
                    title="Ver planilla como este docente"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Impersonación */}
      {showImpersonateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                Seleccionar docente para auditar
              </h3>
              <button
                onClick={() => setShowImpersonateModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 my-3">
              Permite revisar y complementar la planilla de cualquier docente:
            </p>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-800 pr-1">
              {docentesProgress.map((dp) => (
                <button
                  key={dp.docente.id}
                  onClick={() => {
                    setShowImpersonateModal(false)
                    startImpersonation(dp.docente)
                  }}
                  className="w-full text-left py-3 px-2 hover:bg-slate-800 rounded-xl transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition">
                      {dp.docente.nombre}
                    </div>
                    <div className="text-xs text-slate-400">
                      {dp.totalClases} clases asignadas
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
