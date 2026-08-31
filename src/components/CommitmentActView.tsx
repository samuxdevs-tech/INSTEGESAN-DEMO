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
      {/* Barra Superior de Control (Oculta en Impresión) */}
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
                Formato institucional calibrado para 1 sola hoja carta
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            disabled={!selectedStudent}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition active:scale-95 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Acta Oficial (1 Hoja)</span>
          </button>
        </div>
      </div>

      {/* Contenedor Principal */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:p-0 print:m-0 print:block">
        {/* Selector de Estudiante (Oculto en Impresión) */}
        <div className="print:hidden lg:col-span-4 space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Seleccionar Estudiante
            </span>

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

        {/* Hoja Oficial del Acta (Calibrada a 1 Sola Página en Impresión) */}
        <div className="lg:col-span-8 flex justify-center print:block print:w-full">
          {selectedStudent ? (
            <div className="w-full max-w-[215.9mm] bg-white text-slate-950 p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:rounded-none font-serif text-[11px] leading-[1.35] print:text-[10.5px] print:leading-[1.25]">
              {/* 1. Encabezado Institucional */}
              <div className="text-center pb-2.5 border-b-2 border-slate-900 mb-2.5">
                <div className="flex items-center justify-center gap-3">
                  <img
                    src="/escudo_transparente.png"
                    alt="Escudo IE General Santander"
                    className="w-12 h-12 object-contain"
                  />
                  <div>
                    <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase font-sans leading-none">
                      INSTITUCIÓN EDUCATIVA GENERAL SANTANDER
                    </h2>
                    <p className="text-[9px] text-slate-700 font-sans leading-tight mt-0.5">
                      Resolución 0776 de Julio 16 de 2009 • Res. 001111 de Sep. 20 de 2000 • NIT: 800170307 • DANE: 123001002125
                    </p>
                    <p className="text-[9.5px] font-bold italic text-slate-800 font-sans">
                      "LIDERAZGO - CIENCIA - DIVERSIDAD"
                    </p>
                  </div>
                </div>

                <div className="mt-1.5 py-0.5 bg-slate-100 border-y border-slate-300 text-center">
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-900 font-sans">
                    ACTA DE COMPROMISO ACADÉMICO Y ACOMPAÑAMIENTO FAMILIAR
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-600 font-sans">
                    Vigencia 2026 • {activePeriod?.nombre}
                  </span>
                </div>
              </div>

              {/* 2. Fundamento Legal Breve */}
              <p className="text-justify text-[9.5px] text-slate-600 mb-2 leading-tight italic">
                En cumplimiento de la Ley 115 de 1994, Decreto 1290 de 2009, Ley 1098 de 2006 (Art. 39) y el Manual de Convivencia Institucional, se suscribe la presente acta de compromiso pedagógico entre la Institución, el Estudiante y su Acudiente legal.
              </p>

              {/* 3. Datos de Identificación Compactos */}
              <div className="bg-slate-50 border border-slate-300 rounded-md p-2.5 mb-2.5 text-[10.5px] font-sans space-y-1.5">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-7">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] block">ESTUDIANTE:</span>
                    <p className="font-bold text-slate-900 text-xs truncate">{selectedStudent.estudiante.nombre}</p>
                  </div>
                  <div className="col-span-3">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] block">CÓDIGO:</span>
                    <p className="font-mono font-bold text-slate-900 text-xs">{selectedStudent.estudiante.codigo}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] block">GRADO:</span>
                    <p className="font-bold text-slate-900 text-xs">{selectedStudent.grado.nombre}</p>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 pt-1 border-t border-slate-200 items-end">
                  <div className="col-span-5">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] block">PADRE / ACUDIENTE:</span>
                    <div className="border-b border-slate-800 h-5 w-full"></div>
                  </div>
                  <div className="col-span-3">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] block">C.C. ACUDIENTE:</span>
                    <div className="border-b border-slate-800 h-5 w-full"></div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] block">TELÉFONO:</span>
                    <div className="border-b border-slate-800 h-5 w-full"></div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] block">FECHA:</span>
                    <p className="text-[10px] font-medium text-slate-800 leading-tight">{fechaHoy}</p>
                  </div>
                </div>
              </div>

              {/* 4. Asignaturas Diagnosticadas en Riesgo */}
              <div className="mb-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 font-sans mb-1">
                  1. Asignaturas Diagnosticadas con Bajo Desempeño
                </h4>

                <div className="border border-slate-300 rounded overflow-hidden font-sans">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-[9.5px]">
                        <th className="py-1 px-2 border-r border-slate-300 w-[24%]">Asignatura</th>
                        <th className="py-1 px-2 border-r border-slate-300 w-[24%]">Docente Titular</th>
                        <th className="py-1 px-2 border-r border-slate-300 w-[26%]">Dificultades Diagnosticadas</th>
                        <th className="py-1 px-2 w-[26%]">Estrategia / Compromiso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedStudent.riesgos.map((r, i) => (
                        <tr key={i}>
                          <td className="py-1 px-2 font-bold text-slate-950 border-r border-slate-200">
                            {r.materia}
                          </td>
                          <td className="py-1 px-2 text-slate-800 border-r border-slate-200">
                            {r.docente}
                          </td>
                          <td className="py-1 px-2 text-slate-800 border-r border-slate-200">
                            {r.dificultad}
                          </td>
                          <td className="py-1 px-2 text-slate-700 italic">
                            {r.observacion}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Compromisos del Estudiante */}
              <div className="mb-2 text-justify">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 font-sans mb-0.5">
                  2. Compromisos Formales del Estudiante
                </h4>
                <p className="text-[10px] text-slate-800 leading-tight">
                  Yo, <strong>{selectedStudent.estudiante.nombre}</strong>, me comprometo a:
                </p>
                <ul className="list-disc list-inside text-[9.5px] text-slate-700 space-y-0.5 pl-1 leading-tight">
                  <li>Asistir puntualmente a clases y presentar con honestidad la totalidad de guías, talleres y actividades.</li>
                  <li>Cumplir en los tiempos estipulados las actividades acordadas en la aula de clases.</li>
                </ul>
              </div>

              {/* 6. Compromisos del Acudiente */}
              <div className="mb-2 text-justify">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 font-sans mb-0.5">
                  3. Compromisos del Padre de Familia o Acudiente
                </h4>
                <p className="text-[10px] text-slate-800 leading-tight">
                  En calidad de acudiente legal, me comprometo formalmente a:
                </p>
                <ul className="list-disc list-inside text-[9.5px] text-slate-700 space-y-0.5 pl-1 leading-tight">
                  <li>Supervisar activamente en casa el horario de estudio, repaso y cumplimiento efectivo de tareas escolares.</li>
                  <li>Acudir puntualmente a las citaciones convocadas por los docentes y Coordinación Académica.</li>
                  <li>Garantizar los materiales indispensables y fomentar hábitos de disciplina y puntualidad en el hogar.</li>
                </ul>
              </div>

              {/* 7. Cláusula de Seguimiento */}
              <div className="mb-4 p-1.5 bg-slate-50 border border-slate-300 rounded text-[9px] text-justify text-slate-600 leading-tight font-sans">
                <strong>Cláusula de Seguimiento:</strong> Este compromiso será objeto de revisión periódica. Su incumplimiento injustificado será remitido a Comité de Evaluación y Promoción conforme al SIEE y Manual de Convivencia.
              </div>

              {/* 8. Firmas Formales en 4 Columnas */}
              <div className="grid grid-cols-4 gap-4 pt-1 font-sans text-center border-t border-slate-300">
                <div>
                  <div className="border-b border-slate-800 mb-1 h-9"></div>
                  <p className="font-bold text-slate-950 text-[9.5px] leading-tight">ESTUDIANTE</p>
                  <p className="text-[8.5px] text-slate-500">Doc: _________________</p>
                </div>

                <div>
                  <div className="border-b border-slate-800 mb-1 h-9"></div>
                  <p className="font-bold text-slate-950 text-[9.5px] leading-tight">ACUDIENTE</p>
                  <p className="text-[8.5px] text-slate-500">C.C: _________________</p>
                </div>

                <div>
                  <div className="border-b border-slate-800 mb-1 h-9"></div>
                  <p className="font-bold text-slate-950 text-[9.5px] leading-tight">DOCENTE / TITULAR</p>
                  <p className="text-[8.5px] text-slate-500">I.E. General Santander</p>
                </div>

                <div>
                  <div className="border-b border-slate-800 mb-1 h-9"></div>
                  <p className="font-bold text-slate-950 text-[9.5px] leading-tight">COORDINACIÓN</p>
                  <p className="text-[8.5px] text-slate-500">I.E. General Santander</p>
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
