import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Grado, Docente, Materia, Estudiante } from '../types/database'
import { ArrowLeft, Printer, FileText, CheckCircle2 } from 'lucide-react'

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
  const { activePeriod } = useAuth()
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
  }, [mode, selectedGradoId, selectedDocenteId, activePeriod])

  const loadFiltersData = async () => {
    const { data: gData } = await supabase
      .from('grados')
      .select('*')
      .order('nombre', { ascending: true })

    const { data: dData } = await supabase
      .from('docentes')
      .select('*')
      .eq('rol', 'DOCENTE')
      .order('nombre', { ascending: true })

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
        .eq('periodo_id', activePeriod?.id || 'P-2026-3')
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

        // Ordenar alfabéticamente por nombre de estudiante
        formatted.sort((a, b) => a.estudiante.nombre.localeCompare(b.estudiante.nombre))
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
          estudiante:estudiantes!inner (codigo, nombre, grado_id),
          asignacion:asignaciones!inner (
            id,
            docente_id,
            materia:materias (id, nombre, area),
            docente:docentes (id, nombre),
            grado:grados (id, nombre)
          )
        `)
        .eq('asignaciones.docente_id', docenteId)
        .eq('periodo_id', activePeriod?.id || 'P-2026-3')
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

        formatted.sort((a, b) => {
          if (a.grado.nombre !== b.grado.nombre) {
            return a.grado.nombre.localeCompare(b.grado.nombre)
          }
          return a.estudiante.nombre.localeCompare(b.estudiante.nombre)
        })

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

  const selectedGradoObj = grados.find((g) => g.id === selectedGradoId)
  const selectedDocenteObj = docentes.find((d) => d.id === selectedDocenteId)

  const handlePrint = () => {
    window.print()
  }

  const fechaHoy = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // Conteo de estudiantes únicos reportados
  const uniqueStudentsCount = new Set(flaggedRecords.map((r) => r.estudiante.codigo)).size

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Controles en Pantalla (Ocultos en Impresión) */}
      <div className="print:hidden max-w-6xl mx-auto px-4 py-6 sm:px-6">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Centro de Impresión y Documentos Oficiales</span>
              </h2>
              <p className="text-xs text-slate-400">
                Planillas institucionales de citación y notificación para control y firmas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={flaggedRecords.length === 0}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-5 h-5" />
              <span>
                {mode === 'GRADO_BATCH'
                  ? `Imprimir Planilla del Salón (${flaggedRecords.length} filas)`
                  : `Imprimir Planilla Docente (${flaggedRecords.length} filas)`}
              </span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Tipo de Planilla Oficial:
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
                Planilla por Salón
              </button>
              <button
                onClick={() => setMode('DOCENTE_REPORT')}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition ${
                  mode === 'DOCENTE_REPORT'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Planilla por Docente
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
          ) : flaggedRecords.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
              No hay estudiantes reportados en riesgo para la selección actual.
            </div>
          ) : (
            <span className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Vista previa oficial:{' '}
              <strong className="text-slate-100">
                {flaggedRecords.length} asignaturas reportadas ({uniqueStudentsCount} estudiantes en riesgo)
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* ÁREA DE IMPRESIÓN OFICIAL: PLANILLA EN TABLA (Estudiante | Asignatura | Firma Estudiante | Firma Docente) */}
      {flaggedRecords.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 pb-12 print:p-0 print:m-0 print:max-w-full">
          <div className="bg-white text-slate-950 p-8 border border-slate-300 rounded-2xl shadow-2xl print:shadow-none print:border-0 print:p-0 print:rounded-none">
            {/* Encabezado Institucional Legal */}
            <div className="flex items-center gap-4 border-b-2 border-slate-950 pb-3 mb-4">
              <img
                src="/escudo_transparente.png"
                alt="Escudo Institucional"
                className="w-16 h-16 object-contain flex-shrink-0"
              />
              <div className="flex-1 text-center pr-4">
                <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight leading-tight font-sans">
                  INSTITUCIÓN EDUCATIVA GENERAL SANTANDER
                </h1>
                <p className="text-[10px] text-slate-800 font-sans leading-tight">
                  Ratificado mediante Resolución 0776 de 16 de Julio de 2009 • Aprobado Mediante Resolución No. 001111 de Sep.20 de 2000
                </p>
                <p className="text-[10px] font-bold text-slate-900 font-sans leading-tight">
                  NIT: 800170307 &nbsp;•&nbsp; DANE: 123001002125 &nbsp;•&nbsp; "LIDERAZGO - CIENCIA - DIVERSIDAD"
                </p>
                <div className="mt-1 py-0.5 bg-slate-100 border border-slate-300 text-center rounded">
                  <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-950 font-sans">
                    {mode === 'GRADO_BATCH'
                      ? `PLANILLA DE CITACIÓN Y NOTIFICACIÓN DE ESTUDIANTES EN RIESGO — GRADO ${selectedGradoObj?.nombre || ''}`
                      : `PLANILLA DE NOTIFICACIÓN DE ESTUDIANTES EN RIESGO — DOCENTE: ${selectedDocenteObj?.nombre || ''}`}
                  </h2>
                </div>
              </div>
            </div>

            {/* Ficha de Metadatos de la Planilla */}
            <div className="grid grid-cols-3 gap-2 text-xs mb-3 bg-slate-50 border border-slate-300 rounded p-2 font-sans">
              <div>
                <span className="font-semibold text-slate-600 uppercase text-[10px] block">
                  {mode === 'GRADO_BATCH' ? 'SALÓN / GRUPO:' : 'DOCENTE TITULAR:'}
                </span>
                <span className="font-bold text-slate-950">
                  {mode === 'GRADO_BATCH'
                    ? `Grado ${selectedGradoObj?.nombre || ''}`
                    : selectedDocenteObj?.nombre || ''}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-600 uppercase text-[10px] block">PERIODO ACADÉMICO:</span>
                <span className="font-bold text-slate-950">{activePeriod?.nombre || 'Periodo 3 - 2026'}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-600 uppercase text-[10px] block">FECHA DE EMISIÓN:</span>
                <span className="font-medium text-slate-800">{fechaHoy}</span>
              </div>
            </div>

            {/* Explicación Legal Breve */}
            <p className="text-[10px] text-slate-700 text-justify mb-3 leading-snug italic font-serif">
              La presente planilla certifica la notificación formal a los estudiantes que registran dificultades académicas y asignaturas con bajo desempeño en el corte del periodo, con el respectivo compromiso pedagógico de nivelación y acompañamiento docente en cumplimiento del SIEE y el Manual de Convivencia Institucional.
            </p>

            {/* TABLA PRINCIPAL: Estudiante | Asignatura | Firma Estudiante | Firma Docente */}
            <table className="w-full text-left border-collapse border border-slate-950 mb-6 font-sans text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-950 text-[10.5px]">
                  <th className="border border-slate-950 p-2 w-[6%] text-center">N°</th>
                  <th className="border border-slate-950 p-2 w-[34%]">Estudiante</th>
                  <th className="border border-slate-950 p-2 w-[28%]">Asignatura</th>
                  <th className="border border-slate-950 p-2 w-[16%] text-center">Firma Estudiante</th>
                  <th className="border border-slate-950 p-2 w-[16%] text-center">Firma Docente</th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {flaggedRecords.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-400 hover:bg-slate-50">
                    <td className="border border-slate-950 p-2 text-center font-bold text-slate-700 align-middle">
                      {idx + 1}
                    </td>

                    <td className="border border-slate-950 p-2 align-middle">
                      <p className="font-bold text-slate-950 leading-tight">
                        {item.estudiante.nombre}
                      </p>
                      <span className="text-[9.5px] text-slate-600 font-mono">
                        Cód: {item.estudiante.codigo}
                        {mode === 'DOCENTE_REPORT' && ` • Grado ${item.grado.nombre}`}
                      </span>
                    </td>

                    <td className="border border-slate-950 p-2 align-middle">
                      <p className="font-bold text-slate-900 leading-tight">
                        {item.materia.nombre}
                      </p>
                      <span className="text-[9.5px] text-slate-600">
                        {mode === 'GRADO_BATCH'
                          ? `Docente: ${item.docente.nombre}`
                          : item.materia.area}
                      </span>
                    </td>

                    <td className="border border-slate-950 p-2 align-bottom text-center">
                      <div className="h-8 border-b border-dashed border-slate-400 flex items-end justify-center">
                        {/* Espacio para firma física manuscrita del estudiante */}
                      </div>
                    </td>

                    <td className="border border-slate-950 p-2 align-bottom text-center">
                      <div className="h-8 border-b border-dashed border-slate-400 flex items-end justify-center">
                        {/* Espacio para firma física manuscrita del docente */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bloque de Firmas de Cierre Institucional */}
            <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs font-sans text-slate-900 border-t border-slate-300">
              <div>
                <div className="border-b border-slate-900 mb-1.5 h-10"></div>
                <p className="font-bold text-slate-950 text-[11px]">
                  {mode === 'GRADO_BATCH' ? 'DIRECTOR(A) DE GRUPO' : 'DOCENTE TITULAR'}
                </p>
                <p className="text-[10px] text-slate-600">
                  {mode === 'GRADO_BATCH'
                    ? `Dirección de Grupo - Grado ${selectedGradoObj?.nombre || ''}`
                    : selectedDocenteObj?.nombre || ''}
                </p>
              </div>

              <div>
                <div className="border-b border-slate-900 mb-1.5 h-10"></div>
                <p className="font-bold text-slate-950 text-[11px]">COORDINACIÓN ACADÉMICA</p>
                <p className="text-[10px] text-slate-600">I.E. General Santander</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
