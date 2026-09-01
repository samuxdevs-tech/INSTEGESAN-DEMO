import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Docente, Estudiante, Grado, Materia, Asignacion, Periodo } from '../../types/database'
import {
  ShieldAlert,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Layers,
  Database,
  Plus,
  Trash2,
  Edit2,
  Search,
  Download,
  CheckCircle,
  X,
  RefreshCw,
  Eye
} from 'lucide-react'

interface MasterControlViewProps {
  onGoCoordinator: () => void
}

type TabType = 'DOCENTES' | 'ESTUDIANTES' | 'ASIGNACIONES' | 'MATERIAS_GRADOS' | 'PERIODOS' | 'DIAGNOSTICO'

export const MasterControlView: React.FC<MasterControlViewProps> = ({ onGoCoordinator }) => {
  const { activePeriod, refreshPeriod } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('DOCENTES')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  // Data states
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [grados, setGrados] = useState<Grado[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [periodos, setPeriodos] = useState<Periodo[]>([])

  // Search & filter states
  const [studentSearch, setStudentSearch] = useState('')
  const [studentGradoFilter, setStudentGradoFilter] = useState('TODOS')
  const [teacherSearch, setTeacherSearch] = useState('')

  // Modal / Form states
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Docente | null>(null)
  const [teacherForm, setTeacherForm] = useState({ nombre: '', usuario: '', password: '', rol: 'DOCENTE' as 'DOCENTE' | 'ADMIN' | 'SUPER_ADMIN' })

  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Estudiante | null>(null)
  const [studentForm, setStudentForm] = useState({ codigo: '', nombre: '', grado_id: '' })

  const [showAsigModal, setShowAsigModal] = useState(false)
  const [asigForm, setAsigForm] = useState({ docente_id: '', materia_id: '', grado_id: '' })

  const [showMateriaModal, setShowMateriaModal] = useState(false)
  const [materiaForm, setMateriaForm] = useState({ nombre: '', area: '' })

  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [periodForm, setPeriodForm] = useState({ id: '', nombre: '', ano: 2026, activo: true })

  useEffect(() => {
    loadAllMasterData()
  }, [])

  const notify = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const loadAllMasterData = async () => {
    setLoading(true)
    try {
      const [dRes, eRes, gRes, mRes, aRes, pRes] = await Promise.all([
        supabase.from('docentes').select('*').order('nombre', { ascending: true }),
        supabase.from('estudiantes').select('*, grado:grados(nombre)').order('nombre', { ascending: true }),
        supabase.from('grados').select('*').order('nombre', { ascending: true }),
        supabase.from('materias').select('*').order('nombre', { ascending: true }),
        supabase.from('asignaciones').select('*, docente:docentes(nombre), materia:materias(nombre), grado:grados(nombre)').order('id', { ascending: true }),
        supabase.from('periodos').select('*').order('created_at', { ascending: false })
      ])

      if (dRes.data) setDocentes(dRes.data)
      if (eRes.data) setEstudiantes(eRes.data)
      if (gRes.data) {
        setGrados(gRes.data)
        if (gRes.data.length > 0 && !studentForm.grado_id) {
          setStudentForm(prev => ({ ...prev, grado_id: gRes.data[0].id }))
          setAsigForm(prev => ({ ...prev, grado_id: gRes.data[0].id }))
        }
      }
      if (mRes.data) {
        setMaterias(mRes.data)
        if (mRes.data.length > 0 && !asigForm.materia_id) {
          setAsigForm(prev => ({ ...prev, materia_id: mRes.data[0].id }))
        }
      }
      if (dRes.data && dRes.data.length > 0 && !asigForm.docente_id) {
        setAsigForm(prev => ({ ...prev, docente_id: dRes.data[0].id }))
      }
      if (aRes.data) setAsignaciones(aRes.data)
      if (pRes.data) setPeriodos(pRes.data)
    } catch (e) {
      console.error('Error cargando datos maestros:', e)
    } finally {
      setLoading(false)
    }
  }

  // --- DOCENTES CRUD ---
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherForm.nombre || !teacherForm.usuario || !teacherForm.password) {
      alert('Por favor completa todos los campos del docente.')
      return
    }

    try {
      if (editingTeacher) {
        const { error } = await supabase
          .from('docentes')
          .update({
            nombre: teacherForm.nombre,
            usuario: teacherForm.usuario,
            password: teacherForm.password,
            rol: teacherForm.rol
          })
          .eq('id', editingTeacher.id)

        if (error) throw error
        notify(`Docente "${teacherForm.nombre}" actualizado con éxito.`)
      } else {
        const newId = `doc_${Date.now()}`
        const { error } = await supabase
          .from('docentes')
          .insert({
            id: newId,
            nombre: teacherForm.nombre,
            usuario: teacherForm.usuario,
            password: teacherForm.password,
            rol: teacherForm.rol
          })

        if (error) throw error
        notify(`Docente "${teacherForm.nombre}" creado con éxito.`)
      }

      setShowTeacherModal(false)
      setEditingTeacher(null)
      setTeacherForm({ nombre: '', usuario: '', password: '', rol: 'DOCENTE' })
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error al guardar docente: ${e.message}`)
    }
  }

  const handleDeleteTeacher = async (doc: Docente) => {
    if (!confirm(`¿Estás seguro de eliminar al docente "${doc.nombre}"? Esto también eliminará sus asignaciones.`)) return
    try {
      const { error } = await supabase.from('docentes').delete().eq('id', doc.id)
      if (error) throw error
      notify(`Docente "${doc.nombre}" eliminado.`)
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error al eliminar docente: ${e.message}`)
    }
  }

  // --- ESTUDIANTES CRUD ---
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentForm.codigo || !studentForm.nombre || !studentForm.grado_id) {
      alert('Por favor completa todos los campos del estudiante.')
      return
    }

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('estudiantes')
          .update({
            nombre: studentForm.nombre,
            grado_id: studentForm.grado_id
          })
          .eq('codigo', editingStudent.codigo)

        if (error) throw error
        notify(`Estudiante "${studentForm.nombre}" actualizado.`)
      } else {
        const { error } = await supabase
          .from('estudiantes')
          .insert({
            codigo: studentForm.codigo.trim().toUpperCase(),
            nombre: studentForm.nombre.trim(),
            grado_id: studentForm.grado_id
          })

        if (error) throw error
        notify(`Estudiante "${studentForm.nombre}" registrado con éxito.`)
      }

      setShowStudentModal(false)
      setEditingStudent(null)
      setStudentForm({ codigo: '', nombre: '', grado_id: grados[0]?.id || '' })
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error al guardar estudiante: ${e.message}`)
    }
  }

  const handleDeleteStudent = async (est: Estudiante) => {
    if (!confirm(`¿Estás seguro de eliminar al estudiante "${est.nombre}" (${est.codigo})?`)) return
    try {
      const { error } = await supabase.from('estudiantes').delete().eq('codigo', est.codigo)
      if (error) throw error
      notify(`Estudiante "${est.nombre}" eliminado.`)
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error al eliminar estudiante: ${e.message}`)
    }
  }

  // --- ASIGNACIONES CRUD ---
  const handleSaveAsignacion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!asigForm.docente_id || !asigForm.materia_id || !asigForm.grado_id) {
      alert('Selecciona docente, materia y grado.')
      return
    }

    try {
      const { error } = await supabase.from('asignaciones').insert({
        docente_id: asigForm.docente_id,
        materia_id: asigForm.materia_id,
        grado_id: asigForm.grado_id
      })

      if (error) throw error
      notify('Carga académica asignada con éxito.')
      setShowAsigModal(false)
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error al guardar asignación: ${e.message}`)
    }
  }

  const handleDeleteAsignacion = async (id: number) => {
    if (!confirm('¿Eliminar esta asignación académica?')) return
    try {
      const { error } = await supabase.from('asignaciones').delete().eq('id', id)
      if (error) throw error
      notify('Asignación eliminada.')
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error al eliminar asignación: ${e.message}`)
    }
  }

  // --- PERIODOS CRUD ---
  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!periodForm.id || !periodForm.nombre) {
      alert('Completa ID y nombre del periodo.')
      return
    }

    try {
      const { error } = await supabase.from('periodos').insert({
        id: periodForm.id.trim(),
        nombre: periodForm.nombre.trim(),
        ano: Number(periodForm.ano),
        activo: periodForm.activo
      })

      if (error) throw error
      notify(`Periodo "${periodForm.nombre}" creado con éxito.`)
      setShowPeriodModal(false)
      setPeriodForm({ id: '', nombre: '', ano: 2026, activo: true })
      loadAllMasterData()
      refreshPeriod()
    } catch (e: any) {
      alert(`Error al crear periodo: ${e.message}`)
    }
  }

  const handleSetActivePeriod = async (p: Periodo) => {
    try {
      await supabase.from('periodos').update({ activo: false }).neq('id', p.id)
      await supabase.from('periodos').update({ activo: true }).eq('id', p.id)
      notify(`Periodo "${p.nombre}" establecido como ACTIVO.`)
      loadAllMasterData()
      refreshPeriod()
    } catch (e: any) {
      alert(`Error al activar periodo: ${e.message}`)
    }
  }

  // Backup Export
  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      institution: 'I.E. General Santander',
      docentes,
      estudiantes,
      grados,
      materias,
      asignaciones,
      periodos
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_instegesan_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    notify('Copia de seguridad descargada en archivo JSON.')
  }

  // Filtrado de estudiantes
  const filteredStudents = estudiantes.filter((st) => {
    const matchesSearch =
      st.nombre.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.codigo.toLowerCase().includes(studentSearch.toLowerCase())
    const matchesGrado =
      studentGradoFilter === 'TODOS' || (st as any).grado?.nombre === studentGradoFilter
    return matchesSearch && matchesGrado
  })

  // Filtrado de docentes
  const filteredDocentes = docentes.filter((d) =>
    d.nombre.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    d.usuario.toLowerCase().includes(teacherSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Barra Superior Master */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-300">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-wide">
                  Panel Maestro de Control y Mantenimiento
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-black uppercase">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestión total de Base de Datos, Docentes, Salones y Cargas Académicas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
              title="Descargar respaldo completo de la base de datos"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Copia JSON</span>
            </button>

            <button
              onClick={onGoCoordinator}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Vista Coordinación</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notificación Flotante */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Navegación por Pestañas */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
          <button
            onClick={() => setActiveTab('DOCENTES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
              activeTab === 'DOCENTES'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Docentes ({docentes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ESTUDIANTES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
              activeTab === 'ESTUDIANTES'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Estudiantes ({estudiantes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ASIGNACIONES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
              activeTab === 'ASIGNACIONES'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cargas Académicas ({asignaciones.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MATERIAS_GRADOS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
              activeTab === 'MATERIAS_GRADOS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Materias ({materias.length}) y Grados ({grados.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PERIODOS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
              activeTab === 'PERIODOS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Periodos Académicos ({periodos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DIAGNOSTICO')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
              activeTab === 'DIAGNOSTICO'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Diagnóstico y Tablas</span>
          </button>
        </div>

        {/* 1. SECCIÓN: DOCENTES */}
        {activeTab === 'DOCENTES' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="Buscar docente por nombre o usuario..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={() => {
                  setEditingTeacher(null)
                  setTeacherForm({ nombre: '', usuario: '', password: '', rol: 'DOCENTE' })
                  setShowTeacherModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nuevo Docente</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">Docente</th>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Contraseña</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Cargas Asignadas</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDocentes.map((d) => {
                    const totalAsig = asignaciones.filter((a) => a.docente_id === d.id).length
                    return (
                      <tr key={d.id} className="hover:bg-slate-850/50 transition">
                        <td className="p-3 font-bold text-slate-100">{d.nombre}</td>
                        <td className="p-3 font-mono text-slate-300">{d.usuario}</td>
                        <td className="p-3 font-mono text-slate-400">{d.password || '******'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              d.rol === 'SUPER_ADMIN'
                                ? 'bg-purple-950 text-purple-300 border-purple-800'
                                : d.rol === 'ADMIN'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-blue-950 text-blue-300 border-blue-800'
                            }`}
                          >
                            {d.rol}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{totalAsig} clases</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingTeacher(d)
                                setTeacherForm({
                                  nombre: d.nombre,
                                  usuario: d.usuario,
                                  password: d.password || '',
                                  rol: d.rol
                                })
                                setShowTeacherModal(true)
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(d)}
                              className="p-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg transition"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. SECCIÓN: ESTUDIANTES */}
        {activeTab === 'ESTUDIANTES' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Buscar estudiante por nombre o código..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <select
                  value={studentGradoFilter}
                  onChange={(e) => setStudentGradoFilter(e.target.value)}
                  className="py-2 px-3 text-xs bg-slate-900 border border-slate-700 text-slate-100 rounded-xl"
                >
                  <option value="TODOS">Todos los salones</option>
                  {grados.map((g) => (
                    <option key={g.id} value={g.nombre}>
                      Grado {g.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingStudent(null)
                  setStudentForm({ codigo: '', nombre: '', grado_id: grados[0]?.id || '' })
                  setShowStudentModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Matricular Nuevo Estudiante</span>
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Mostrando {filteredStudents.length} de {estudiantes.length} estudiantes
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950/95 z-10">
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">Código</th>
                    <th className="p-3">Nombre del Estudiante</th>
                    <th className="p-3">Salón / Grado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((st) => (
                    <tr key={st.codigo} className="hover:bg-slate-850/50 transition">
                      <td className="p-3 font-mono font-bold text-slate-300">{st.codigo}</td>
                      <td className="p-3 font-bold text-slate-100">{st.nombre}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 text-[10.5px] font-bold">
                          Grado {(st as any).grado?.nombre || 'S/A'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingStudent(st)
                              setStudentForm({
                                codigo: st.codigo,
                                nombre: st.nombre,
                                grado_id: st.grado_id
                              })
                              setShowStudentModal(true)
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            title="Editar / Trasladar salón"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(st)}
                            className="p-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. SECCIÓN: CARGAS ACADÉMICAS */}
        {activeTab === 'ASIGNACIONES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Asignaciones Académicas (Docente + Materia + Salón)
                </h3>
                <p className="text-xs text-slate-400">
                  Define qué docente dicta qué asignatura en cada uno de los 22 salones
                </p>
              </div>

              <button
                onClick={() => setShowAsigModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Asignar Nueva Carga</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950/95 z-10">
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">ID</th>
                    <th className="p-3">Docente</th>
                    <th className="p-3">Materia</th>
                    <th className="p-3">Salón</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {asignaciones.map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-3 font-mono text-slate-500">#{a.id}</td>
                      <td className="p-3 font-bold text-slate-100">{a.docente?.nombre || 'Docente'}</td>
                      <td className="p-3 text-slate-300 font-semibold">{a.materia?.nombre || 'Materia'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 text-[11px] font-bold">
                          Grado {a.grado?.nombre || 'Grado'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteAsignacion(a.id)}
                          className="p-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg transition"
                          title="Eliminar asignación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. SECCIÓN: MATERIAS Y GRADOS */}
        {activeTab === 'MATERIAS_GRADOS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Materias */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100">
                  Catálogo de Asignaturas ({materias.length})
                </h3>
                <button
                  onClick={() => setShowMateriaModal(true)}
                  className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Materia</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-[450px] overflow-y-auto">
                {materias.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-100">{m.nombre}</h4>
                      <span className="text-[10px] text-slate-400">Área: {m.area}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{m.id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grados */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100">
                  Salones de Clase Institucionales ({grados.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Distribución de los 22 salones de la I.E. General Santander
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[450px] overflow-y-auto">
                {grados.map((g) => {
                  const estCount = estudiantes.filter((st) => st.grado_id === g.id).length
                  return (
                    <div
                      key={g.id}
                      className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center"
                    >
                      <span className="text-base font-black text-slate-100 block">{g.nombre}</span>
                      <span className="text-[10.5px] text-blue-400 font-semibold">{estCount} alumnos</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 5. SECCIÓN: PERIODOS ACADÉMICOS */}
        {activeTab === 'PERIODOS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Gestión de Periodos Académicos
                </h3>
                <p className="text-xs text-slate-400">
                  Abre nuevos periodos lectivos (1°, 2°, 3°, 4° Periodo o Año 2027)
                </p>
              </div>

              <button
                onClick={() => setShowPeriodModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nuevo Periodo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {periodos.map((p) => {
                const isCurrentActive = activePeriod?.id === p.id
                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border transition ${
                      isCurrentActive
                        ? 'bg-purple-950/40 border-purple-600/80 shadow-lg'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-mono text-slate-400 block">{p.id}</span>
                        <h4 className="text-base font-bold text-slate-100">{p.nombre}</h4>
                        <span className="text-xs text-slate-400">Año Lectivo {p.ano}</span>
                      </div>

                      {isCurrentActive ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10.5px] font-black uppercase flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ACTIVO
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-bold">
                          Inactivo
                        </span>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Estado notas: {p.activo ? 'Abierto' : 'Bloqueado'}
                      </span>

                      {!isCurrentActive && (
                        <button
                          onClick={() => handleSetActivePeriod(p)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition active:scale-95"
                        >
                          Activar Periodo
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 6. SECCIÓN: DIAGNÓSTICO Y TABLAS */}
        {activeTab === 'DIAGNOSTICO' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block uppercase font-bold text-[10px]">Docentes</span>
                <span className="text-2xl font-black text-slate-100">{docentes.length}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block uppercase font-bold text-[10px]">Estudiantes</span>
                <span className="text-2xl font-black text-slate-100">{estudiantes.length}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block uppercase font-bold text-[10px]">Salones</span>
                <span className="text-2xl font-black text-slate-100">{grados.length}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block uppercase font-bold text-[10px]">Materias</span>
                <span className="text-2xl font-black text-slate-100">{materias.length}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block uppercase font-bold text-[10px]">Cargas</span>
                <span className="text-2xl font-black text-slate-100">{asignaciones.length}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block uppercase font-bold text-[10px]">Periodos</span>
                <span className="text-2xl font-black text-slate-100">{periodos.length}</span>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span>Estado de Conexión a Supabase</span>
              </h3>
              <p className="text-xs text-slate-400">
                La base de datos PostgreSQL en la nube está sincronizada en tiempo real. Todas las tablas cuentan con integridad referencial activa.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadAllMasterData}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Sincronizar y Recargar Tablas</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL CREAR/EDITAR DOCENTE */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">
                {editingTeacher ? 'Editar Docente' : 'Crear Nuevo Docente'}
              </h3>
              <button
                onClick={() => setShowTeacherModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  value={teacherForm.nombre}
                  onChange={(e) => setTeacherForm({ ...teacherForm, nombre: e.target.value })}
                  placeholder="Ej: Lic. Carlos Andrés Pérez"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Usuario de Acceso:</label>
                <input
                  type="text"
                  value={teacherForm.usuario}
                  onChange={(e) => setTeacherForm({ ...teacherForm, usuario: e.target.value })}
                  placeholder="Ej: cperez"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Contraseña:</label>
                <input
                  type="text"
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                  placeholder="Ej: GS-902"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Rol en el Sistema:</label>
                <select
                  value={teacherForm.rol}
                  onChange={(e) => setTeacherForm({ ...teacherForm, rol: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                >
                  <option value="DOCENTE">DOCENTE</option>
                  <option value="ADMIN">ADMIN (Coordinación)</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN (Desarrollador)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                >
                  Guardar Docente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR/EDITAR ESTUDIANTE */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">
                {editingStudent ? 'Editar / Trasladar Estudiante' : 'Matricular Nuevo Estudiante'}
              </h3>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Código de Matrícula:</label>
                <input
                  type="text"
                  value={studentForm.codigo}
                  disabled={!!editingStudent}
                  onChange={(e) => setStudentForm({ ...studentForm, codigo: e.target.value })}
                  placeholder="Ej: EST-999"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  value={studentForm.nombre}
                  onChange={(e) => setStudentForm({ ...studentForm, nombre: e.target.value })}
                  placeholder="Ej: Laura Sofía Gómez Martínez"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Salón / Grado Asignado:</label>
                <select
                  value={studentForm.grado_id}
                  onChange={(e) => setStudentForm({ ...studentForm, grado_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                  required
                >
                  {grados.map((g) => (
                    <option key={g.id} value={g.id}>
                      Grado {g.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                >
                  Guardar Estudiante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA ASIGNACIÓN ACADÉMICA */}
      {showAsigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Asignar Carga Académica</h3>
              <button
                onClick={() => setShowAsigModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsignacion} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Seleccionar Docente:</label>
                <select
                  value={asigForm.docente_id}
                  onChange={(e) => setAsigForm({ ...asigForm, docente_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                  required
                >
                  {docentes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre} ({d.usuario})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Seleccionar Asignatura:</label>
                <select
                  value={asigForm.materia_id}
                  onChange={(e) => setAsigForm({ ...asigForm, materia_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                  required
                >
                  {materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} ({m.area})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Seleccionar Grado / Salón:</label>
                <select
                  value={asigForm.grado_id}
                  onChange={(e) => setAsigForm({ ...asigForm, grado_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                  required
                >
                  {grados.map((g) => (
                    <option key={g.id} value={g.id}>
                      Grado {g.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAsigModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                >
                  Guardar Carga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA MATERIA */}
      {showMateriaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Crear Nueva Asignatura</h3>
              <button
                onClick={() => setShowMateriaModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const newId = `mat_${Date.now()}`
                const { error } = await supabase.from('materias').insert({
                  id: newId,
                  nombre: materiaForm.nombre.trim(),
                  area: materiaForm.area.trim() || 'General'
                })
                if (error) alert(error.message)
                else {
                  notify(`Materia "${materiaForm.nombre}" creada.`)
                  setShowMateriaModal(false)
                  setMateriaForm({ nombre: '', area: '' })
                  loadAllMasterData()
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-400 mb-1">Nombre de la Asignatura:</label>
                <input
                  type="text"
                  value={materiaForm.nombre}
                  onChange={(e) => setMateriaForm({ ...materiaForm, nombre: e.target.value })}
                  placeholder="Ej: Emprendimiento y Finanzas"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Área de Conocimiento:</label>
                <input
                  type="text"
                  value={materiaForm.area}
                  onChange={(e) => setMateriaForm({ ...materiaForm, area: e.target.value })}
                  placeholder="Ej: Ciencias Económicas y Administrativas"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMateriaModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                >
                  Guardar Materia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PERIODO */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Crear Nuevo Periodo Académico</h3>
              <button
                onClick={() => setShowPeriodModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">ID Único del Periodo:</label>
                <input
                  type="text"
                  value={periodForm.id}
                  onChange={(e) => setPeriodForm({ ...periodForm, id: e.target.value })}
                  placeholder="Ej: P-2026-4 o P-2027-1"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nombre Descriptivo:</label>
                <input
                  type="text"
                  value={periodForm.nombre}
                  onChange={(e) => setPeriodForm({ ...periodForm, nombre: e.target.value })}
                  placeholder="Ej: 4to Periodo - 2026"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Año Lectivo:</label>
                <input
                  type="number"
                  value={periodForm.ano}
                  onChange={(e) => setPeriodForm({ ...periodForm, ano: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                >
                  Guardar Periodo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
