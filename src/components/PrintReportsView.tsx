import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Grado, Docente, Materia, Estudiante } from '../types/database'
import { ArrowLeft, Printer } from 'lucide-react'

interface PrintReportsViewProps {
 onBack: () => void
}

interface FlaggedRecord {
 estudiante: Estudiante
 grado: Grado
 materia: Materia
 docente: Docente
 dificultad: string
 observacion: string
}

export const PrintReportsView: React.FC<PrintReportsViewProps> = ({ onBack }) => {
 const [mode, setMode] = useState<'GRADO_BATCH' | 'DOCENTE_REPORT'>('GRADO_BATCH')
 const [grados, setGrados] = useState<Grado[]>([])
 const [docentes, setDocentes] = useState<Docente[]>([])
 const [selectedGradoId, setSelectedGradoId] = useState<string>('')
 const [selectedDocenteId, setSelectedDocenteId] = useState<string>('')
 const [flaggedRecords, setFlaggedRecords] = useState<FlaggedRecord[]>([])
 const [loading, setLoading] = useState(false)

 useEffect(() => {
 loadFiltersData()
 }, [])

 useEffect(() => {
 if (mode === 'GRADO_BATCH' && selectedGradoId) {
 loadGradeReports(selectedGradoId)
 } else if (mode === 'DOCENTE_REPORT' && selectedDocenteId) {
 loadTeacherReports(selectedDocenteId)
 }
 }, [mode, selectedGradoId, selectedDocenteId])

 const loadFiltersData = async () => {
 const { data: gData } = await supabase.from('grados').select('*').order('nombre', { ascending: true })
 const { data: dData } = await supabase.from('docentes').select('*').eq('rol', 'DOCENTE').order('nombre', { ascending: true })

 if (gData && gData.length > 0) {
 setGrados(gData)
 setSelectedGradoId(gData[0].id)
 }
 if (dData && dData.length > 0) {
 setDocentes(dData)
 setSelectedDocenteId(dData[0].id)
 }
 }

 const loadGradeReports = async (gradoId: string) => {
 setLoading(true)
 try {
 const { data, error } = await supabase
 .from('preinformes')
 .select(`
 dificultad_temas,
 observacion,
 estudiante:estudiantes!inner (codigo, nombre, grado_id),
 asignacion:asignaciones!inner (
 id,
 materia:materias (id, nombre, area),
 docente:docentes (id, nombre),
 grado:grados (id, nombre)
 )
 `)
 .eq('estudiantes.grado_id', gradoId)
 .eq('en_riesgo', true)

 if (!error && data) {
 const formatted: FlaggedRecord[] = data.map((item: any) => ({
 estudiante: item.estudiante,
 grado: item.asignacion.grado,
 materia: item.asignacion.materia,
 docente: item.asignacion.docente,
 dificultad: (item.dificultad_temas && item.dificultad_temas.trim()) ? item.dificultad_temas.trim() : 'Sin temas especificados',
 observacion: (item.observacion && item.observacion.trim()) ? item.observacion.trim() : 'Sin temas especificados'
 }))
 setFlaggedRecords(formatted)
 } else {
 setFlaggedRecords([])
 }
 } catch (e) {
 console.error('Error cargando reportes por grado:', e)
 } finally {
 setLoading(false)
 }
 }

 const loadTeacherReports = async (docenteId: string) => {
 setLoading(true)
 try {
 const { data, error } = await supabase
 .from('preinformes')
 .select(`
 dificultad_temas,
 observacion,
 estudiante:estudiantes (codigo, nombre, grado_id),
 asignacion:asignaciones!inner (
 id,
 docente_id,
 materia:materias (id, nombre, area),
 docente:docentes (id, nombre),
 grado:grados (id, nombre)
 )
 `)
 .eq('asignaciones.docente_id', docenteId)
 .eq('en_riesgo', true)

 if (!error && data) {
 const formatted: FlaggedRecord[] = data.map((item: any) => ({
 estudiante: item.estudiante,
 grado: item.asignacion.grado,
 materia: item.asignacion.materia,
 docente: item.asignacion.docente,
 dificultad: (item.dificultad_temas && item.dificultad_temas.trim()) ? item.dificultad_temas.trim() : 'Sin temas especificados',
 observacion: (item.observacion && item.observacion.trim()) ? item.observacion.trim() : 'Sin temas especificados'
 }))
 setFlaggedRecords(formatted)
 } else {
 setFlaggedRecords([])
 }
 } catch (e) {
 console.error('Error cargando reportes de docente:', e)
 } finally {
 setLoading(false)
 }
 }

 const groupedByStudent: { [codigo: string]: FlaggedRecord[] } = {}
 flaggedRecords.forEach((rec) => {
 if (!groupedByStudent[rec.estudiante.codigo]) {
 groupedByStudent[rec.estudiante.codigo] = []
 }
 groupedByStudent[rec.estudiante.codigo].push(rec)
 })

 const studentCodes = Object.keys(groupedByStudent)

 const handlePrint = () => {
 window.print()
 }

 return (
 <div>
 {/* Controles en Pantalla (Dark Mode) */}
 <div className="no-print max-w-6xl mx-auto px-4 py-6 sm:px-6">
 <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <button
 onClick={onBack}
 className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition"
 >
 <ArrowLeft className="w-5 h-5" />
 </button>
 <div>
 <h2 className="text-xl font-bold text-slate-100">
 Centro de Impresión y Documentos Oficiales
 </h2>
 <p className="text-xs text-slate-400">
 Boletas de citación listas para imprimir en lote (CSS Print Nativo)
 </p>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <button
 onClick={handlePrint}
 disabled={studentCodes.length === 0}
 className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg transition active:scale-95 disabled:opacity-50"
 >
 <Printer className="w-5 h-5" />
 <span>Imprimir Documentos ({studentCodes.length} alumnos)</span>
 </button>
 </div>
 </div>

 <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
 Formato de Documento:
 </label>
 <div className="grid grid-cols-2 gap-2">
 <button
 onClick={() => setMode('GRADO_BATCH')}
 className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition ${
 mode === 'GRADO_BATCH'
 ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
 : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
 }`}
 >
 Citaciones por Salón (Lote)
 </button>
 <button
 onClick={() => setMode('DOCENTE_REPORT')}
 className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition ${
 mode === 'DOCENTE_REPORT'
 ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
 : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
 }`}
 >
 Reporte por Docente
 </button>
 </div>
 </div>

 <div>
 {mode === 'GRADO_BATCH' ? (
 <div>
 <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
 Seleccionar Grado / Salón:
 </label>
 <select
 value={selectedGradoId}
 onChange={(e) => setSelectedGradoId(e.target.value)}
 className="w-full py-2.5 px-3 text-sm border border-slate-700 rounded-xl bg-slate-950 text-slate-100 focus:ring-2 focus:ring-blue-500"
 >
 {grados.map((g) => (
 <option key={g.id} value={g.id}>
 Grado {g.nombre}
 </option>
 ))}
 </select>
 </div>
 ) : (
 <div>
 <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
 Seleccionar Docente:
 </label>
 <select
 value={selectedDocenteId}
 onChange={(e) => setSelectedDocenteId(e.target.value)}
 className="w-full py-2.5 px-3 text-sm border border-slate-700 rounded-xl bg-slate-950 text-slate-100 focus:ring-2 focus:ring-blue-500"
 >
 {docentes.map((d) => (
 <option key={d.id} value={d.id}>
 {d.nombre}
 </option>
 ))}
 </select>
 </div>
 )}
 </div>
 </div>

 <div className="text-sm text-slate-400 mb-4">
 {loading ? (
 <span>Cargando datos para impresión...</span>
 ) : studentCodes.length === 0 ? (
 <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
 No hay estudiantes reportados en riesgo para la selección actual.
 </div>
 ) : (
 <span>
 Vista previa: <strong className="text-slate-100">{studentCodes.length} boletas oficiales</strong> generadas listas para impresión continua.
 </span>
 )}
 </div>
 </div>

 {/* ÁREA DE IMPRESIÓN OFICIAL (Hojas de papel blanco nítidas) */}
 <div className="max-w-4xl mx-auto px-4 pb-12">
 {studentCodes.map((cod) => {
 const studentItems = groupedByStudent[cod]
 const student = studentItems[0].estudiante
 const grado = studentItems[0].grado

 return (
 <div
 key={cod}
 className="bg-white text-slate-950 p-8 mb-8 border border-slate-300 rounded-lg shadow-2xl print:shadow-none print:border-0 print:p-0 page-break"
 >
 {/* Encabezado Oficial con Escudo y Resoluciones Legales */}
 <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-3 mb-4">
 <img
 src="/escudo.png"
 alt="Escudo Institucional"
 className="w-20 h-20 object-contain flex-shrink-0"
 />
 <div className="flex-1 text-center pr-6">
 <h1 className="text-base font-black text-slate-950 uppercase tracking-tight leading-tight">
 I.E. GENERAL SANTANDER
 </h1>
 <p className="text-[10px] font-medium text-slate-900 leading-snug">
 Ratificado mediante Resolución 0776 de 16 de Julio de 2009
 </p>
 <p className="text-[10px] font-medium text-slate-900 leading-snug">
 Aprobado Mediante Resolución No. 001111 de Sep.20 de 2000
 </p>
 <p className="text-[10px] font-bold text-slate-900 leading-snug">
 NIT: 800170307 &nbsp;&nbsp; DANE: 123001002125
 </p>
 <p className="text-[10px] font-extrabold text-slate-900 tracking-wider leading-snug">
 "LIDERAZGO-CIENCIA-DIVERSIDAD"
 </p>
 <p className="text-xs font-black text-slate-950 uppercase tracking-wide mt-0.5">
 BOLETÍN DE CALIFICACIONES 2026
 </p>
 </div>
 </div>

 {/* Ficha del Estudiante */}
 <div className="grid grid-cols-2 gap-2 text-xs mb-4 bg-slate-50 print:bg-transparent p-2.5 rounded border border-slate-200 print:border-slate-400">
 <div>
 <span className="font-bold text-slate-700">Estudiante:</span>{' '}
 <span className="font-black text-slate-950">{student.nombre}</span>
 </div>
 <div>
 <span className="font-bold text-slate-700">Código de Matrícula:</span>{' '}
 <span className="font-mono font-bold">{student.codigo}</span>
 </div>
 <div>
 <span className="font-bold text-slate-700">Grado / Grupo:</span>{' '}
 <span className="font-bold">{grado.nombre}</span>
 </div>
 <div>
 <span className="font-bold text-slate-700">Fecha de Expedición:</span>{' '}
 <span>{new Date().toLocaleDateString('es-CO')}</span>
 </div>
 </div>

 <p className="text-[11px] text-slate-800 text-justify mb-3 leading-relaxed">
 Apreciado(a) Padre de Familia o Acudiente: Le informamos que a la fecha de corte del presente periodo académico, el estudiante presenta dificultades y desempeño bajo en las siguientes asignaturas. Le solicitamos revisar los compromisos fijados y acompañar el proceso de recuperación:
 </p>

 <table className="w-full text-left text-[11px] border-collapse border border-slate-900 mb-6">
 <thead>
 <tr className="bg-slate-100 print:bg-slate-200 text-slate-950 font-bold border-b border-slate-900">
 <th className="border border-slate-900 p-2 w-1/4">Asignatura</th>
 <th className="border border-slate-900 p-2 w-1/4">Docente</th>
 <th className="border border-slate-900 p-2 w-1/4">Dificultad / Tema</th>
 <th className="border border-slate-900 p-2 w-1/4">Compromiso / Estrategia</th>
 </tr>
 </thead>
 <tbody>
 {studentItems.map((item, i) => (
 <tr key={i} className="border-b border-slate-400">
 <td className="border border-slate-900 p-2 font-bold align-top">
 {item.materia.nombre}
 </td>
 <td className="border border-slate-900 p-2 align-top text-slate-800">
 {item.docente.nombre}
 </td>
 <td className="border border-slate-900 p-2 align-top text-slate-900">
 {item.dificultad}
 </td>
 <td className="border border-slate-900 p-2 align-top text-slate-900">
 {item.observacion}
 </td>
 </tr>
 ))}
 </tbody>
 </table>

 <div className="grid grid-cols-3 gap-6 pt-10 text-center text-[10px] text-slate-800">
 <div className="border-t border-slate-900 pt-1">
 <p className="font-bold">Firma del Acudiente</p>
 <p className="text-[9px] text-slate-500">C.C. ___________________</p>
 </div>
 <div className="border-t border-slate-900 pt-1">
 <p className="font-bold">Director de Grupo</p>
 <p className="text-[9px] text-slate-500">Docente Titular</p>
 </div>
 <div className="border-t border-slate-900 pt-1">
 <p className="font-bold">Coordinación Académica</p>
 <p className="text-[9px] text-slate-500">IE General Santander</p>
 </div>
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )
}
