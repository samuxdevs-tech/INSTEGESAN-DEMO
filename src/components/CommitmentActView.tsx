import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Estudiante, Grado } from '../types/database'
import { ArrowLeft, Printer, Search, FileText, User } from 'lucide-react'

interface CommitmentActViewProps {
 onBack: () => void
}

interface StudentWithRisks {
 estudiante: Estudiante
 grado: Grado
 riesgos: {
 materia: string
 docente: string
 dificultad: string
 observacion: string
 }[]
}

export const CommitmentActView: React.FC<CommitmentActViewProps> = ({ onBack }) => {
 const { effectiveUser, activePeriod } = useAuth()
 const [students, setStudents] = useState<StudentWithRisks[]>([])
 const [selectedStudent, setSelectedStudent] = useState<StudentWithRisks | null>(null)
 const [searchTerm, setSearchTerm] = useState('')
 const [selectedGrado, setSelectedGrado] = useState<string>('TODOS')
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 loadStudentsWithRisks()
 }, [effectiveUser, activePeriod])

 const loadStudentsWithRisks = async () => {
 setLoading(true)
 try {
 const { data: repData, error: repError } = await supabase
 .from('preinformes')
 .select(`
 dificultad_temas,
 observacion,
 estudiante:estudiantes!inner (
 codigo,
 nombre,
 grado:grados!inner (id, nombre)
 ),
 asignacion:asignaciones!inner (
 docente_id,
 materia:materias!inner (nombre),
 docente:docentes!inner (nombre)
 )
 `)
 .eq('periodo_id', activePeriod?.id || 'P-2026-3')
 .eq('en_riesgo', true)

 if (!repError && repData) {
 const map: { [cod: string]: StudentWithRisks } = {}

 repData.forEach((item: any) => {
 const isRelevantTeacher =
 effectiveUser?.rol === 'ADMIN' ||
 item.asignacion?.docente_id === effectiveUser?.id

 if (isRelevantTeacher) {
 const cod = item.estudiante.codigo
 if (!map[cod]) {
 map[cod] = {
 estudiante: {
 codigo: item.estudiante.codigo,
 nombre: item.estudiante.nombre,
 grado_id: item.estudiante.grado.id
 },
 grado: item.estudiante.grado,
 riesgos: []
 }
 }

 map[cod].riesgos.push({
 materia: item.asignacion?.materia?.nombre || 'Asignatura',
 docente: item.asignacion?.docente?.nombre || 'Docente',
 dificultad: (item.dificultad_temas && item.dificultad_temas.trim()) || 'Sin temas especificados',
 observacion: (item.observacion && item.observacion.trim()) || 'Sin temas especificados'
 })
 }
 })

 const list = Object.values(map).sort((a, b) => a.estudiante.nombre.localeCompare(b.estudiante.nombre))
 setStudents(list)
 if (list.length > 0) {
 setSelectedStudent(list[0])
 }
 }
 } catch (e) {
 console.error('Error cargando estudiantes para actas:', e)
 } finally {
 setLoading(false)
 }
 }

 const filtered = students.filter((s) => {
 const matchesSearch =
 s.estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
 s.estudiante.codigo.toLowerCase().includes(searchTerm.toLowerCase())
 const matchesGrado = selectedGrado === 'TODOS' || s.grado.nombre === selectedGrado
 return matchesSearch && matchesGrado
 })

 const availableGrados = Array.from(new Set(students.map((s) => s.grado.nombre))).sort((a, b) => {
 const na = parseInt(a.replace(/[^0-9]/g, '')) || 0
 const nb = parseInt(b.replace(/[^0-9]/g, '')) || 0
 return na - nb
 })

 const handlePrint = () => {
 window.print()
 }

 const fechaHoy = new Date().toLocaleDateString('es-CO', {
 day: 'numeric',
 month: 'long',
 year: 'numeric'
 })

 return (
 <div className="min-h-screen bg-slate-950 text-slate-100">
 {/* Barra de Control Superior */}
 <div className="print:hidden bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 sm:px-6">
 <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <button
 onClick={onBack}
 className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl transition border border-slate-700 active:scale-95 flex items-center gap-1.5 text-xs font-bold"
 >
 <ArrowLeft className="w-4 h-4" />
 <span>Volver</span>
 </button>

 <div>
 <h1 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
 <FileText className="w-5 h-5 text-blue-400" />
 <span>Actas de Compromiso Académico</span>
 </h1>
 <p className="text-xs text-slate-400">
 Documento oficial de acompañamiento y corresponsabilidad familiar
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={handlePrint}
 disabled={!selectedStudent}
 className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition active:scale-95 disabled:opacity-50"
 >
 <Printer className="w-4 h-4" />
 <span>Imprimir Acta Oficial</span>
 </button>
 </div>
 </div>
 </div>

 {/* Contenedor Principal */}
 <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Columna Izquierda: Selector de Estudiante */}
 <div className="print:hidden lg:col-span-4 space-y-4">
 <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md space-y-3">
 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
 Seleccionar Estudiante
 </span>

 {/* Buscador */}
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
 <input
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Buscar por nombre o código..."
 className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
 />
 </div>

 {/* Filtro de Salón */}
 {availableGrados.length > 0 && (
 <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
 <button
 onClick={() => setSelectedGrado('TODOS')}
 className={`px-2.5 py-1 rounded-lg font-bold transition flex-shrink-0 text-[11px] ${
 selectedGrado === 'TODOS'
 ? 'bg-blue-600 text-white'
 : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
 }`}
 >
 Todos ({students.length})
 </button>
 {availableGrados.map((g) => (
 <button
 key={g}
 onClick={() => setSelectedGrado(g)}
 className={`px-2.5 py-1 rounded-lg font-bold transition flex-shrink-0 text-[11px] ${
 selectedGrado === g
 ? 'bg-blue-600 text-white'
 : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
 }`}
 >
 {g}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Lista de Estudiantes con Dificultad */}
 <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden max-h-[600px] overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
 {loading ? (
 <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
 Cargando estudiantes...
 </div>
 ) : filtered.length === 0 ? (
 <div className="p-8 text-center text-xs text-slate-400">
 No hay estudiantes con asignaturas en riesgo registrados.
 </div>
 ) : (
 filtered.map((item) => {
 const isSelected = selectedStudent?.estudiante.codigo === item.estudiante.codigo
 return (
 <div
 key={item.estudiante.codigo}
 onClick={() => setSelectedStudent(item)}
 className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-between gap-2 border ${
 isSelected
 ? 'bg-blue-950/60 border-blue-600/80 text-white'
 : 'bg-slate-950/60 hover:bg-slate-850 border-transparent text-slate-300'
 }`}
 >
 <div className="flex items-center gap-2.5">
 <div
 className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
 isSelected
 ? 'bg-blue-600 text-white'
 : 'bg-slate-800 text-slate-400'
 }`}
 >
 <User className="w-4 h-4" />
 </div>
 <div>
 <h4 className="text-xs font-bold leading-tight">
 {item.estudiante.nombre}
 </h4>
 <span className="text-[10.5px] text-slate-400 font-mono">
 {item.estudiante.codigo} • Grado {item.grado.nombre}
 </span>
 </div>
 </div>

 <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80 text-[10.5px] font-bold flex-shrink-0">
 {item.riesgos.length} {item.riesgos.length === 1 ? 'materia' : 'materias'}
 </span>
 </div>
 )
 })
 )}
 </div>
 </div>

 {/* Columna Derecha: Hoja Oficial del Acta */}
 <div className="lg:col-span-8 flex justify-center">
 {selectedStudent ? (
 <div className="w-full bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:rounded-none font-serif text-[13px] leading-relaxed">
 {/* Encabezado Legal Institucional */}
 <div className="text-center pb-4 border-b-2 border-slate-900 mb-5">
 <div className="flex items-center justify-center gap-3 mb-2">
 <img
 src="/escudo_transparente.png"
 alt="Escudo IE General Santander"
 className="w-16 h-16 object-contain"
 />
 <div>
 <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase font-sans">
 INSTITUCIÓN EDUCATIVA GENERAL SANTANDER
 </h2>
 <p className="text-[10px] text-slate-700 font-sans leading-tight">
 Ratificado mediante Resolución 0776 de 16 de Julio de 2009<br />
 Aprobado Mediante Resolución No. 001111 de Sep.20 de 2000<br />
 NIT: 800170307 • DANE: 123001002125
 </p>
 <p className="text-[10.5px] font-bold italic text-slate-800 font-sans mt-0.5">
 "LIDERAZGO - CIENCIA - DIVERSIDAD"
 </p>
 </div>
 </div>

 <div className="mt-3 py-1 bg-slate-100 border-y border-slate-300 text-center">
 <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900 font-sans">
 ACTA DE COMPROMISO ACADÉMICO Y ACOMPAÑAMIENTO FAMILIAR
 </h3>
 <span className="text-[11px] font-semibold text-slate-700 font-sans">
 Vigencia Lectiva 2026 • {activePeriod?.nombre}
 </span>
 </div>
 </div>

 {/* Fundamento Legal */}
 <p className="text-justify text-[11.5px] text-slate-700 mb-4 leading-normal italic">
 En cumplimiento de lo consagrado en la <strong>Ley General de Educación (Ley 115 de 1994)</strong>, el <strong>Decreto 1290 de 2009</strong> (Evaluación del Aprendizaje y Promoción de los Estudiantes), el <strong>Código de Infancia y Adolescencia (Ley 1098 de 2006, Art. 39)</strong> sobre las obligaciones de la familia en la educación, y el <strong>Manual de Convivencia Institucional</strong>, se suscribe la presente acta de compromiso pedagógico entre la Institución, el Estudiante y su Acudiente legal.
 </p>

 {/* Sección 1: Datos de Identificación */}
 <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 mb-5 text-xs font-sans space-y-3">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-0.5">ESTUDIANTE:</span>
 <p className="font-bold text-slate-900 text-sm">{selectedStudent.estudiante.nombre}</p>
 </div>
 <div>
 <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-0.5">CÓDIGO / DOCUMENTO:</span>
 <p className="font-mono font-bold text-slate-900 text-sm">{selectedStudent.estudiante.codigo}</p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-slate-200">
 <div>
 <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-0.5">GRADO:</span>
 <p className="font-bold text-slate-900">{selectedStudent.grado.nombre}</p>
 </div>
 <div className="sm:col-span-2">
 <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-1">
 NOMBRE DEL PADRE DE FAMILIA / ACUDIENTE:
 </span>
 <div className="border-b-2 border-slate-900 h-9 w-full"></div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-slate-200">
 <div>
 <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-1">
 C.C. / DOCUMENTO ACUDIENTE:
 </span>
 <div className="border-b-2 border-slate-900 h-8 w-full"></div>
 </div>
 <div>
 <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-1">
 TELÉFONO DE CONTACTO:
 </span>
 <div className="border-b-2 border-slate-900 h-8 w-full"></div>
 </div>
 <div>
 <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-0.5">
 FECHA DE SUSCRIPCIÓN:
 </span>
 <p className="font-medium text-slate-800 pt-2">{fechaHoy}</p>
 </div>
 </div>
 </div>

 {/* Sección 2: Citación Textual de Asignaturas en Riesgo */}
 <div className="mb-4">
 <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans mb-2">
 1. Situación Académica y Asignaturas Diagnosticadas en Riesgo
 </h4>

 <div className="border border-slate-300 rounded-lg overflow-hidden font-sans text-xs">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-[11px]">
 <th className="py-2 px-3 border-r border-slate-300 w-1/4">Asignatura</th>
 <th className="py-2 px-3 border-r border-slate-300 w-1/4">Docente Titular</th>
 <th className="py-2 px-3 border-r border-slate-300 w-1/4">Dificultades Registradas</th>
 <th className="py-2 px-3 w-1/4">Compromiso / Estrategia</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 text-[11px]">
 {selectedStudent.riesgos.map((r, i) => (
 <tr key={i} className="hover:bg-slate-50">
 <td className="py-2 px-3 font-bold text-slate-950 border-r border-slate-200">
 {r.materia}
 </td>
 <td className="py-2 px-3 text-slate-800 border-r border-slate-200">
 {r.docente}
 </td>
 <td className="py-2 px-3 text-slate-800 border-r border-slate-200">
 {r.dificultad}
 </td>
 <td className="py-2 px-3 text-slate-700 italic">
 {r.observacion}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Sección 3: Compromisos del Estudiante */}
 <div className="mb-4 text-justify">
 <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans mb-1.5">
 2. Compromisos Formales del Estudiante
 </h4>
 <p className="text-[11.5px] text-slate-800 leading-relaxed">
 Yo, <strong>{selectedStudent.estudiante.nombre}</strong>, reconozco mis dificultades académicas en las asignaturas citadas y me comprometo a:
 </p>
 <ul className="list-disc list-inside text-[11px] text-slate-800 space-y-0.5 mt-1 pl-1">
 <li>Asistir puntualmente con disposición activa, respeto y atención a todas las clases y jornadas pedagógicas de nivelación.</li>
 <li>Presentar con calidad, honestidad y dentro de los plazos establecidos la totalidad de guías, talleres y evaluaciones de recuperación.</li>
 <li>Portar diariamente los cuadernos, libros y útiles indispensables para el aprendizaje, absteniéndome del uso de distractores en el aula.</li>
 </ul>
 </div>

 {/* Sección 4: Compromisos del Padre de Familia / Acudiente */}
 <div className="mb-4 text-justify">
 <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans mb-1.5">
 3. Compromisos del Padre de Familia o Acudiente
 </h4>
 <p className="text-[11.5px] text-slate-800 leading-relaxed">
 En calidad de acudiente legal, me comprometo formalmente con el proceso formativo de mi acudido a:
 </p>
 <ul className="list-disc list-inside text-[11px] text-slate-800 space-y-0.5 mt-1 pl-1">
 <li>Establecer un horario de estudio obligatorio en casa y revisar diariamente cuadernos y avances académicos.</li>
 <li>Garantizar los materiales requeridos para el cumplimiento de sus deberes escolares.</li>
 <li>Acudir obligatoria y puntualmente a las citaciones, llamados de seguimiento y entrega de informes programados por los docentes y Coordinación.</li>
 <li>Orientar con el ejemplo la disciplina, puntualidad y cumplimiento de las normas institucionales.</li>
 </ul>
 </div>

 {/* Sección 5: Cláusula de Validez y Cierre */}
 <div className="mb-8 p-2.5 bg-slate-50 border border-slate-300 rounded text-[11px] text-justify text-slate-700 leading-tight font-sans">
 <strong>Cláusula de Seguimiento:</strong> El presente compromiso será evaluado de forma periódica por los docentes de área y la Dirección de Grupo. El incumplimiento no justificado será causal de remisión al Comité de Evaluación y Promoción y acarreará las medidas estipuladas en el Sistema Institucional de Evaluación (SIEE) y el Manual de Convivencia.
 </div>

 {/* Sección 6: Bloque de Firmas Formales en 4 Columnas */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 font-sans text-xs text-center border-t border-slate-300">
 <div>
 <div className="border-b border-slate-900 mb-1.5 h-12"></div>
 <p className="font-bold text-slate-950 text-[11px]">FIRMA DEL ESTUDIANTE</p>
 <p className="text-[10px] text-slate-600">Doc: ___________________</p>
 </div>

 <div>
 <div className="border-b border-slate-900 mb-1.5 h-12"></div>
 <p className="font-bold text-slate-950 text-[11px]">FIRMA DEL ACUDIENTE</p>
 <p className="text-[10px] text-slate-600">C.C: ___________________</p>
 </div>

 <div>
 <div className="border-b border-slate-900 mb-1.5 h-12"></div>
 <p className="font-bold text-slate-950 text-[11px]">DOCENTE / TITULAR</p>
 <p className="text-[10px] text-slate-600">I.E. General Santander</p>
 </div>

 <div>
 <div className="border-b border-slate-900 mb-1.5 h-12"></div>
 <p className="font-bold text-slate-950 text-[11px]">COORDINACIÓN ACADÉMICA</p>
 <p className="text-[10px] text-slate-600">I.E. General Santander</p>
 </div>
 </div>
 </div>
 ) : (
 <div className="w-full bg-slate-900 p-12 rounded-2xl border border-slate-800 text-center text-slate-400">
 Selecciona un estudiante para generar el acta de compromiso oficial.
 </div>
 )}
 </div>
 </div>
 </div>
 )
}
