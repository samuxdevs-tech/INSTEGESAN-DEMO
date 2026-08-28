export interface Institucion {
  id: string
  nombre: string
  slogan: string | null
  logo_url: string | null
}

export interface Periodo {
  id: string
  nombre: string
  ano: number
  activo: boolean
}

export interface Grado {
  id: string
  nombre: string
  institucion_id?: string
}

export interface Materia {
  id: string
  nombre: string
  area: string
}

export interface Docente {
  id: string
  nombre: string
  usuario: string
  password?: string
  rol: 'DOCENTE' | 'ADMIN'
}

export interface Estudiante {
  codigo: string
  nombre: string
  grado_id: string
}

export interface Asignacion {
  id: number
  docente_id: string
  materia_id: string
  grado_id: string
  materia?: Materia
  grado?: Grado
  docente?: Docente
}

export interface Preinforme {
  id?: string
  periodo_id: string
  asignacion_id: number
  estudiante_codigo: string
  en_riesgo: boolean
  nivel_riesgo?: string | null
  dificultad_temas?: string | null
  observacion?: string | null
  updated_at?: string
}

export interface PreinformeCompleto extends Preinforme {
  estudiante?: Estudiante
  asignacion?: Asignacion & {
    materia?: Materia
    docente?: Docente
    grado?: Grado
  }
}
