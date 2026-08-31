import React, { useState } from 'react'
import { CircularProgress } from './CircularProgress'
import { Docente } from '../../types/database'
import { CheckCircle, Clock, Search, X, Eye } from 'lucide-react'

interface DocenteProgress {
 docente: Docente
 totalClases: number
 clasesReportadas: number
 totalEnRiesgo: number
 alDia: boolean
}

interface CumplimientoDocenteModalProps {
 onClose: () => void
 docentesProgress: DocenteProgress[]
 onImpersonate: (docente: Docente) => void
}

export const CumplimientoDocenteModal: React.FC<CumplimientoDocenteModalProps> = ({
 onClose,
 docentesProgress,
 onImpersonate
}) => {
 const [searchTerm, setSearchTerm] = useState('')
 const [filter, setFilter] = useState<'TODOS' | 'AL_DIA' | 'PENDIENTES'>('TODOS')

 const totalDocentes = docentesProgress.length
 const docentesAlDia = docentesProgress.filter((d) => d.alDia).length
 const docentesPendientes = totalDocentes - docentesAlDia
 const totalClasesInstitucionales = docentesProgress.reduce((acc, curr) => acc + curr.totalClases, 0)
 const totalClasesReportadas = docentesProgress.reduce((acc, curr) => acc + curr.clasesReportadas, 0)
 
 const pctGlobalClases = totalClasesInstitucionales > 0
 ? Math.round((totalClasesReportadas / totalClasesInstitucionales) * 100)
 : 0
 const pctGlobalDocentes = totalDocentes > 0
 ? Math.round((docentesAlDia / totalDocentes) * 100)
 : 0

 const filtered = docentesProgress.filter((dp) => {
 const matchSearch = dp.docente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
 dp.docente.usuario.toLowerCase().includes(searchTerm.toLowerCase())
 if (!matchSearch) return false
 if (filter === 'AL_DIA') return dp.alDia
 if (filter === 'PENDIENTES') return !dp.alDia
 return true
 })

 return (
 <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
 <div className="bg-slate-900 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
 {/* Cabecera */}
 <div className="flex items-center justify-between pb-4 border-b border-slate-800">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-400">
 <CheckCircle className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-slate-100">
 Auditoría de Cumplimiento Docente
 </h3>
 <p className="text-xs text-slate-400">
 Avance institucional y porcentaje por profesor
 </p>
 </div>
 </div>

 <button
 onClick={onClose}
 className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Tarjeta de Métricas Globales con Gráfica Circular */}
 <div className="my-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-around gap-4">
 <div className="flex items-center gap-4">
 <CircularProgress
 percentage={pctGlobalDocentes}
 size={76}
 strokeWidth={7}
 colorClass={pctGlobalDocentes >= 80 ? 'text-emerald-500' : 'text-blue-500'}
 textSizeClass="text-base"
 />
 <div>
 <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
 Docentes al Día
 </span>
 <p className="text-xl font-black text-slate-100">
 {docentesAlDia} de {totalDocentes} profesores
 </p>
 <p className="text-xs text-slate-500">
 {docentesPendientes} con planillas pendientes
 </p>
 </div>
 </div>

 <div className="h-px sm:h-12 w-full sm:w-px bg-slate-800" />

 <div className="flex items-center gap-4">
 <CircularProgress
 percentage={pctGlobalClases}
 size={76}
 strokeWidth={7}
 colorClass="text-indigo-500"
 textSizeClass="text-base"
 />
 <div>
 <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
 Salones Evaluados
 </span>
 <p className="text-xl font-black text-slate-100">
 {totalClasesReportadas} de {totalClasesInstitucionales} clases
 </p>
 <p className="text-xs text-slate-500">
 Cobertura institucional del periodo
 </p>
 </div>
 </div>
 </div>

 {/* Buscador y Filtros */}
 <div className="pb-3 space-y-3">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <div className="relative flex-1">
 <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
 <input
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Buscar docente..."
 className="w-full pl-10 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
 />
 </div>

 <div className="flex items-center gap-1">
 {(['TODOS', 'AL_DIA', 'PENDIENTES'] as const).map((f) => (
 <button
 key={f}
 onClick={() => setFilter(f)}
 className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
 filter === f
 ? 'bg-emerald-600 text-white shadow-sm'
 : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
 }`}
 >
 {f === 'TODOS' ? 'Todos' : f === 'AL_DIA' ? 'Al día' : 'Pendientes'}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Lista de Profesores con Gráfica Circular */}
 <div className="flex-1 overflow-y-auto py-2 space-y-2.5 pr-1 divide-y divide-slate-800/50">
 {filtered.map((dp) => {
 const pctDocente = dp.totalClases > 0 ? Math.round((dp.clasesReportadas / dp.totalClases) * 100) : 0

 return (
 <div
 key={dp.docente.id}
 className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition"
 >
 <div className="flex items-center gap-3">
 <CircularProgress
 percentage={pctDocente}
 size={48}
 strokeWidth={4.5}
 colorClass={dp.alDia ? 'text-emerald-400' : 'text-amber-400'}
 textSizeClass="text-[11px]"
 />

 <div>
 <h4 className="text-sm font-bold text-slate-100 leading-tight">
 {dp.docente.nombre}
 </h4>
 <p className="text-xs text-slate-400 font-mono mt-0.5">
 {dp.clasesReportadas} de {dp.totalClases} salones completados ({pctDocente}%)
 </p>
 <p className="text-[11px] text-amber-400/90 font-medium">
 {dp.totalEnRiesgo} estudiantes en riesgo
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <span
 className={`hidden sm:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
 dp.alDia
 ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
 : 'bg-amber-950/60 text-amber-300 border-amber-800'
 }`}
 >
 {dp.alDia ? (
 <>
 <CheckCircle className="w-3 h-3 text-emerald-400" />
 Completado
 </>
 ) : (
 <>
 <Clock className="w-3 h-3 text-amber-400" />
 Pendiente
 </>
 )}
 </span>

 <button
 onClick={() => {
 onClose()
 onImpersonate(dp.docente)
 }}
 className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-700"
 title="Ver planilla como este docente"
 >
 <Eye className="w-4 h-4" />
 </button>
 </div>
 </div>
 )
 })}
 </div>

 {/* Pie */}
 <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
 <span>{filtered.length} docentes listados</span>
 <button
 onClick={onClose}
 className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl transition active:scale-95"
 >
 Cerrar
 </button>
 </div>
 </div>
 </div>
 )
}
