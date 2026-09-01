import jsPDF from 'jspdf'

export interface StudentReportItem {
  materia: string
  docente: string
  enRiesgo: boolean
  dificultades: string
  compromisos: string
}

export const generateIndividualStudentPDF = async (
  student: { codigo: string; nombre: string; grado: string },
  periodoNombre: string,
  subjects: StudentReportItem[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  })

  // Header Box
  doc.setFillColor(15, 23, 42) // slate-900
  doc.rect(14, 12, 188, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('INSTITUCIÓN EDUCATIVA GENERAL SANTANDER', 108, 19, { align: 'center' })

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225) // slate-300
  doc.text('BOLETA DE PREINFORME ACADÉMICO Y SEGUIMIENTO PEDAGÓGICO', 108, 25, { align: 'center' })
  doc.text(`AÑO LECTIVO 2026 • ${periodoNombre.toUpperCase()}`, 108, 30, { align: 'center' })
  doc.text('DANE: 123001002125 • NIT: 800170307 • MONTELÍBANO, CÓRDOBA', 108, 35, { align: 'center' })

  // Student Info Card
  doc.setFillColor(248, 250, 252) // slate-50
  doc.setDrawColor(203, 213, 225) // slate-300
  doc.roundedRect(14, 44, 188, 16, 2, 2, 'FD')

  doc.setTextColor(30, 41, 59) // slate-800
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text(`ESTUDIANTE:`, 18, 50)
  doc.setFont('helvetica', 'normal')
  doc.text(student.nombre.toUpperCase(), 44, 50)

  doc.setFont('helvetica', 'bold')
  doc.text(`CÓDIGO:`, 18, 56)
  doc.setFont('helvetica', 'normal')
  doc.text(student.codigo, 34, 56)

  doc.setFont('helvetica', 'bold')
  doc.text(`SALÓN:`, 85, 56)
  doc.setFont('helvetica', 'normal')
  doc.text(`GRADO ${student.grado.toUpperCase()}`, 102, 56)

  doc.setFont('helvetica', 'bold')
  doc.text(`FECHA:`, 145, 56)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString('es-CO'), 160, 56)

  // Table Headers
  let startY = 66
  doc.setFillColor(30, 41, 59) // slate-800
  doc.rect(14, startY, 188, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)

  doc.text('#', 17, startY + 5.5)
  doc.text('ASIGNATURA', 26, startY + 5.5)
  doc.text('DOCENTE TITULAR', 74, startY + 5.5)
  doc.text('ESTADO', 125, startY + 5.5)
  doc.text('DETALLES Y COMPROMISOS', 150, startY + 5.5)

  startY += 8

  // Table Rows
  subjects.forEach((sub, idx) => {
    // Alternate row background
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252)
      doc.rect(14, startY, 188, 11, 'F')
    }

    doc.setDrawColor(226, 232, 240)
    doc.line(14, startY + 11, 202, startY + 11)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    doc.text((idx + 1).toString(), 17, startY + 7)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(sub.materia.slice(0, 26), 26, startY + 7)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(51, 65, 85)
    doc.text(sub.docente.slice(0, 28), 74, startY + 7)

    if (sub.enRiesgo) {
      doc.setTextColor(185, 28, 28) // Red
      doc.setFont('helvetica', 'bold')
      doc.text('EN RIESGO', 125, startY + 7)

      doc.setTextColor(71, 85, 105)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      const detail = sub.dificultades || sub.compromisos || 'Plan de mejoramiento en aula'
      doc.text(detail.slice(0, 42), 150, startY + 7)
    } else {
      doc.setTextColor(21, 128, 61) // Green
      doc.setFont('helvetica', 'bold')
      doc.text('AL DÍA', 125, startY + 7)

      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.text('Desempeño satisfactorio', 150, startY + 7)
    }

    startY += 11
  })

  // Signatures
  const signY = Math.max(startY + 15, 230)
  if (signY <= 255) {
    doc.setDrawColor(148, 163, 184)
    doc.line(20, signY, 70, signY)
    doc.line(80, signY, 130, signY)
    doc.line(140, signY, 190, signY)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text('Firma del Estudiante', 45, signY + 4, { align: 'center' })
    doc.text('Firma del Padre / Acudiente', 105, signY + 4, { align: 'center' })
    doc.text('Dirección / Coordinación', 165, signY + 4, { align: 'center' })
  }

  // Footer
  doc.setFontSize(6.5)
  doc.setTextColor(148, 163, 184)
  doc.text(
    'Documento oficial de consulta generado por la Plataforma de Preinformes • Institución Educativa General Santander',
    108,
    268,
    { align: 'center' }
  )

  doc.save(`Preinforme_${student.codigo}_${student.nombre.replace(/\s+/g, '_')}.pdf`)
}
