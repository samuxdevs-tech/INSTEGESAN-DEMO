import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CircularProgress } from './CircularProgress'
import { Grado } from '../../types/database'
import { Users, ChevronRight, ArrowLeft, X, AlertTriangle, CheckCircle } from 'lucide-react'

interface SalonesActivosModalProps {
 onClose: () => void
 periodoId: string
}

interface AsignacionDetalle {
 id: number
 materiaNombre: string
 materiaArea: string
 docenteNombre: string
 totalEstudiantes: number
 totalEnRiesgo: number
 totalEvaluados: number
 completada: boolean
 porcentaje: number
}

interface GradoConProgreso extends Grado {
 totalAsignaciones: number
 totalEvaluadas: number
 porcentaje: number
}

export const SalonesActivosModal: React.FC<SalonesActivosModalProps> = ({ onClose, periodoId }) => {
 const [grados, setGrados] = useState<GradoConProgreso[]>([])
 const [selectedGrado, setSelectedGrado] = useState<GradoConProgreso | null>(null)
 const [asignacionesGrado, setAsignacionesGrado] = useState<AsignacionDetalle[]>([])
 const [loading, setLoading] = useState(true)
 const [loadingDetails, setLoadingDetails] = useState(false)

 useEffect(() => {
 loadGradosProgress()
 }, [periodoId])

 const loadGradosProgress = async () => {
 setLoading(true)
 try {
 const { data: gData } = await supabase
 .from('grados')
 .select('*')
 .order('nombre', { ascending: true })

 const { data: asigData } = await supabase
 .from('asignaciones')
 .select('id, grado_id')

 const { data: repData } = await supabase
 .from('preinformes')
 .select('asignacion_id')
 .eq('periodo_id', periodoId)

 if (!gData || !asigData) {
 setLoading(false)
 return
 }

 const repCounts: { [asigId: number]: number } = {}
 if (repData) {
 repData.forEach((r) => {
 repCounts[r.asignacion_id] = (repCounts[r.asignacion_id] || 0) + 1
 })
 }

 const enhanced: GradoConProgreso[] = gData.map((g) => {
 const misAsigs = asigData.filter((a) => a.grado_id === g.id)
 let evaluadas = 0
 misAsigs.forEach((a) => {
 if (repCounts[a.id] && repCounts[a.id] > 0) {
 evaluadas += 1
 }
 })
 const pct = misAsigs.length > 0 ? Math.round((evaluadas / misAsigs.length) * 100) : 0

 return {
 ...g,
 totalAsignaciones: misAsigs.length,
 totalEvaluadas: evaluadas,
 porcentaje: pct
 }
 })

 setGrados(enhanced)
 } catch (e) {
 console.error('Error cargando progreso de grados:', e)
 } finally {
 setLoading(false)
 }
 }

 const loadGradoDetails = async (grado: GradoConProgreso) => {
 setSelectedGrado(grado)
 setLoadingDetails(true)
 try {
 const { data: asigs } = await supabase
 .from('asignaciones')
 .select(`
 id,
 materia:materias(nombre, area),
 docente:docentes(nombre)
 `)
 .eq('grado_id', grado.id)
 .order('materia_id', { ascending: true })

 const { count: totalEst } = await supabase
 .from('estudiantes')
 .select('*', { count: 'exact', head: true })
 .eq('grado_id', grado.id)

 const studentCount = totalEst || 0

 if (asigs) {
 const details: AsignacionDetalle[] = await Promise.all(
 asigs.map(async (a: any) => {
 const { count: evalCount } = await supabase
 .from('preinformes')
 .select('*', { count: 'exact', head: true })
 .eq('asignacion_id', a.id)
 .eq('periodo_id', periodoId)

 const { count: riesgoCount } = await supabase
 .from('preinformes')
 .select('*', { count: 'exact', head: true })
 .eq('asignacion_id', a.id)
 .eq('periodo_id', periodoId)
 .eq('en_riesgo', true)

 const totalEv = evalCount || 0
 const totalRk = riesgoCount || 0
 const pct = studentCount > 0 ? Math.min(100, Math.round((totalEv / studentCount) * 100)) : 0

 return {
 id: a.id,
 materiaNombre: a.materia?.nombre || 'Asignatura',
 materiaArea: a.materia?.area || '',
 docenteNombre: a.docente?.nombre || 'Docente',
 totalEstudiantes: studentCount,
 totalEnRiesgo: totalRk,
 totalEvaluados: totalEv,
 completada: totalEv > 0,
 porcentaje: pct > 0 ? pct : (totalEv > 0 ? 100 : 0)
 }
 })
 )

 setAsignacionesGrado(details)
 }
 } catch (e) {
 console.error('Error cargando detalles del salón:', e)
 } finally {
 setLoadingDetails(false)
 }
 }

 return (
 <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
 <div className="bg-slate-900 rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
 {/* Cabecera */}
 <div className="flex items-center justify-between pb-4 border-b border-slate-800">
 <div className="flex items-center gap-3">
 {selectedGrado ? (
 <button
 onClick={() => setSelectedGrado(null)}
 className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl transition border border-slate-700 flex items-center gap-1.5 text-xs font-bold active:scale-95"
 >
 <ArrowLeft className="w-4 h-4" />
 <span>Salones</span>
 </button>
 ) : (
 <div className="p-2.5 rounded-xl bg-blue-950/70 border border-blue-800 text-blue-400">
 <Users className="w-6 h-6" />
 </div>
 )}

 <div>
 <h3 className="text-lg font-bold text-slate-100">
 {selectedGrado ? `Grado ${selectedGrado.nombre} • Asignaturas` : 'Salones Activos Institucionales'}
 </h3>
 <p className="text-xs text-slate-400">
 {selectedGrado
 ? `Estado del registro por materia y docente en el Grado ${selectedGrado.nombre}`
 : 'Selecciona un salón para auditar el cumplimiento materia por materia'}
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

 {/* Vista 1: Grid de los 22 Salones */}
 {!selectedGrado && (
 <div className="flex-1 overflow-y-auto py-4">
 {loading ? (
 <div className="p-12 text-center text-slate-400 animate-pulse">
 Cargando salones...
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 {grados.map((g) => (
 <div
 key={g.id}
 onClick={() => loadGradoDetails(g)}
 className="bg-slate-950/70 hover:bg-slate-850 p-4 rounded-xl border border-slate-800 hover:border-blue-500/80 transition cursor-pointer flex items-center justify-between group active:scale-[0.98] shadow-sm"
 >
 <div className="flex items-center gap-3">
 <CircularProgress
 percentage={g.porcentaje}
 size={46}
 strokeWidth={4.5}
 colorClass={g.porcentaje === 100 ? 'text-emerald-400' : 'text-blue-500'}
 textSizeClass="text-[11px]"
 />

 <div>
 <h4 className="text-base font-extrabold text-slate-100 group-hover:text-blue-400 transition">
 Grado {g.nombre}
 </h4>
 <p className="text-xs text-slate-400">
 {g.totalEvaluadas} de {g.totalAsignaciones} materias
 </p>
 </div>
 </div>

 <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition" />
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Vista 2: Cajas Individuales por Asignatura (Diseño solicitado) */}
 {selectedGrado && (
 <div className="flex-1 overflow-y-auto py-4">
 {loadingDetails ? (
 <div className="p-12 text-center text-slate-400 animate-pulse">
 Cargando asignaturas del Grado {selectedGrado.nombre}...
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {asignacionesGrado.map((asig) => (
 <div
 key={asig.id}
 className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between shadow-md hover:border-slate-700 transition"
 >
 {/* Encabezado: Nombre del Docente y Materia */}
 <div className="border-b border-slate-800 pb-3 mb-3">
 <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
 DOCENTE TITULAR
 </span>
 <h4 className="text-sm font-extrabold text-slate-100 leading-snug">
 {asig.docenteNombre}
 </h4>
 <p className="text-xs font-semibold text-blue-400 mt-0.5">
 {asig.materiaNombre}
 </p>
 </div>

 {/* Gráfica Circular del Porcentaje */}
 <div className="py-2 flex flex-col items-center justify-center">
 <CircularProgress
 percentage={asig.porcentaje}
 size={82}
 strokeWidth={7}
 colorClass={asig.completada ? 'text-emerald-400' : 'text-amber-400'}
 textSizeClass="text-sm font-black"
 />
 <span className="text-xs font-semibold text-slate-300 mt-2">
 {asig.completada ? 'Planilla Registrada' : 'Pendiente por Registrar'}
 </span>
 </div>

 {/* Pie de la caja */}
 <div className="border-t border-slate-800 pt-2.5 mt-2 flex items-center justify-between text-xs">
 <span className="text-slate-400">
 {asig.totalEstudiantes} estudiantes
 </span>
 {asig.totalEnRiesgo > 0 ? (
 <span className="text-amber-400 font-bold flex items-center gap-1">
 <AlertTriangle className="w-3.5 h-3.5" />
 {asig.totalEnRiesgo} en riesgo
 </span>
 ) : (
 <span className="text-emerald-400 font-medium flex items-center gap-1">
 <CheckCircle className="w-3.5 h-3.5" />
 Al día
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Pie */}
 <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
 <span>
 {selectedGrado
 ? `${asignacionesGrado.length} asignaturas evaluadas en este grado`
 : `${grados.length} salones activos en la institución`}
 </span>
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
