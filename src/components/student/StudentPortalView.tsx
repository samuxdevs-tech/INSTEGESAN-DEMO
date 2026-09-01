import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Asignacion, Preinforme } from '../../types/database'
import { generateIndividualStudentPDF } from '../../utils/generatePdf'
import {
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Download,
  Share2,
  RefreshCw,
  LogOut,
  School,
  Sparkles,
  ShieldCheck
} from 'lucide-react'

export const StudentPortalView: React.FC = () => {
  const { user, activePeriod, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [studentData, setStudentData] = useState<any | null>(null)
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [preinformes, setPreinformes] = useState<Record<number, Preinforme>>({})
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadStudentPortalData()
    }
  }, [user, activePeriod])

  const loadStudentPortalData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Student Profile with Grado
      const { data: est, error: estErr } = await supabase
        .from('estudiantes')
        .select('*, grado:grados(*)')
        .ilike('codigo', user?.usuario || user?.id || '')
        .single()

      if (estErr || !est) {
        console.error('Error fetching student:', estErr)
        setLoading(false)
        return
      }

      setStudentData(est)

      // 2. Fetch all asignaciones for student's grado
      const { data: asigs, error: asigErr } = await supabase
        .from('asignaciones')
        .select('*, materia:materias(*), docente:docentes(*), grado:grados(*)')
        .eq('grado_id', est.grado_id)
        .order('id', { ascending: true })

      if (asigErr) {
        console.error('Error fetching asignaciones:', asigErr)
      } else if (asigs) {
        setAsignaciones(asigs)

        // 3. Fetch preinformes for this student in the active period
        if (activePeriod?.id) {
          const { data: preinfData, error: preErr } = await supabase
            .from('preinformes')
            .select('*')
            .eq('estudiante_codigo', est.codigo)
            .eq('periodo_id', activePeriod.id)

          if (!preErr && preinfData) {
            const map: Record<number, Preinforme> = {}
            preinfData.forEach(p => {
              map[p.asignacion_id] = p
            })
            setPreinformes(map)
          }
        }
      }
    } catch (e) {
      console.error('Error in student portal:', e)
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const totalSubjects = asignaciones.length
  const riskSubjects = asignaciones.filter(a => preinformes[a.id]?.en_riesgo)
  const passingSubjects = asignaciones.filter(a => !preinformes[a.id]?.en_riesgo)
  const hasRisks = riskSubjects.length > 0

  const handleDownloadPDF = async () => {
    if (!studentData || !activePeriod) return
    setDownloadingPdf(true)
    try {
      const studentObj = {
        codigo: studentData.codigo,
        nombre: studentData.nombre,
        grado: studentData.grado?.nombre || 'General'
      }

      const assignedList = asignaciones.map(a => {
        const report = preinformes[a.id]
        return {
          materia: a.materia?.nombre || 'Asignatura',
          docente: a.docente?.nombre || 'Docente Titular',
          enRiesgo: !!report?.en_riesgo,
          dificultades: report?.dificultad_temas || '',
          compromisos: report?.observacion || ''
        }
      })

      await generateIndividualStudentPDF(
        studentObj,
        activePeriod.nombre || '3er Periodo - 2026',
        assignedList
      )
    } catch (e: any) {
      alert(`Error generando boleta: ${e.message}`)
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleShareWhatsApp = () => {
    if (!studentData) return
    const riskNames = riskSubjects.map(a => `• *${a.materia?.nombre}* (${a.docente?.nombre})`).join('\n')
    
    let text = `📋 *PREINFORME ACADÉMICO OFICIAL*\n🏛️ *I.E. General Santander*\n\n`
    text += `👤 *Estudiante:* ${studentData.nombre}\n`
    text += `🏷️ *Código:* ${studentData.codigo}\n`
    text += `🏫 *Grado:* ${studentData.grado?.nombre || ''}\n`
    text += `📅 *Periodo:* ${activePeriod?.nombre || 'Actual'}\n\n`

    if (hasRisks) {
      text += `⚠️ *Asignaturas con Alerta Pedagógica (${riskSubjects.length}):*\n${riskNames}\n\n`
      text += `✅ *Asignaturas al Día:* ${passingSubjects.length} de ${totalSubjects}\n\n`
      text += `_Por favor comunicarse con la institución para coordinar el plan de mejoramiento pedagógico._`
    } else {
      text += `🎉 *¡Felicitaciones! Todas las ${totalSubjects} asignaturas se encuentran AL DÍA y en desempeño satisfactorio.* 🌟`
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* HEADER INSTITUCIONAL DEL ESTUDIANTE */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-100 uppercase tracking-wide leading-tight">
                I.E. General Santander
              </h1>
              <p className="text-[11px] text-purple-300 font-bold">
                Portal de Consulta Estudiantil y Familiar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-red-950 hover:border-red-800 hover:text-red-300 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">Cargando tus calificaciones y preinforme...</p>
          </div>
        ) : !studentData ? (
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center space-y-4 max-w-md mx-auto">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h2 className="text-base font-bold text-slate-100">No se encontró el registro del estudiante</h2>
            <p className="text-xs text-slate-400">Verifica que tu código de matrícula esté bien digitado o consulta en secretaría académica.</p>
            <button
              onClick={logout}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold"
            >
              Volver a Ingresar
            </button>
          </div>
        ) : (
          <>
            {/* TARJETA DE BIENVENIDA Y PERFIL DEL ALUMNO */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 p-5 sm:p-6 rounded-3xl border border-purple-800/40 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/30 flex items-center justify-center font-black text-xl text-white shadow-md">
                    {studentData.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700 text-[10px] font-black uppercase tracking-wider">
                      Estudiante Activo
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-slate-100 mt-1">
                      {studentData.nombre}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                      <span>Cód: <strong className="text-slate-200">{studentData.codigo}</strong></span>
                      <span>•</span>
                      <span>Salón: <strong className="text-purple-300 font-sans">Grado {studentData.grado?.nombre || 'General'}</strong></span>
                      <span>•</span>
                      <span>Periodo: <strong className="text-emerald-400 font-sans">{activePeriod?.nombre}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingPdf ? 'Generando PDF...' : 'Descargar Boleta PDF'}</span>
                  </button>

                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95"
                    title="Compartir resumen por WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RESUMEN DE ESTADO / METRICAS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10.5px] font-bold uppercase">Total Materias</span>
                  <BookOpen className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-2xl font-black text-slate-100">{totalSubjects}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Malla curricular</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10.5px] font-bold uppercase">Al Día</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-2xl font-black text-emerald-400">{passingSubjects.length}</span>
                <span className="text-[10px] text-emerald-500/80 block mt-0.5">Aprobando sin riesgo</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10.5px] font-bold uppercase">En Alerta</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-2xl font-black text-amber-400">{riskSubjects.length}</span>
                <span className="text-[10px] text-amber-500/80 block mt-0.5">Requieren mejora</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10.5px] font-bold uppercase">Efectividad</span>
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-2xl font-black text-purple-300">
                  {totalSubjects > 0 ? Math.round((passingSubjects.length / totalSubjects) * 100) : 0}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Avance del periodo</span>
              </div>
            </div>

            {/* BANNER INFORMATIVO / MENSAJE MOTIVACIONAL */}
            {hasRisks ? (
              <div className="bg-amber-950/40 border border-amber-800/80 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-300 text-sm">Alerta de Acompañamiento Pedagógico</h3>
                  <p className="mt-0.5">
                    Tienes <strong>{riskSubjects.length} {riskSubjects.length === 1 ? 'asignatura' : 'asignaturas'}</strong> con dificultades reportadas en el corte actual. Revisa los temas evaluados y las estrategias pedagógicas para nivelar a tiempo con cada docente antes del cierre definitivo del periodo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-800/80 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-emerald-200">
                <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-emerald-300 text-sm">¡Excelente Trabajo! Desempeño Satisfactorio</h3>
                  <p className="mt-0.5">
                    Todas tus asignaturas se encuentran al día en este corte evaluativo. Continúa con este gran compromiso y dedicación en tus estudios.
                  </p>
                </div>
              </div>
            )}

            {/* SECCIÓN 1: ASIGNATURAS EN ALERTA PEDAGÓGICA */}
            {hasRisks && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                    Asignaturas en Riesgo Pedagógico ({riskSubjects.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {riskSubjects.map(a => {
                    const report = preinformes[a.id]
                    return (
                      <div
                        key={a.id}
                        className="bg-slate-900 p-4 rounded-2xl border border-amber-800/60 shadow-md space-y-3 hover:border-amber-700 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-amber-400 font-bold uppercase block">{a.materia?.area || 'Área'}</span>
                            <h4 className="text-sm font-bold text-slate-100">{a.materia?.nombre}</h4>
                            <span className="text-[11px] text-slate-400 font-medium">Docente: {a.docente?.nombre}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-black uppercase flex-shrink-0">
                            En Riesgo
                          </span>
                        </div>

                        {report?.dificultad_temas && (
                          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                              Temas y Dificultades Detectadas:
                            </span>
                            <p className="text-slate-200">{report.dificultad_temas}</p>
                          </div>
                        )}

                        {report?.observacion && (
                          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                            <span className="text-[10px] text-purple-400 font-bold uppercase block mb-0.5">
                              Estrategia y Compromiso Pedagógico:
                            </span>
                            <p className="text-slate-300">{report.observacion}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SECCIÓN 2: ASIGNATURAS AL DÍA */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                  Asignaturas al Día ({passingSubjects.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {passingSubjects.map(a => (
                  <div
                    key={a.id}
                    className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-100 leading-tight">{a.materia?.nombre}</h4>
                      <span className="text-[10.5px] text-slate-400 block mt-0.5">{a.docente?.nombre}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-bold flex-shrink-0">
                      Al Día
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
