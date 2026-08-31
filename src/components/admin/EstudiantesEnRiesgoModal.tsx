import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { AlertTriangle, Search, Filter, X, User, CheckCircle } from 'lucide-react'

interface EstudiantesEnRiesgoModalProps {
 onClose: () => void
 periodoId: string
}

interface RiesgoItem {
 materia: string
 docente: string
 dificultad: string
 observacion: string
}

interface EstudianteData {
 codigo: string
 nombre: string
 gradoNombre: string
 tieneRiesgos: boolean
 riesgos: RiesgoItem[]
}

export const EstudiantesEnRiesgoModal: React.FC<EstudiantesEnRiesgoModalProps> = ({ onClose, periodoId }) => {
 const [allStudents, setAllStudents] = useState<EstudianteData[]>([])
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState('')
 const [selectedGrado, setSelectedGrado] = useState('TODOS')
 const [displayCount, setDisplayCount] = useState(20)

 useEffect(() => {
 loadAllStudentsAndRisks()
 }, [periodoId])

 const loadAllStudentsAndRisks = async () => {
 setLoading(true)
 try {
 // 1. Obtener todos los estudiantes de la institución
 const { data: estData } = await supabase
 .from('estudiantes')
 .select('codigo, nombre, grado:grados(nombre)')
 .order('nombre', { ascending: true })

 // 2. Obtener todos los preinformes en riesgo del periodo
 const { data: repData } = await supabase
 .from('preinformes')
 .select(`
 estudiante_codigo,
 dificultad_temas,
 observacion,
 asignacion:asignaciones!inner (
 materia:materias(nombre),
 docente:docentes(nombre)
 )
 `)
 .eq('periodo_id', periodoId)
 .eq('en_riesgo', true)

 if (estData) {
 const risksByStudent: { [cod: string]: RiesgoItem[] } = {}

 if (repData) {
 repData.forEach((item: any) => {
 const cod = item.estudiante_codigo
 if (!risksByStudent[cod]) {
 risksByStudent[cod] = []
 }
 risksByStudent[cod].push({
 materia: item.asignacion?.materia?.nombre || 'Asignatura',
 docente: item.asignacion?.docente?.nombre || 'Docente',
 dificultad: item.dificultad_temas || 'Sin temas especificados',
 observacion: item.observacion || 'Sin temas especificados'
 })
 })
 }

 const consolidated: EstudianteData[] = estData.map((st: any) => {
 const cod = st.codigo
 const riesgos = risksByStudent[cod] || []
 return {
 codigo: cod,
 nombre: st.nombre,
 gradoNombre: st.grado?.nombre || 'Grado',
 tieneRiesgos: riesgos.length > 0,
 riesgos: riesgos
 }
 })

 setAllStudents(consolidated)
 }
 } catch (e) {
 console.error('Error cargando estudiantes:', e)
 } finally {
 setLoading(false)
 }
 }

 const isSearching = searchTerm.trim().length > 0

 // Filtrado:
 // - Si no hay búsqueda de texto: Mostrar ÚNICAMENTE estudiantes con tieneRiesgos === true
 // - Si hay búsqueda de texto: Mostrar cualquier estudiante que coincida por nombre o código (indiferente a si está reportado o no)
 const filtered = allStudents.filter((st) => {
 const matchesGrado = selectedGrado === 'TODOS' || st.gradoNombre === selectedGrado

 if (!isSearching) {
 return st.tieneRiesgos && matchesGrado
 }

 const cleanQuery = searchTerm.toLowerCase().trim()
 const matchesSearch =
 st.nombre.toLowerCase().includes(cleanQuery) ||
 st.codigo.toLowerCase().includes(cleanQuery)

 return matchesSearch && matchesGrado
 })

 // Grados disponibles ordenados numéricamente
 const availableGrados = Array.from(new Set(allStudents.map((s) => s.gradoNombre))).sort((a, b) => {
 const na = parseInt(a.replace(/[^0-9]/g, '')) || 0
 const nb = parseInt(b.replace(/[^0-9]/g, '')) || 0
 return na - nb
 })

 const totalReportadosEnSistema = allStudents.filter((s) => s.tieneRiesgos).length
 const totalEnRiesgoEnFiltro = filtered.filter((s) => s.tieneRiesgos).length
 const totalAlDiaEnFiltro = filtered.filter((s) => !s.tieneRiesgos).length

 // Chunk visible para scroll continuo
 const visibleStudents = filtered.slice(0, displayCount)

 const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
 const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
 if (scrollHeight - scrollTop <= clientHeight + 50) {
 if (displayCount < filtered.length) {
 setDisplayCount((prev) => prev + 15)
 }
 }
 }

 return (
 <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
 <div className="bg-slate-900 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
 {/* Cabecera del Modal */}
 <div className="flex items-center justify-between pb-4 border-b border-slate-800">
 <div className="flex items-center gap-3">
 <div
 className={`p-2.5 rounded-xl border ${
 isSearching
 ? 'bg-blue-950/70 border-blue-800 text-blue-400'
 : 'bg-amber-950/70 border-amber-800 text-amber-400'
 }`}
 >
 {isSearching ? <Search className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
 </div>
 <div>
 <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
 <span>{isSearching ? 'Búsqueda de Estudiantes' : 'Estudiantes en Riesgo'}</span>
 <span
 className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold border ${
 isSearching
 ? 'bg-blue-950 text-blue-300 border-blue-800'
 : 'bg-amber-950 text-amber-300 border-amber-800'
 }`}
 >
 {isSearching
 ? `${filtered.length} coincidencias`
 : `${totalReportadosEnSistema} reportados`}
 </span>
 </h3>
 <p className="text-xs text-slate-400">
 {isSearching
 ? `Búsqueda universal en toda la institución (${totalEnRiesgoEnFiltro} en riesgo, ${totalAlDiaEnFiltro} al día)`
 : 'Mostrando únicamente estudiantes con alertas tempranas registradas'}
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

 {/* Buscador Universal y Filtro de Salones */}
 <div className="py-4 space-y-3 border-b border-slate-800">
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
 <input
 type="text"
 value={searchTerm}
 onChange={(e) => {
 setSearchTerm(e.target.value)
 setDisplayCount(20)
 }}
 placeholder="Buscar por nombre o código (busca en todos los estudiantes)..."
 className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500"
 />
 {searchTerm && (
 <button
 onClick={() => setSearchTerm('')}
 className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs font-bold"
 >
 
 </button>
 )}
 </div>

 {availableGrados.length > 0 && (
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
 <span className="text-slate-400 font-semibold flex items-center gap-1 pr-1">
 <Filter className="w-3 h-3" /> Salón:
 </span>
 <button
 onClick={() => {
 setSelectedGrado('TODOS')
 setDisplayCount(20)
 }}
 className={`px-3 py-1 rounded-lg font-bold transition flex-shrink-0 ${
 selectedGrado === 'TODOS'
 ? 'bg-blue-600 text-white'
 : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
 }`}
 >
 Todos ({allGradosCount(allStudents, isSearching)})
 </button>
 {availableGrados.map((g) => {
 const count = countForGrado(allStudents, g, isSearching)
 return (
 <button
 key={g}
 onClick={() => {
 setSelectedGrado(g)
 setDisplayCount(20)
 }}
 className={`px-3 py-1 rounded-lg font-bold transition flex-shrink-0 ${
 selectedGrado === g
 ? 'bg-blue-600 text-white'
 : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
 }`}
 >
 {g} ({count})
 </button>
 )
 })}
 </div>
 )}
 </div>

 {/* Lista con Lazy Loading */}
 <div
 onScroll={handleScroll}
 className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 divide-y divide-slate-800/50"
 >
 {loading ? (
 <div className="p-12 text-center text-slate-400 animate-pulse">
 Cargando estudiantes...
 </div>
 ) : filtered.length === 0 ? (
 <div className="p-12 text-center text-slate-400">
 {isSearching
 ? `No se encontró ningún estudiante que coincida con "${searchTerm}".`
 : 'No hay estudiantes en riesgo registrados en este salón o periodo.'}
 </div>
 ) : (
 visibleStudents.map((st) => (
 <div key={st.codigo} className="pt-3 first:pt-0">
 <div
 className={`bg-slate-950/70 p-4 rounded-xl border transition ${
 st.tieneRiesgos
 ? 'border-slate-800/80 hover:border-amber-700/60'
 : 'border-slate-850 hover:border-emerald-800/60'
 }`}
 >
 {/* Encabezado del Estudiante */}
 <div className="flex items-start justify-between gap-2 mb-2">
 <div className="flex items-center gap-2.5">
 <div
 className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs ${
 st.tieneRiesgos
 ? 'bg-amber-950/60 border-amber-800/80 text-amber-300'
 : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
 }`}
 >
 <User className="w-4 h-4" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-slate-100 leading-snug">
 {st.nombre}
 </h4>
 <p className="text-xs text-slate-400 font-mono">
 Código: {st.codigo}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <span className="px-2.5 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800/60 text-xs font-bold">
 Grado {st.gradoNombre}
 </span>
 {st.tieneRiesgos ? (
 <span className="px-2.5 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 text-xs font-extrabold flex items-center gap-1">
 <AlertTriangle className="w-3 h-3" />
 {st.riesgos.length} {st.riesgos.length === 1 ? 'riesgo' : 'riesgos'}
 </span>
 ) : (
 <span className="px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-extrabold flex items-center gap-1">
 <CheckCircle className="w-3 h-3" />
 Al día
 </span>
 )}
 </div>
 </div>

 {/* Estado del Estudiante: Materias en Riesgo vs Al Día */}
 {st.tieneRiesgos ? (
 <div className="mt-2.5 space-y-2">
 {st.riesgos.map((r, i) => (
 <div
 key={i}
 className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
 >
 <div>
 <span className="font-bold text-amber-300">{r.materia}</span>
 <span className="text-slate-400 font-normal"> • Profe {r.docente}</span>
 <p className="text-[11px] text-slate-300 mt-0.5 font-sans">
 <strong className="text-slate-400">Dificultad:</strong> {r.dificultad}
 </p>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="mt-2.5 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/60 text-xs flex items-center justify-between">
 <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
 <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
 Sin alertas en riesgo reportadas en este periodo
 </span>
 <span className="text-[11px] text-emerald-400/90 font-bold">
 100% al día
 </span>
 </div>
 )}
 </div>
 </div>
 ))
 )}

 {visibleStudents.length < filtered.length && (
 <div className="py-3 text-center text-xs text-slate-500 font-medium">
 Cargando más estudiantes ({visibleStudents.length} de {filtered.length})...
 </div>
 )}
 </div>

 {/* Pie del modal */}
 <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
 <span>
 Mostrando {visibleStudents.length} de {filtered.length} estudiantes
 {isSearching && ` (${totalEnRiesgoEnFiltro} en riesgo, ${totalAlDiaEnFiltro} al día)`}
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

function allGradosCount(students: EstudianteData[], isSearching: boolean): number {
 if (isSearching) return students.length
 return students.filter((s) => s.tieneRiesgos).length
}

function countForGrado(students: EstudianteData[], grado: string, isSearching: boolean): number {
 const gStudents = students.filter((s) => s.gradoNombre === grado)
 if (isSearching) return gStudents.length
 return gStudents.filter((s) => s.tieneRiesgos).length
}
