import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Docente, Estudiante, Grado, Materia, Asignacion, Periodo } from '../../types/database'
import { generateAndDownloadTirillasPDF } from '../../utils/generateTirillasPdf'
import {
  ShieldAlert,
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
  Upload,
  CheckCircle,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Activity,
  FileSpreadsheet,
  ArrowRightLeft,
  Clock,
  Sparkles,
  HelpCircle,
  Sliders,
  CheckCheck,
  AlertOctagon
} from 'lucide-react'

interface MasterControlViewProps {
  onGoCoordinator: () => void
}

type TabType =
  | 'DOCENTES'
  | 'ESTUDIANTES'
  | 'AUDITORIA'
  | 'NOTAS_OVERRIDE'
  | 'ASIGNACIONES'
  | 'MATERIAS_GRADOS'
  | 'PERIODOS'
  | 'CONFIG_INSTITUCIONAL'
  | 'BASE_DATOS'
  | 'MANUAL'

export const MasterControlView: React.FC<MasterControlViewProps> = ({ onGoCoordinator }) => {
  const { activePeriod, refreshPeriod, startImpersonation } = useAuth()
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
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  // Search & Filter states
  const [teacherSearch, setTeacherSearch] = useState('')
  const [showPasswords, setShowPasswords] = useState(true)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentGradoFilter, setStudentGradoFilter] = useState('TODOS')
  const [auditSearch, setAuditSearch] = useState('')

  // Modals & Forms
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Docente | null>(null)
  const [teacherForm, setTeacherForm] = useState({ nombre: '', usuario: '', password: '', rol: 'DOCENTE' as 'DOCENTE' | 'ADMIN' | 'SUPER_ADMIN' })

  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Estudiante | null>(null)
  const [studentForm, setStudentForm] = useState({ codigo: '', nombre: '', grado_id: '' })

  const [showBulkStudentModal, setShowBulkStudentModal] = useState(false)
  const [bulkStudentText, setBulkStudentText] = useState('')
  const [bulkTargetGradoId, setBulkTargetGradoId] = useState('')

  const [showAsigModal, setShowAsigModal] = useState(false)
  const [asigForm, setAsigForm] = useState({ docente_id: '', materia_id: '', grado_id: '' })

  const [showCloneAsigModal, setShowCloneAsigModal] = useState(false)
  const [cloneSourceGradoId, setCloneSourceGradoId] = useState('')
  const [cloneTargetGradoId, setCloneTargetGradoId] = useState('')

  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [periodForm, setPeriodForm] = useState({ id: '', nombre: '', ano: 2026, activo: true })

  const [showEditReportModal, setShowEditReportModal] = useState(false)
  const [editingReport, setEditingReport] = useState<any | null>(null)
  const [reportForm, setReportForm] = useState({ en_riesgo: true, dificultad_temas: '', observacion: '' })

  // Institutional Config Form
  const [institucionConfig, setInstitucionConfig] = useState({
    nombre: 'INSTITUCIÓN EDUCATIVA GENERAL SANTANDER',
    resolucion1: 'Ratificado mediante Resolución 0776 de 16 de Julio de 2009',
    resolucion2: 'Aprobado Mediante Resolución No. 001111 de Sep.20 de 2000',
    nit: '800170307',
    dane: '123001002125',
    lema: 'LIDERAZGO - CIENCIA - DIVERSIDAD'
  })

  // Safety Wipe input
  const [safetyWipeInput, setSafetyWipeInput] = useState('')

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
      const [dRes, eRes, gRes, mRes, aRes, pRes, repRes] = await Promise.all([
        supabase.from('docentes').select('*').order('nombre', { ascending: true }),
        supabase.from('estudiantes').select('*, grado:grados(nombre)').order('nombre', { ascending: true }),
        supabase.from('grados').select('*').order('nombre', { ascending: true }),
        supabase.from('materias').select('*').order('nombre', { ascending: true }),
        supabase.from('asignaciones').select('*, docente:docentes(nombre), materia:materias(nombre), grado:grados(nombre)').order('id', { ascending: true }),
        supabase.from('periodos').select('*').order('created_at', { ascending: false }),
        supabase
          .from('preinformes')
          .select(`
            id,
            periodo_id,
            en_riesgo,
            dificultad_temas,
            observacion,
            updated_at,
            created_at,
            estudiante:estudiantes(codigo, nombre),
            asignacion:asignaciones(
              id,
              materia:materias(nombre),
              docente:docentes(nombre),
              grado:grados(nombre)
            )
          `)
          .order('updated_at', { ascending: false })
          .limit(100)
      ])

      if (dRes.data) setDocentes(dRes.data)
      if (eRes.data) setEstudiantes(eRes.data)
      if (gRes.data) {
        setGrados(gRes.data)
        if (gRes.data.length > 0) {
          if (!studentForm.grado_id) setStudentForm(prev => ({ ...prev, grado_id: gRes.data[0].id }))
          if (!asigForm.grado_id) setAsigForm(prev => ({ ...prev, grado_id: gRes.data[0].id }))
          if (!bulkTargetGradoId) setBulkTargetGradoId(gRes.data[0].id)
          if (!cloneSourceGradoId) setCloneSourceGradoId(gRes.data[0].id)
          if (!cloneTargetGradoId && gRes.data.length > 1) setCloneTargetGradoId(gRes.data[1].id)
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
      if (repRes.data) setAuditLogs(repRes.data)
    } catch (e) {
      console.error('Error cargando datos maestros:', e)
    } finally {
      setLoading(false)
    }
  }

  // --- PASSWORD & DOCENTES ACTIONS ---
  const generateRandomPassword = () => {
    const num = Math.floor(100 + Math.random() * 900)
    return `GS-${num}`
  }

  const handleInlinePasswordUpdate = async (docId: string, newPass: string) => {
    if (!newPass.trim()) return
    try {
      const { error } = await supabase
        .from('docentes')
        .update({ password: newPass.trim() })
        .eq('id', docId)
      if (error) throw error
      notify('Contraseña actualizada al instante.')
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error actualizando contraseña: ${e.message}`)
    }
  }

  const handleBulkResetPasswords = async () => {
    if (!confirm('¿Deseas regenerar nuevas contraseñas automáticas para TODOS los docentes? Esto creará claves del tipo GS-XXX para cada uno.')) return
    try {
      setLoading(true)
      for (const d of docentes) {
        const newPass = generateRandomPassword()
        await supabase.from('docentes').update({ password: newPass }).eq('id', d.id)
      }
      notify(`Se regeneraron las contraseñas de ${docentes.length} docentes.`)
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherForm.nombre || !teacherForm.usuario || !teacherForm.password) {
      alert('Completa todos los campos.')
      return
    }

    try {
      if (editingTeacher) {
        const { error } = await supabase
          .from('docentes')
          .update({
            nombre: teacherForm.nombre.trim(),
            usuario: teacherForm.usuario.trim().toLowerCase(),
            password: teacherForm.password.trim(),
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
            nombre: teacherForm.nombre.trim(),
            usuario: teacherForm.usuario.trim().toLowerCase(),
            password: teacherForm.password.trim(),
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
      alert(`Error: ${e.message}`)
    }
  }

  const handleDeleteTeacher = async (doc: Docente) => {
    if (!confirm(`¿Estás seguro de eliminar a "${doc.nombre}"? Se borrarán sus asignaciones.`)) return
    try {
      const { error } = await supabase.from('docentes').delete().eq('id', doc.id)
      if (error) throw error
      notify(`Docente "${doc.nombre}" eliminado.`)
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    }
  }

  // --- ESTUDIANTES & MATRÍCULA MASIVA ---
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentForm.codigo || !studentForm.nombre || !studentForm.grado_id) {
      alert('Completa todos los datos.')
      return
    }

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('estudiantes')
          .update({
            nombre: studentForm.nombre.trim(),
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
        notify(`Estudiante "${studentForm.nombre}" matriculado.`)
      }

      setShowStudentModal(false)
      setEditingStudent(null)
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    }
  }

  const handleBulkStudentImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkStudentText.trim() || !bulkTargetGradoId) {
      alert('Ingresa el texto con los estudiantes y selecciona el salón destino.')
      return
    }

    const lines = bulkStudentText.split('\n').map(l => l.trim()).filter(Boolean)
    const recordsToInsert: { codigo: string; nombre: string; grado_id: string }[] = []

    lines.forEach((line, idx) => {
      if (line.includes(',') || line.includes(';')) {
        const parts = line.split(/[,;]/).map(p => p.trim())
        if (parts.length >= 2) {
          recordsToInsert.push({
            codigo: parts[0].toUpperCase(),
            nombre: parts[1],
            grado_id: bulkTargetGradoId
          })
        }
      } else {
        const genCode = `EST-${Date.now().toString().slice(-4)}${idx + 1}`
        recordsToInsert.push({
          codigo: genCode,
          nombre: line,
          grado_id: bulkTargetGradoId
        })
      }
    })

    if (recordsToInsert.length === 0) {
      alert('No se detectaron líneas válidas. Formato recomendado: CODIGO, NOMBRE')
      return
    }

    try {
      const { error } = await supabase.from('estudiantes').upsert(recordsToInsert, { onConflict: 'codigo' })
      if (error) throw error
      notify(`Se matricularon ${recordsToInsert.length} estudiantes en lote con éxito.`)
      setShowBulkStudentModal(false)
      setBulkStudentText('')
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error en carga masiva: ${e.message}`)
    }
  }

  const handleDeleteStudent = async (est: Estudiante) => {
    if (!confirm(`¿Eliminar al estudiante "${est.nombre}" (${est.codigo})?`)) return
    try {
      const { error } = await supabase.from('estudiantes').delete().eq('codigo', est.codigo)
      if (error) throw error
      notify(`Estudiante "${est.nombre}" eliminado.`)
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    }
  }

  // --- CARGAS ACADÉMICAS & CLONACIÓN ---
  const handleSaveAsignacion = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('asignaciones').insert({
        docente_id: asigForm.docente_id,
        materia_id: asigForm.materia_id,
        grado_id: asigForm.grado_id
      })
      if (error) throw error
      notify('Carga académica asignada.')
      setShowAsigModal(false)
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    }
  }

  const handleCloneAsignaciones = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cloneSourceGradoId === cloneTargetGradoId) {
      alert('El salón origen y destino deben ser diferentes.')
      return
    }

    const sourceAsigs = asignaciones.filter(a => a.grado_id === cloneSourceGradoId)
    if (sourceAsigs.length === 0) {
      alert('El salón origen no tiene cargas académicas para clonar.')
      return
    }

    try {
      const newRecords = sourceAsigs.map(a => ({
        docente_id: a.docente_id,
        materia_id: a.materia_id,
        grado_id: cloneTargetGradoId
      }))

      const { error } = await supabase.from('asignaciones').insert(newRecords)
      if (error) throw error
      notify(`Se clonaron ${newRecords.length} asignaciones académicas al salón destino.`)
      setShowCloneAsigModal(false)
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error al clonar asignaciones: ${e.message}`)
    }
  }

  // --- OVERRIDE / EDICIÓN DIRECTA DE NOTAS Y PREINFORMES ---
  const handleSaveReportOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReport) return
    try {
      const { error } = await supabase
        .from('preinformes')
        .update({
          en_riesgo: reportForm.en_riesgo,
          dificultad_temas: reportForm.dificultad_temas.trim(),
          observacion: reportForm.observacion.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingReport.id)

      if (error) throw error
      notify('Registro de preinforme modificado directamente.')
      setShowEditReportModal(false)
      setEditingReport(null)
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error al modificar preinforme: ${e.message}`)
    }
  }

  // --- PERIODOS ---
  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('periodos').insert({
        id: periodForm.id.trim(),
        nombre: periodForm.nombre.trim(),
        ano: Number(periodForm.ano),
        activo: periodForm.activo
      })
      if (error) throw error
      notify(`Periodo "${periodForm.nombre}" creado.`)
      setShowPeriodModal(false)
      loadAllMasterData()
      refreshPeriod()
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    }
  }

  const handleTogglePeriodActive = async (p: Periodo) => {
    try {
      await supabase.from('periodos').update({ activo: false }).neq('id', p.id)
      await supabase.from('periodos').update({ activo: true }).eq('id', p.id)
      notify(`Periodo "${p.nombre}" activo.`)
      loadAllMasterData()
      refreshPeriod()
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    }
  }

  // --- BACKUP & RESTAURACIÓN ---
  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
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
    a.download = `backup_instegesan_full_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    notify('Copia de seguridad descargada en archivo JSON.')
  }

  const handleImportRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string)
        if (confirm('ADVERTENCIA: ¿Restaurar la base de datos con este archivo de respaldo? Esto actualizará docentes, salones y estudiantes.')) {
          setLoading(true)
          if (json.grados) await supabase.from('grados').upsert(json.grados)
          if (json.materias) await supabase.from('materias').upsert(json.materias)
          if (json.docentes) await supabase.from('docentes').upsert(json.docentes)
          if (json.estudiantes) await supabase.from('estudiantes').upsert(json.estudiantes)
          if (json.periodos) await supabase.from('periodos').upsert(json.periodos)
          if (json.asignaciones) await supabase.from('asignaciones').upsert(json.asignaciones)
          notify('Restauración completada con éxito.')
          loadAllMasterData()
        }
      } catch (err: any) {
        alert(`Error al leer archivo de respaldo: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }

  const handleWipePreinformesOnly = async () => {
    if (!confirm('¿Limpiar ÚNICAMENTE los preinformes y notas de este periodo? (Conserva docentes, estudiantes y salones intactos)')) return
    try {
      await supabase.from('preinformes').delete().neq('id', 0)
      notify('Preinformes y notas del periodo eliminados a cero.')
      loadAllMasterData()
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    }
  }

  // --- HEALTH CHECK & AUDITORÍA DE INTEGRIDAD ---
  const orphanStudents = estudiantes.filter(st => !grados.some(g => g.id === st.grado_id))
  const teachersWithoutAssignments = docentes.filter(d => d.rol === 'DOCENTE' && !asignaciones.some(a => a.docente_id === d.id))
  const gradesWithoutAssignments = grados.filter(g => !asignaciones.some(a => a.grado_id === g.id))

  // Filtered views
  const filteredDocentes = docentes.filter(d =>
    d.nombre.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    d.usuario.toLowerCase().includes(teacherSearch.toLowerCase())
  )

  const filteredStudents = estudiantes.filter(st => {
    const matchesSearch =
      st.nombre.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.codigo.toLowerCase().includes(studentSearch.toLowerCase())
    const matchesGrado =
      studentGradoFilter === 'TODOS' || (st as any).grado?.nombre === studentGradoFilter
    return matchesSearch && matchesGrado
  })

  const filteredAudit = auditLogs.filter(log => {
    const q = auditSearch.toLowerCase()
    return (
      (log.estudiante?.nombre || '').toLowerCase().includes(q) ||
      (log.asignacion?.docente?.nombre || '').toLowerCase().includes(q) ||
      (log.asignacion?.materia?.nombre || '').toLowerCase().includes(q) ||
      (log.dificultad_temas || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* HEADER MASTER HUB */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/90 border border-purple-700 text-purple-300">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-wide">
                  Centro Maestro de Mando y Mantenimiento
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-700 text-[10px] font-black uppercase">
                  GOD MODE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Control absoluto de contraseñas, auditoría, calificaciones, matrícula masiva y base de datos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateAndDownloadTirillasPDF()}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
              title="Descargar tirillas PDF con QR"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Tirillas QR</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
              title="Descargar copia de seguridad en JSON"
            >
              <Database className="w-4 h-4 text-purple-400" />
              <span>Copia JSON</span>
            </button>

            <button
              onClick={onGoCoordinator}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md"
            >
              <Eye className="w-4 h-4" />
              <span>Vista Coordinación</span>
            </button>
          </div>
        </div>
      </header>

      {/* NOTIFICACIÓN FLOTANTE */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
          <button
            onClick={() => setActiveTab('DOCENTES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
              activeTab === 'DOCENTES'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Docentes y Claves ({docentes.length})</span>
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
            onClick={() => setActiveTab('AUDITORIA')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
              activeTab === 'AUDITORIA'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Auditoría en Tiempo Real</span>
          </button>

          <button
            onClick={() => setActiveTab('NOTAS_OVERRIDE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
              activeTab === 'NOTAS_OVERRIDE'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            <span>Editor de Calificaciones</span>
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
            <span>Materias y Salones</span>
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
            <span>Periodos ({periodos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CONFIG_INSTITUCIONAL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
              activeTab === 'CONFIG_INSTITUCIONAL'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Membrete y Configuración</span>
          </button>

          <button
            onClick={() => setActiveTab('BASE_DATOS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
              activeTab === 'BASE_DATOS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Base de Datos</span>
          </button>

          <button
            onClick={() => setActiveTab('MANUAL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
              activeTab === 'MANUAL'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Manual Super Admin</span>
          </button>
        </div>

        {/* 1. DOCENTES Y GESTIÓN DE CONTRASEÑAS */}
        {activeTab === 'DOCENTES' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
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
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700 rounded-xl text-xs flex items-center gap-1.5 transition"
                  title="Mostrar/Ocultar contraseñas"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="hidden sm:inline">{showPasswords ? 'Ocultar' : 'Ver'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkResetPasswords}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition active:scale-95"
                  title="Regenerar contraseñas a todos los docentes"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Regenerar Todas las Claves</span>
                </button>

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
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950/95 z-10">
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">Docente</th>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Contraseña (Editable en línea)</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Salones</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDocentes.map((d) => {
                    const totalAsig = asignaciones.filter((a) => a.docente_id === d.id).length
                    return (
                      <tr key={d.id} className="hover:bg-slate-850/50 transition">
                        <td className="p-3 font-bold text-slate-100">{d.nombre}</td>
                        <td className="p-3 font-mono text-slate-300 font-semibold">{d.usuario}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 max-w-[200px]">
                            <input
                              type={showPasswords ? 'text' : 'password'}
                              defaultValue={d.password || ''}
                              onBlur={(e) => handleInlinePasswordUpdate(d.id, e.target.value)}
                              className="px-2 py-1 text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-lg font-mono w-full focus:ring-1 focus:ring-purple-500"
                              title="Haz clic para modificar la clave y sal del campo para guardar"
                            />
                            <button
                              onClick={() => {
                                const newP = generateRandomPassword()
                                handleInlinePasswordUpdate(d.id, newP)
                              }}
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex-shrink-0"
                              title="Generar nueva clave aleatoria"
                            >
                              <Sparkles className="w-3 h-3 text-amber-400" />
                            </button>
                          </div>
                        </td>
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
                              onClick={() => startImpersonation(d)}
                              className="p-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 rounded-lg transition"
                              title="Entrar como este docente (Impersonar)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
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

        {/* 2. ESTUDIANTES Y MATRÍCULA MASIVA */}
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkStudentModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Matrícula en Lote</span>
                </button>

                <button
                  onClick={() => {
                    setEditingStudent(null)
                    setStudentForm({ codigo: '', nombre: '', grado_id: grados[0]?.id || '' })
                    setShowStudentModal(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Estudiante</span>
                </button>
              </div>
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
                            title="Editar / Trasladar de salón"
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

        {/* 3. AUDITORÍA EN TIEMPO REAL */}
        {activeTab === 'AUDITORIA' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Buscar por estudiante, docente o tema de dificultad..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={loadAllMasterData}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar Registro en Vivo</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950/95 z-10">
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Docente Evaluador</th>
                    <th className="p-3">Estudiante</th>
                    <th className="p-3">Materia y Salón</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Dificultad Registrada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAudit.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{log.updated_at ? new Date(log.updated_at).toLocaleString('es-CO') : 'Reciente'}</span>
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-200">
                        {log.asignacion?.docente?.nombre || 'Docente'}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-100 block">{log.estudiante?.nombre || 'Estudiante'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{log.estudiante?.codigo}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-200 block">{log.asignacion?.materia?.nombre}</span>
                        <span className="text-[10px] text-slate-500">Grado {log.asignacion?.grado?.nombre}</span>
                      </td>
                      <td className="p-3">
                        {log.en_riesgo ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                            En Riesgo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300 italic text-[11px] max-w-xs truncate">
                        {log.dificultad_temas || log.observacion || 'Sin observaciones'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. EDITOR DE CALIFICACIONES (GOD OVERRIDE) */}
        {activeTab === 'NOTAS_OVERRIDE' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-400" />
                <span>Anulación y Modificación Directa de Preinformes</span>
              </h3>
              <p className="text-xs text-slate-400">
                Permite cambiar calificaciones, alterar dificultades o desmarcar el riesgo de cualquier alumno directamente sin depender del docente.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950/95 z-10">
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">Estudiante</th>
                    <th className="p-3">Asignatura</th>
                    <th className="p-3">Docente Titular</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Dificultad / Observación</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-3 font-bold text-slate-100">
                        {log.estudiante?.nombre}
                        <span className="text-[10px] text-slate-500 font-mono block">{log.estudiante?.codigo}</span>
                      </td>
                      <td className="p-3 text-slate-200">
                        {log.asignacion?.materia?.nombre} (Grado {log.asignacion?.grado?.nombre})
                      </td>
                      <td className="p-3 text-slate-400">{log.asignacion?.docente?.nombre}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            log.en_riesgo
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {log.en_riesgo ? 'En Riesgo' : 'Al Día'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 text-[11px] max-w-xs truncate">
                        {log.dificultad_temas || log.observacion || 'Sin detalles'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setEditingReport(log)
                            setReportForm({
                              en_riesgo: log.en_riesgo,
                              dificultad_temas: log.dificultad_temas || '',
                              observacion: log.observacion || ''
                            })
                            setShowEditReportModal(true)
                          }}
                          className="px-2.5 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-300 rounded-lg text-xs font-bold transition"
                        >
                          Modificar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. CARGAS ACADÉMICAS Y CLONACIÓN */}
        {activeTab === 'ASIGNACIONES' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Cargas Académicas ({asignaciones.length} asignaciones activas)
                </h3>
                <p className="text-xs text-slate-400">
                  Vínculo entre Docente, Asignatura y los 22 Salones
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCloneAsigModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                  <span>Clonar Cargas de un Salón</span>
                </button>

                <button
                  onClick={() => setShowAsigModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Asignación</span>
                </button>
              </div>
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
                      <td className="p-3 font-bold text-slate-100">{a.docente?.nombre}</td>
                      <td className="p-3 text-slate-300 font-semibold">{a.materia?.nombre}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 text-[11px] font-bold">
                          Grado {a.grado?.nombre}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={async () => {
                            if (confirm('¿Eliminar esta carga académica?')) {
                              await supabase.from('asignaciones').delete().eq('id', a.id)
                              notify('Carga eliminada.')
                              loadAllMasterData()
                            }
                          }}
                          className="p-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg transition"
                          title="Eliminar"
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

        {/* 6. MATERIAS Y SALONES */}
        {activeTab === 'MATERIAS_GRADOS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100">
                  Catálogo de Asignaturas ({materias.length})
                </h3>
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

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100">
                  Salones de Clase ({grados.length} salones)
                </h3>
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

        {/* 7. PERIODOS */}
        {activeTab === 'PERIODOS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Gestión de Periodos Lectivos
                </h3>
                <p className="text-xs text-slate-400">
                  Abre nuevos periodos o cambia el año escolar
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
                        Estado: {p.activo ? 'Abierto' : 'Bloqueado'}
                      </span>

                      {!isCurrentActive && (
                        <button
                          onClick={() => handleTogglePeriodActive(p)}
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

        {/* 8. CONFIGURACIÓN INSTITUCIONAL Y MEMBRETE */}
        {activeTab === 'CONFIG_INSTITUCIONAL' && (
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 max-w-3xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">
                Membrete Legal y Datos de la Institución
              </h3>
              <p className="text-xs text-slate-400">
                Estos textos aparecen en las boletas, actas de compromiso y planillas PDF oficiales.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Nombre Institucional:</label>
                <input
                  type="text"
                  value={institucionConfig.nombre}
                  onChange={(e) => setInstitucionConfig({ ...institucionConfig, nombre: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Resolución 1:</label>
                  <input
                    type="text"
                    value={institucionConfig.resolucion1}
                    onChange={(e) => setInstitucionConfig({ ...institucionConfig, resolucion1: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Resolución 2:</label>
                  <input
                    type="text"
                    value={institucionConfig.resolucion2}
                    onChange={(e) => setInstitucionConfig({ ...institucionConfig, resolucion2: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">NIT:</label>
                  <input
                    type="text"
                    value={institucionConfig.nit}
                    onChange={(e) => setInstitucionConfig({ ...institucionConfig, nit: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">DANE:</label>
                  <input
                    type="text"
                    value={institucionConfig.dane}
                    onChange={(e) => setInstitucionConfig({ ...institucionConfig, dane: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Lema Institucional:</label>
                  <input
                    type="text"
                    value={institucionConfig.lema}
                    onChange={(e) => setInstitucionConfig({ ...institucionConfig, lema: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                  />
                </div>
              </div>

              <button
                onClick={() => notify('Membrete institucional guardado.')}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        )}

        {/* 9. BASE DE DATOS Y RESETEOS */}
        {activeTab === 'BASE_DATOS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Docentes</span>
                <span className="text-2xl font-black text-slate-100">{docentes.length}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Estudiantes</span>
                <span className="text-2xl font-black text-slate-100">{estudiantes.length}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Salones</span>
                <span className="text-2xl font-black text-slate-100">{grados.length}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Materias</span>
                <span className="text-2xl font-black text-slate-100">{materias.length}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Cargas</span>
                <span className="text-2xl font-black text-slate-100">{asignaciones.length}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Preinformes</span>
                <span className="text-2xl font-black text-slate-100">{auditLogs.length}</span>
              </div>
            </div>

            {/* Escáner de Integridad */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Diagnóstico de Integridad del Sistema (Health Check)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Estudiantes sin salón:</span>
                  <span className={`font-bold ${orphanStudents.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {orphanStudents.length === 0 ? '0 (Todo en orden)' : `${orphanStudents.length} huérfanos`}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Docentes sin cargas:</span>
                  <span className={`font-bold ${teachersWithoutAssignments.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {teachersWithoutAssignments.length === 0 ? '0 (Todos asignados)' : `${teachersWithoutAssignments.length} sin clases`}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Salones sin materias:</span>
                  <span className={`font-bold ${gradesWithoutAssignments.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {gradesWithoutAssignments.length === 0 ? '0 (Todos con carga)' : `${gradesWithoutAssignments.length} vacíos`}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Copia de Seguridad y Restauración</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Descarga una copia completa en archivo JSON de todas las tablas para guardar en tu equipo o restaurar en cualquier momento.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleExportBackup}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Backup JSON</span>
                  </button>

                  <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Restaurar desde JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportRestore}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-400" />
                  <span>Zona de Peligro y Reseteo</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Para reiniciar solo las notas a cero o limpiar datos, escribe <code>CONFIRMAR</code> a continuación:
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={safetyWipeInput}
                    onChange={(e) => setSafetyWipeInput(e.target.value)}
                    placeholder="Escribe CONFIRMAR para habilitar"
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl text-xs font-mono"
                  />

                  <button
                    onClick={() => {
                      if (safetyWipeInput.trim() === 'CONFIRMAR') {
                        handleWipePreinformesOnly()
                        setSafetyWipeInput('')
                      } else {
                        alert('Debes escribir CONFIRMAR exactamente para habilitar el reseteo.')
                      }
                    }}
                    disabled={safetyWipeInput.trim() !== 'CONFIRMAR'}
                    className="w-full py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 rounded-xl text-xs font-bold transition disabled:opacity-40"
                  >
                    Limpiar Preinformes a Cero
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. MANUAL SUPER ADMIN */}
        {activeTab === 'MANUAL' && (
          <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6 max-w-4xl text-xs leading-relaxed text-slate-300">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <span>Manual de Operación y Protocolos de Seguridad (Super Admin)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Guía de emergencia, comandos y procedimientos para el mantenimiento de la I.E. General Santander.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <span>1. Protocolo de Inicio de Periodo Nuevo</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Ve a la pestaña <strong>Base de Datos</strong> y descarga un <strong>Backup JSON</strong> de seguridad.</li>
                  <li>Usa el botón <strong>Limpiar Solo Preinformes</strong> para poner las notas y estadísticas en 0%.</li>
                  <li>Ve a la pestaña <strong>Periodos</strong> y crea o activa el nuevo periodo (ej. <em>4to Periodo</em>).</li>
                  <li>Las planillas quedan inmediatamente listas para que los docentes ingresen sus notas.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <span>2. Protocolo de Nuevo Docente o Traslado</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Crea el docente en la pestaña <strong>Docentes y Claves</strong>. La clave se genera automática con <code>GS-XXX</code>.</li>
                  <li>Ve a <strong>Cargas Académicas</strong> y asígnale las materias y salones correspondientes.</li>
                  <li>Imprime o envíale su credencial usando el botón <strong>Tirillas QR</strong>.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <span>3. Protocolo de Recuperación ante Desastres (Rollback)</span>
                </h4>
                <p>
                  Si por error se borran datos o se hace un reseteo no deseado, ve a <strong>Base de Datos</strong> &gt; <strong>Restaurar desde JSON</strong> y sube el archivo de backup más reciente. El sistema reconstruirá automáticamente todos los docentes, salones y estudiantes.
                </p>
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
              <button onClick={() => setShowTeacherModal(false)} className="text-slate-400 hover:text-white">
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
              <button onClick={() => setShowStudentModal(false)} className="text-slate-400 hover:text-white">
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

      {/* MODAL MATRÍCULA MASIVA EN LOTE */}
      {showBulkStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Matrícula Masiva de Estudiantes en Lote</span>
              </h3>
              <button onClick={() => setShowBulkStudentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkStudentImport} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Salón Destino:</label>
                <select
                  value={bulkTargetGradoId}
                  onChange={(e) => setBulkTargetGradoId(e.target.value)}
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

              <div>
                <label className="block text-slate-400 mb-1 font-bold">
                  Pega aquí la lista de alumnos (Un alumno por línea):
                </label>
                <p className="text-[11px] text-slate-500 mb-1">
                  Formato aceptado: <code>CODIGO, NOMBRE</code> o simplemente el <code>NOMBRE</code>
                </p>
                <textarea
                  rows={8}
                  value={bulkStudentText}
                  onChange={(e) => setBulkStudentText(e.target.value)}
                  placeholder={`EST-001, Juan David Pérez Gómez\nEST-002, María José Rodríguez\nEST-003, Carlos Andrés Mendoza`}
                  className="w-full p-3 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkStudentModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                >
                  Procesar Matrícula Masiva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CLONAR ASIGNACIONES */}
      {showCloneAsigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                <span>Clonar Cargas Académicas entre Salones</span>
              </h3>
              <button onClick={() => setShowCloneAsigModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloneAsignaciones} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Salón Origen (Copiar de):</label>
                <select
                  value={cloneSourceGradoId}
                  onChange={(e) => setCloneSourceGradoId(e.target.value)}
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

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Salón Destino (Pegar en):</label>
                <select
                  value={cloneTargetGradoId}
                  onChange={(e) => setCloneTargetGradoId(e.target.value)}
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
                  onClick={() => setShowCloneAsigModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
                >
                  Clonar Asignaciones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFICAR PREINFORME DIRECTO */}
      {showEditReportModal && editingReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Modificar Preinforme</h3>
                <p className="text-[11px] text-slate-400">
                  {editingReport.estudiante?.nombre} • {editingReport.asignacion?.materia?.nombre}
                </p>
              </div>
              <button onClick={() => setShowEditReportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReportOverride} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Estado de Riesgo:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportForm({ ...reportForm, en_riesgo: false })}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      !reportForm.en_riesgo
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Al Día (Normal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportForm({ ...reportForm, en_riesgo: true })}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      reportForm.en_riesgo
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    En Riesgo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dificultades y Temas Evaluados:</label>
                <textarea
                  rows={3}
                  value={reportForm.dificultad_temas}
                  onChange={(e) => setReportForm({ ...reportForm, dificultad_temas: e.target.value })}
                  placeholder="Dificultades en evaluaciones, talleres..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Estrategia Pedagógica / Compromiso:</label>
                <textarea
                  rows={2}
                  value={reportForm.observacion}
                  onChange={(e) => setReportForm({ ...reportForm, observacion: e.target.value })}
                  placeholder="Plan de mejoramiento..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditReportModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                >
                  Guardar Cambios
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
              <button onClick={() => setShowAsigModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsignacion} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Docente:</label>
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
                <label className="block text-slate-400 mb-1">Materia:</label>
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
                <label className="block text-slate-400 mb-1">Grado / Salón:</label>
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

      {/* MODAL NUEVO PERIODO */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Crear Nuevo Periodo</h3>
              <button onClick={() => setShowPeriodModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">ID Único:</label>
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
                <label className="block text-slate-400 mb-1">Nombre:</label>
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
