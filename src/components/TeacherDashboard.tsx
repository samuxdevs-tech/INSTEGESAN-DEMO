import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Asignacion } from '../types/database'
import { Users, AlertTriangle, ChevronRight, Lock, FileText } from 'lucide-react'

interface TeacherDashboardProps {
 onSelectAsignacion: (asignacion: Asignacion) => void
 onOpenActas: () => void
}

interface AsignacionConConteo extends Asignacion {
 totalEstudiantes: number
 totalEnRiesgo: number
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onSelectAsignacion, onOpenActas }) => {
 const { effectiveUser, activePeriod } = useAuth()
 const [asignaciones, setAsignaciones] = useState<AsignacionConConteo[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 if (effectiveUser) {
 loadTeacherClasses()
 }
 }, [effectiveUser, activePeriod])

 const loadTeacherClasses = async () => {
 setLoading(true)
 try {
 const { data: asigData, error: asigError } = await supabase
 .from('asignaciones')
 .select(`
 id,
 docente_id,
 materia_id,
 grado_id,
 materia:materias (id, nombre, area),
 grado:grados (id, nombre)
 `)
 .eq('docente_id', effectiveUser?.id)
 .order('grado_id', { ascending: true })

 if (asigError || !asigData) {
 setLoading(false)
 return
 }

 const enhanced: AsignacionConConteo[] = await Promise.all(
 asigData.map(async (a: any) => {
 const { count: totalEst } = await supabase
 .from('estudiantes')
 .select('*', { count: 'exact', head: true })
 .eq('grado_id', a.grado_id)

 const { count: enRiesgo } = await supabase
 .from('preinformes')
 .select('*', { count: 'exact', head: true })
 .eq('asignacion_id', a.id)
 .eq('periodo_id', activePeriod?.id || 'P-2026-3')
 .eq('en_riesgo', true)

 return {
 ...a,
 totalEstudiantes: totalEst || 0,
 totalEnRiesgo: enRiesgo || 0
 }
 })
 )

 setAsignaciones(enhanced)
 } catch (e) {
 console.error('Error cargando clases del docente:', e)
 } finally {
 setLoading(false)
 }
 }

 const totalEnRiesgoGeneral = asignaciones.reduce((acc, curr) => acc + curr.totalEnRiesgo, 0)

 return (
 <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
 {/* Encabezado del Docente con Acciones Rápidas */}
 <div className="mb-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h2 className="text-xl font-bold text-slate-100">
 {effectiveUser?.nombre}
 </h2>
 <p className="text-sm text-slate-400">
 Asignaturas y salones a cargo • {activePeriod?.nombre}
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <button
 onClick={onOpenActas}
 className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
 >
 <FileText className="w-4 h-4" />
 <span>Actas de Compromiso</span>
 {totalEnRiesgoGeneral > 0 && (
 <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-200 text-xs font-black border border-blue-400/40">
 {totalEnRiesgoGeneral}
 </span>
 )}
 </button>

 {!activePeriod?.activo && (
 <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs font-medium">
 <Lock className="w-4 h-4 text-amber-400" />
 <span>Periodo cerrado (Solo lectura)</span>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Listado de Asignaciones */}
 <div>
 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
 Tus Salones ({asignaciones.length})
 </h3>

 {loading ? (
 <div className="space-y-3">
 {[1, 2, 3].map((i) => (
 <div key={i} className="h-20 bg-slate-900 border border-slate-800 animate-pulse rounded-2xl" />
 ))}
 </div>
 ) : asignaciones.length === 0 ? (
 <div className="bg-slate-900 p-8 text-center rounded-2xl border border-slate-800 text-slate-400">
 No tienes salones asignados para este periodo.
 </div>
 ) : (
 <div className="space-y-3">
 {asignaciones.map((asig) => (
 <div
 key={asig.id}
 onClick={() => onSelectAsignacion(asig)}
 className="w-full text-left bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-blue-500/80 hover:bg-slate-850/80 shadow-md transition cursor-pointer flex items-center justify-between group active:scale-[0.99]"
 >
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-blue-950/80 text-blue-300 flex items-center justify-center font-bold text-sm border border-blue-800/60 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
 {asig.grado?.nombre || 'G'}
 </div>

 <div>
 <h4 className="text-base font-bold text-slate-100 leading-snug group-hover:text-white transition">
 {asig.materia?.nombre}
 </h4>
 <p className="text-xs text-slate-400">
 Grado {asig.grado?.nombre} • {asig.materia?.area}
 </p>

 <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300">
 <span className="flex items-center gap-1">
 <Users className="w-3.5 h-3.5 text-slate-500" />
 {asig.totalEstudiantes} estudiantes
 </span>

 {asig.totalEnRiesgo > 0 ? (
 <span className="flex items-center gap-1 text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/80">
 <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
 {asig.totalEnRiesgo} en riesgo
 </span>
 ) : (
 <span className="text-emerald-300 font-medium bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/80">
 Al día
 </span>
 )}
 </div>
 </div>
 </div>

 <div className="text-slate-500 group-hover:text-blue-400 transition pl-2">
 <ChevronRight className="w-6 h-6" />
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )
}
