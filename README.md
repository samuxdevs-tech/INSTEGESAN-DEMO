# Sistema Institucional de Preinformes y Seguimiento Académico
**Institución Educativa General Santander — Montería, Córdoba**

Plataforma digital institucional desarrollada para la gestión, seguimiento pedagógico, emisión de alertas tempranas y consulta en línea de preinformes académicos para directivos, docentes, acudientes y estudiantes.

---

## 🏛️ Identidad y Datos Institucionales
* **Institución Educativa:** General Santander
* **Ubicación:** Montería, Córdoba, Colombia
* **Resoluciones Oficiales:** Ratificado mediante Resolución 0776 de 16 de Julio de 2009 | Aprobado mediante Resolución No. 001111 de Sep. 20 de 2000
* **NIT:** 800170307 • **Código DANE:** 123001002125
* **Lema Institucional:** *"Liderazgo - Ciencia - Diversidad"*

---

## 📋 Arquitectura y Módulos del Sistema

### 1. Registro y Evaluación Docente (Mobile First)
* **Diseño Ergonómico y Accesible:** Interfaz optimizada para teléfonos móviles y computadores, con botones táctiles de alta visibilidad (mínimo 48px) y disposición vertical continua libre de desplazamiento horizontal.
* **Banco de Descriptores Pedagógicos:** Inserción rápida de dificultades académicas y compromisos formativos estandarizados.
* **Autoguardado Inteligente con Debounce (600ms):** Persistencia en tiempo real al alternar estados de alerta (`Al Día` / `En Riesgo`) y protección de red móvil ante conexiones intermitentes.

### 2. Portal de Consulta Estudiantil y Familiar
* **Acceso Directo:** Consulta inmediata de valoraciones pedagógicas mediante el código de matrícula del estudiante.
* **Boleta Oficial en PDF:** Generación e impresión de boletas individuales con membrete oficial institucional.
* **Canal Informativo:** Resumen pedagógico estructurado para comunicación formal con acudientes.

### 3. Panel de Coordinación Académica
* **Tablero de Control en Vivo:** Supervisión del avance y cumplimiento del cuerpo docente (32 docentes, 22 grados, 630 estudiantes).
* **Control de Periodos:** Bloqueo y habilitación administrativa de planillas para salvaguarda de datos tras la emisión de citaciones.
* **Supervisión Docente:** Acompañamiento e inspección de planillas curriculares.

### 4. Dirección Técnica y Mantenimiento del Sistema
* **Directorio Centralizado de Credenciales:** Administración unificada de las 662 cuentas de acceso de la institución con filtros por grado y rol.
* **Monitoreo de Sesiones en Tiempo Real:** Detección de conectividad activa mediante latidos (*heartbeat* de 15 segundos) y finalización remota de sesiones.
* **Auditoría Forense y Trazabilidad:** Registro cronológico de inicios de sesión, dispositivos (Móvil, Computador, Tablet), navegadores y modificaciones, con exportación en Excel estructurado (`.xls`) y CSV delimitado.
* **Control de Mantenimiento Preventivo:** Restricción programada de acceso con avisos institucionales flotantes para todas las terminales conectadas.
* **Copias de Seguridad y Respaldo:** Exportación e importación integral de la estructura institucional en formato JSON.

---

## 🛠️ Especificaciones Técnicas
* **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS, Lucide Icons.
* **Base de Datos y Backend:** Supabase (PostgreSQL), `@supabase/supabase-js`.
* **Generación Documental:** `jsPDF` (Motor vectorial nativo), CSS Print Oficial (`@media print`).
* **Seguridad y Trazabilidad:** Autenticación por roles (`SUPER_ADMIN`, `ADMIN`, `DOCENTE`, `ESTUDIANTE`), registro de sesiones y auditoría de integridad técnica.

---

## 🚀 Despliegue e Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/samuxdevs-tech/INSTEGESAN-DEMO.git
cd INSTEGESAN-DEMO

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor local
npm run dev
```

La plataforma estará disponible localmente en `http://localhost:3000`.

---

**Institución Educativa General Santander • Montería, Córdoba • Año Lectivo 2026**
