# Plataforma de Preinformes Académicos - IE General Santander (Instegesans)

Plataforma web institucional desarrollada para digitalizar, estructurar y optimizar el proceso de **Preinformes Académicos y Citaciones a Acudientes** en la **Institución Educativa General Santander**.

---

## Identidad Institucional
- **Institución:** I.E. General Santander
- **Resoluciones:** Ratificado mediante Resolución 0776 de 16 de Julio de 2009 | Aprobado mediante Resolución No. 001111 de Sep.20 de 2000
- **NIT:** 800170307 • **DANE:** 123001002125
- **Lema:** *"Liderazgo - Ciencia - Diversidad"*

---

## Principios y Características Principales

1. **Mobile First & Facilidad para Docentes de 60+ Años:**
 - Botones y tarjetas táctiles de gran tamaño (mínimo 48px).
 - Planilla vertical libre de scroll lateral horizontal.
 - **Banco de Frases Frecuentes:** Selección de dificultades académicas y comportamentales comunes en 1 solo toque.
2. **Autoguardado Inteligente con Debounce (600ms):**
 - Guardado instantáneo al alternar estado (`[ Normal ]` / `[ En riesgo ]`).
 - Debounce de 600 ms en cajas de texto para evitar saturación de red en conexiones móviles lentas.
 - Indicador visual sutil: `Guardando...` → ` Guardado`.
3. **Modo Oscuro Predeterminado (High-Contrast Dark Mode):**
 - Paleta moderna basada en `Slate-950` y `Slate-900` con textos de alto contraste (`Slate-100`) para descanso visual.
4. **Motor Vectorial Directo a PDF (Tirillas de Acceso):**
 - Generador en TypeScript con `jsPDF` que construye y descarga directamente el archivo `Tirillas_Acceso_Docentes_IE_General_Santander.pdf` (4 tarjetas por hoja carta con marcas de corte).
5. **Impresión Oficial sin Colapso de Memoria (CSS Print Nativo):**
 - Boletas de citación oficiales agrupadas por estudiante o por docente con saltos de página vectoriales limpios (`@media print` y `break-after: page`).
6. **Panel de Coordinación Académica:**
 - Métricas en tiempo real del avance de los 31 docentes y 22 grados (630 estudiantes).
 - **Modo Solo Lectura (Bloqueo de Periodo):** Interruptor para congelar las planillas una vez impresas las citaciones.
 - **Auditoría e Impersonación ("Ver como docente..."):** Permite a Coordinación inspeccionar e interactuar con la planilla de cualquier docente con barra de retorno superior.

---

## Stack Tecnológico
- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS, Lucide Icons.
- **Base de Datos & Backend:** Supabase (PostgreSQL), `@supabase/supabase-js`.
- **Generación de Documentos:** `jsPDF`, CSS Print Nativo (`@media print`).

---

## Instalación y Ejecución Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/samuxdevs-tech/INSTEGESAN-DEMO.git
cd INSTEGESAN-DEMO

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará corriendo en [http://localhost:3000](http://localhost:3000).

---

## Credenciales de Acceso

- **Coordinación (Administrador):**
 - Usuario: `admin` | Contraseña: `admin123`
- **Docentes:**
 - `adoria` / `GS-126` (Andrés Doria)
 - `lmarina` / `GS-125` (Luz Marina Berrío)
 - `fvidal` / `GS-131` (Francisco Vidal)
 - `dacosta` / `GS-123` (Diana Acosta Castro)
