import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { AlertTriangle, Search, Filter, X, User } from 'lucide-react'

interface EstudiantesEnRiesgoModalProps {
  onClose: () => void
  periodoId: string
}

interface EstudianteConRiesgos {
  codigo: string
  nombre: string
  gradoNombre: string
  riesgos: {
    materia: string
    docente: string
    dificultad: string
    observacion: string
  }[]
}

export const EstudiantesEnRiesgoModal: React.FC<EstudiantesEnRiesgoModalProps> = ({ onClose, periodoId }) => {
  const [allStudents, setAllStudents] = useState<EstudianteConRiesgos[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrado, setSelectedGrado] = useState('TODOS')
  const [displayCount, setDisplayCount] = useState(20)

  useEffect(() => {
    loadFlaggedStudents()
  }, [periodoId])

  const loadFlaggedStudents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('preinformes')
        .select(`
          dificultad_temas,
          observacion,
          estudiante:estudiantes!inner (codigo, nombre, grado:grados(nombre)),
          asignacion:asignaciones!inner (
            materia:materias(nombre),
            docente:docentes(nombre)
          )
        `)
        .eq('periodo_id', periodoId)
        .eq('en_riesgo', true)

      if (!error && data) {
        const grouped: { [codigo: string]: EstudianteConRiesgos } = {}

        data.forEach((item: any) => {
          const cod = item.estudiante.codigo
          if (!grouped[cod]) {
            grouped[cod] = {
              codigo: cod,
              nombre: item.estudiante.nombre,
              gradoNombre: item.estudiante.grado?.nombre || 'Grado',
              riesgos: []
            }
          }

          grouped[cod].riesgos.push({
            materia: item.asignacion.materia?.nombre || 'Asignatura',
            docente: item.asignacion.docente?.nombre || 'Docente',
            dificultad: item.dificultad_temas || 'Sin temas especificados',
            observacion: item.observacion || 'Sin temas especificados'
          })
        })

        const sorted = Object.values(grouped).sort((a, b) => a.nombre.localeCompare(b.nombre))
        setAllStudents(sorted)
      }
    } catch (e) {
      console.error('Error cargando estudiantes en riesgo:', e)
    } finally {
      setLoading(false)
    }
  }

  // Filtrado
  const filtered = allStudents.filter((st) => {
    const matchesSearch = st.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrado = selectedGrado === 'TODOS' || st.gradoNombre === selectedGrado
    return matchesSearch && matchesGrado
  })

  // Lista de grados disponibles
  const availableGrados = Array.from(new Set(allStudents.map((s) => s.gradoNombre))).sort()

  // Lazy chunk
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
            <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-800 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Estudiantes en Riesgo</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-extrabold">
                  {allStudents.length} reportados
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Listado consolidado de alertas tempranas con carga progresiva
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

        {/* Buscador y Filtro de Grados */}
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
              placeholder="Buscar por nombre o código del estudiante..."
              className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-500"
            />
          </div>

          {availableGrados.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-slate-400 font-semibold flex items-center gap-1 pr-1">
                <Filter className="w-3 h-3" /> Salón:
              </span>
              <button
                onClick={() => { setSelectedGrado('TODOS'); setDisplayCount(20); }}
                className={`px-3 py-1 rounded-lg font-bold transition flex-shrink-0 ${
                  selectedGrado === 'TODOS'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Todos
              </button>
              {availableGrados.map((g) => (
                <button
                  key={g}
                  onClick={() => { setSelectedGrado(g); setDisplayCount(20); }}
                  className={`px-3 py-1 rounded-lg font-bold transition flex-shrink-0 ${
                    selectedGrado === g
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {g}
                </button>
              ))}
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
              Cargando estudiantes en riesgo...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No se encontraron estudiantes con los criterios de búsqueda.
            </div>
          ) : (
            visibleStudents.map((st) => (
              <div key={st.codigo} className="pt-3 first:pt-0">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 hover:border-amber-700/50 transition">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-300 flex items-center justify-center font-bold text-xs">
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

                    <span className="px-2.5 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800/60 text-xs font-bold">
                      Grado {st.gradoNombre}
                    </span>
                  </div>

                  {/* Asignaturas en riesgo */}
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
          <span>Mostrando {visibleStudents.length} de {filtered.length} estudiantes</span>
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
