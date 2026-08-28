import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Asignacion, Estudiante, Preinforme } from '../types/database'
import { ArrowLeft, Check, Lock, Clock } from 'lucide-react'

interface TeacherGradingSheetProps {
  asignacion: Asignacion
  onBack: () => void
}

interface StudentRowState {
  estudiante: Estudiante
  enRiesgo: boolean
  dificultad: string
  observacion: string
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

const FRASES_FRECUENTES = [
  'Bajo rendimiento en evaluaciones escritas',
  'Incumplimiento reiterado de talleres y tareas',
  'Inasistencias injustificadas recurrentes',
  'Falta de participación y seguimiento en clase',
  'Dificultad en comprensión y aplicación de conceptos básicos'
]

export const TeacherGradingSheet: React.FC<TeacherGradingSheetProps> = ({ asignacion, onBack }) => {
  const { activePeriod } = useAuth()
  const [rows, setRows] = useState<StudentRowState[]>([])
  const [loading, setLoading] = useState(true)
  const isReadOnly = !activePeriod?.activo

  const debounceTimers = useRef<{ [codigo: string]: any }>({})

  useEffect(() => {
    loadStudentsAndReports()
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout)
    }
  }, [asignacion, activePeriod])

  const loadStudentsAndReports = async () => {
    setLoading(true)
    try {
      const { data: students, error: sErr } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('grado_id', asignacion.grado_id)
        .order('nombre', { ascending: true })

      if (sErr || !students) {
        setLoading(false)
        return
      }

      const { data: reports, error: rErr } = await supabase
        .from('preinformes')
        .select('*')
        .eq('asignacion_id', asignacion.id)
        .eq('periodo_id', activePeriod?.id || 'P-2026-3')

      const reportsMap: { [codigo: string]: Preinforme } = {}
      if (!rErr && reports) {
        reports.forEach((r) => {
          reportsMap[r.estudiante_codigo] = r
        })
      }

      const initialRows: StudentRowState[] = students.map((s) => {
        const rep = reportsMap[s.codigo]
        return {
          estudiante: s,
          enRiesgo: rep ? rep.en_riesgo : false,
          dificultad: rep?.dificultad_temas || '',
          observacion: rep?.observacion || '',
          saveStatus: 'idle'
        }
      })

      setRows(initialRows)
    } catch (e) {
      console.error('Error cargando planilla:', e)
    } finally {
      setLoading(false)
    }
  }

  const persistToDatabase = async (codigo: string, enRiesgo: boolean, dificultad: string, observacion: string) => {
    if (isReadOnly) return

    setRows((prev) =>
      prev.map((r) =>
        r.estudiante.codigo === codigo ? { ...r, saveStatus: 'saving' } : r
      )
    )

    try {
      const payload = {
        periodo_id: activePeriod?.id || 'P-2026-3',
        asignacion_id: asignacion.id,
        estudiante_codigo: codigo,
        en_riesgo: enRiesgo,
        nivel_riesgo: enRiesgo ? 'EN RIESGO' : null,
        dificultad_temas: enRiesgo ? dificultad.trim() : null,
        observacion: enRiesgo ? observacion.trim() : null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('preinformes')
        .upsert(payload, {
          onConflict: 'periodo_id,asignacion_id,estudiante_codigo'
        })

      if (error) throw error

      setRows((prev) =>
        prev.map((r) =>
          r.estudiante.codigo === codigo ? { ...r, saveStatus: 'saved' } : r
        )
      )

      setTimeout(() => {
        setRows((prev) =>
          prev.map((r) =>
            r.estudiante.codigo === codigo && r.saveStatus === 'saved'
              ? { ...r, saveStatus: 'idle' }
              : r
          )
        )
      }, 2500)
    } catch (e) {
      console.error('Error guardando registro:', e)
      setRows((prev) =>
        prev.map((r) =>
          r.estudiante.codigo === codigo ? { ...r, saveStatus: 'error' } : r
        )
      )
    }
  }

  const handleToggleRisk = (codigo: string, nuevoEstado: boolean) => {
    if (isReadOnly) return

    const currentRow = rows.find((r) => r.estudiante.codigo === codigo)
    if (!currentRow) return

    setRows((prev) =>
      prev.map((r) =>
        r.estudiante.codigo === codigo ? { ...r, enRiesgo: nuevoEstado } : r
      )
    )

    persistToDatabase(codigo, nuevoEstado, currentRow.dificultad, currentRow.observacion)
  }

  const handleTextChange = (codigo: string, field: 'dificultad' | 'observacion', val: string) => {
    if (isReadOnly) return

    setRows((prev) =>
      prev.map((r) =>
        r.estudiante.codigo === codigo ? { ...r, [field]: val, saveStatus: 'saving' } : r
      )
    )

    if (debounceTimers.current[codigo]) {
      clearTimeout(debounceTimers.current[codigo])
    }

    debounceTimers.current[codigo] = setTimeout(() => {
      const latestRow = rows.find((r) => r.estudiante.codigo === codigo)
      if (latestRow) {
        const latestDif = field === 'dificultad' ? val : latestRow.dificultad
        const latestObs = field === 'observacion' ? val : latestRow.observacion
        persistToDatabase(codigo, latestRow.enRiesgo, latestDif, latestObs)
      }
    }, 600)
  }

  const handleAddPresetChip = (codigo: string, frase: string) => {
    if (isReadOnly) return
    const row = rows.find((r) => r.estudiante.codigo === codigo)
    if (!row) return

    let newDif = row.dificultad.trim()
    if (newDif.length === 0) {
      newDif = frase
    } else if (!newDif.includes(frase)) {
      newDif = `${newDif}. ${frase}`
    }

    setRows((prev) =>
      prev.map((r) =>
        r.estudiante.codigo === codigo ? { ...r, dificultad: newDif } : r
      )
    )

    persistToDatabase(codigo, row.enRiesgo, newDif, row.observacion)
  }

  const totalEnRiesgo = rows.filter((r) => r.enRiesgo).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 pb-24">
      {/* Barra de navegación superior */}
      <div className="sticky top-16 z-30 bg-slate-950/90 backdrop-blur-md py-3 mb-4 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-sm active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mis salones
        </button>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Reportados
          </span>
          <p className="text-sm font-extrabold text-slate-100">
            {totalEnRiesgo} de {rows.length}
          </p>
        </div>
      </div>

      {/* Membrete de Asignatura */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-md border border-blue-800/60">
              Grado {asignacion.grado?.nombre}
            </span>
            <h2 className="text-xl font-bold text-slate-100 mt-1">
              {asignacion.materia?.nombre}
            </h2>
            <p className="text-xs text-slate-400">
              {asignacion.materia?.area} • {rows.length} estudiantes en lista
            </p>
          </div>

          {isReadOnly && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs font-medium self-start sm:self-auto">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Periodo cerrado (Solo lectura)</span>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Estudiantes */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.estudiante.codigo}
              className={`rounded-2xl border p-4 sm:p-5 transition shadow-sm ${
                row.enRiesgo
                  ? 'border-amber-700/60 bg-amber-950/15'
                  : 'border-slate-800 bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      #{index + 1}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 leading-tight">
                      {row.estudiante.nombre}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Código: {row.estudiante.codigo}
                  </p>
                </div>

                <div className="text-xs flex items-center gap-1 flex-shrink-0">
                  {row.saveStatus === 'saving' && (
                    <span className="text-slate-400 flex items-center gap-1 animate-pulse font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Guardando...
                    </span>
                  )}
                  {row.saveStatus === 'saved' && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Guardado
                    </span>
                  )}
                  {row.saveStatus === 'error' && (
                    <span className="text-rose-400 font-medium">
                      Error al guardar
                    </span>
                  )}
                </div>
              </div>

              {/* Selector de Estado */}
              <div className="mb-3">
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Estado académico:
                </label>
                <div className="grid grid-cols-2 gap-2 max-w-xs">
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => handleToggleRisk(row.estudiante.codigo, false)}
                    className={`py-2.5 px-4 text-sm font-bold rounded-xl border transition active:scale-95 disabled:opacity-60 ${
                      !row.enRiesgo
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    Normal
                  </button>

                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => handleToggleRisk(row.estudiante.codigo, true)}
                    className={`py-2.5 px-4 text-sm font-bold rounded-xl border transition active:scale-95 disabled:opacity-60 ${
                      row.enRiesgo
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    En riesgo
                  </button>
                </div>
              </div>

              {/* Campos Desplegables si está en riesgo */}
              {row.enRiesgo && (
                <div className="mt-4 pt-4 border-t border-amber-800/40 space-y-4">
                  {!isReadOnly && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Dificultades frecuentes (toca para agregar):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {FRASES_FRECUENTES.map((frase) => (
                          <button
                            key={frase}
                            type="button"
                            onClick={() => handleAddPresetChip(row.estudiante.codigo, frase)}
                            className="text-xs py-1 px-2.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border border-amber-700/50 transition active:scale-95 text-left"
                          >
                            + {frase}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Dificultad / Tema pendiente:
                    </label>
                    <textarea
                      rows={2}
                      disabled={isReadOnly}
                      value={row.dificultad}
                      onChange={(e) =>
                        handleTextChange(row.estudiante.codigo, 'dificultad', e.target.value)
                      }
                      placeholder="Indica qué desempeño o tema presenta dificultad..."
                      className="w-full p-3 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-500 disabled:opacity-60 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Compromiso de recuperación / Observación:
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={row.observacion}
                      onChange={(e) =>
                        handleTextChange(row.estudiante.codigo, 'observacion', e.target.value)
                      }
                      placeholder="ej. Taller de refuerzo y sustentación escrita"
                      className="w-full p-3 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-500 disabled:opacity-60 transition"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
