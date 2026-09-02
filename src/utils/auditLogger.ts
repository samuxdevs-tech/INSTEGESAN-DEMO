import { supabase } from '../lib/supabase'

export type AuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'IMPERSONATION'
  | 'PREINFORME_SAVE'
  | 'PASSWORD_CHANGE'
  | 'STUDENT_CREATE'
  | 'STUDENT_TRANSFER'
  | 'STUDENT_DELETE'
  | 'BACKUP_DOWNLOAD'
  | 'BACKUP_RESTORE'
  | 'PERIOD_TOGGLE'

export interface AuditLogEntry {
  id: string
  timestamp: string
  eventType: AuditEventType
  userName: string
  userRole?: string
  details: string
  deviceInfo: {
    deviceType: 'Móvil' | 'Computador' | 'Tablet'
    os: string
    browser: string
    resolution: string
    userAgentShort: string
  }
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'
}

export const getDeviceInfo = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceType: 'Computador' as const,
      os: 'Desconocido',
      browser: 'Desconocido',
      resolution: 'N/A',
      userAgentShort: 'Servidor'
    }
  }

  const ua = navigator.userAgent
  let deviceType: 'Móvil' | 'Computador' | 'Tablet' = 'Computador'
  let os = 'Windows'
  let browser = 'Chrome'

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'Tablet'
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) {
    deviceType = 'Móvil'
  } else {
    deviceType = 'Computador'
  }

  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11'
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1'
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7'
  else if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s([0-9.]+)/)
    os = match ? `Android ${match[1]}` : 'Android'
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    const match = ua.match(/OS\s([0-9_]+)/)
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS'
  } else if (/Mac OS X/i.test(ua)) {
    os = 'macOS'
  } else if (/Linux/i.test(ua)) {
    os = 'Linux'
  }

  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge'
  else if (/Chrome\//i.test(ua) && !/Chromium|Edg/i.test(ua)) browser = 'Google Chrome'
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari'
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox'
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera'

  const resolution = `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`

  return {
    deviceType,
    os,
    browser,
    resolution,
    userAgentShort: `${browser} en ${os}`
  }
}

const STORAGE_KEY = 'instegesans_forensic_audit_logs'

export const recordAuditLog = (
  eventType: AuditEventType,
  userName: string,
  details: string,
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL' = 'INFO',
  userRole?: string
) => {
  try {
    const entry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      eventType,
      userName,
      userRole,
      details,
      deviceInfo: getDeviceInfo(),
      severity
    }

    const existingStr = localStorage.getItem(STORAGE_KEY)
    let logs: AuditLogEntry[] = existingStr ? JSON.parse(existingStr) : []
    logs.unshift(entry)
    if (logs.length > 500) logs = logs.slice(0, 500)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))

    ;(async () => {
      try {
        await supabase.from('logs_auditoria').insert({
          event_type: eventType,
          user_name: userName,
          user_role: userRole,
          details: details,
          device_type: entry.deviceInfo.deviceType,
          os: entry.deviceInfo.os,
          browser: entry.deviceInfo.browser,
          resolution: entry.deviceInfo.resolution,
          severity: severity,
          created_at: entry.timestamp
        })
      } catch (err) {}
    })()

    return entry
  } catch (e) {
    console.error('Error grabando log de auditoría:', e)
    return null
  }
}

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY)
    if (!existingStr) return []
    return JSON.parse(existingStr)
  } catch (e) {
    return []
  }
}

export const clearAuditLogs = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {}
}

/**
 * EXPORTADOR EXCEL VISUAL ESTILIZADO (.XLS / HTML XML)
 * Diseñado con membrete corporativo, colores por severidad, bordes y fuentes ejecutivas.
 */
export const exportAuditLogsToExcelVisual = () => {
  const logs = getAuditLogs()
  if (logs.length === 0) {
    alert('No hay registros de auditoría para exportar.')
    return
  }

  const exportDate = new Date().toLocaleString('es-CO')

  const rowsHtml = logs
    .map((l, index) => {
      const isAlt = index % 2 === 1
      const bgStyle = isAlt ? 'background-color: #F8FAFC;' : 'background-color: #FFFFFF;'
      
      let severityBadge = ''
      if (l.severity === 'CRITICAL') {
        severityBadge = 'background-color: #FEE2E2; color: #991B1B; font-weight: bold;'
      } else if (l.severity === 'WARNING') {
        severityBadge = 'background-color: #FEF3C7; color: #92400E; font-weight: bold;'
      } else if (l.severity === 'SUCCESS') {
        severityBadge = 'background-color: #DCFCE7; color: #166534; font-weight: bold;'
      } else {
        severityBadge = 'background-color: #E0E7FF; color: #3730A3; font-weight: bold;'
      }

      let deviceIcon = l.deviceInfo.deviceType === 'Móvil' ? '📱' : l.deviceInfo.deviceType === 'Tablet' ? '📟' : '💻'

      return `
        <tr style="${bgStyle}">
          <td style="font-family: 'Consolas', monospace; font-size: 9pt; text-align: center; border: 1px solid #CBD5E1;">${new Date(l.timestamp).toLocaleString('es-CO')}</td>
          <td style="font-weight: bold; color: #0F172A; border: 1px solid #CBD5E1;">${l.userName}</td>
          <td style="text-align: center; font-family: 'Consolas', monospace; font-weight: bold; color: #475569; border: 1px solid #CBD5E1;">${l.userRole || 'DOCENTE'}</td>
          <td style="text-align: center; border: 1px solid #CBD5E1;">${deviceIcon} ${l.deviceInfo.deviceType}</td>
          <td style="border: 1px solid #CBD5E1;">${l.deviceInfo.os}</td>
          <td style="border: 1px solid #CBD5E1;">${l.deviceInfo.browser}</td>
          <td style="text-align: center; font-family: 'Consolas', monospace; font-size: 8.5pt; color: #64748B; border: 1px solid #CBD5E1;">${l.deviceInfo.resolution}</td>
          <td style="text-align: center; font-weight: bold; font-size: 9pt; border: 1px solid #CBD5E1;">${l.eventType}</td>
          <td style="text-align: center; ${severityBadge} border: 1px solid #CBD5E1;">${l.severity}</td>
          <td style="color: #1E293B; font-size: 9pt; border: 1px solid #CBD5E1;">${l.details}</td>
        </tr>
      `
    })
    .join('')

  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="text/html; charset=UTF-8"/>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Auditoría Forense</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; }
        .header-title { background-color: #0F172A; color: #FFFFFF; font-size: 15pt; font-weight: bold; text-align: center; height: 35pt; vertical-align: middle; }
        .header-subtitle { background-color: #1E293B; color: #CBD5E1; font-size: 10pt; font-weight: bold; text-align: center; height: 24pt; vertical-align: middle; }
        .meta-bar { background-color: #F1F5F9; color: #334155; font-size: 9pt; height: 20pt; vertical-align: middle; font-weight: bold; }
        .th-cell { background-color: #334155; color: #FFFFFF; font-weight: bold; font-size: 9.5pt; text-align: center; border: 1px solid #1E293B; height: 26pt; vertical-align: middle; }
      </style>
    </head>
    <body>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th colspan="10" class="header-title">
              INSTITUCIÓN EDUCATIVA GENERAL SANTANDER — MONTERÍA, CÓRDOBA
            </th>
          </tr>
          <tr>
            <th colspan="10" class="header-subtitle">
              INFORME FORENSE DE AUDITORÍA DIGITAL Y TRAZABILIDAD DE ACCESOS
            </th>
          </tr>
          <tr class="meta-bar">
            <td colspan="5" style="border: 1px solid #CBD5E1;">&nbsp;📅 Fecha de Emisión: ${exportDate}</td>
            <td colspan="5" style="text-align: right; border: 1px solid #CBD5E1;">Total Registros: ${logs.length}&nbsp;</td>
          </tr>
          <tr>
            <th class="th-cell" style="width: 140pt;">Fecha y Hora</th>
            <th class="th-cell" style="width: 160pt;">Usuario Titular</th>
            <th class="th-cell" style="width: 90pt;">Rol</th>
            <th class="th-cell" style="width: 100pt;">Dispositivo</th>
            <th class="th-cell" style="width: 110pt;">Sistema Operativo</th>
            <th class="th-cell" style="width: 120pt;">Navegador Web</th>
            <th class="th-cell" style="width: 80pt;">Resolución</th>
            <th class="th-cell" style="width: 110pt;">Tipo de Evento</th>
            <th class="th-cell" style="width: 90pt;">Severidad</th>
            <th class="th-cell" style="width: 320pt;">Detalle Forense de la Acción</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `

  const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Auditoria_Visual_IE_General_Santander_${new Date().toISOString().slice(0, 10)}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * EXPORTADOR CSV FORMATEADO CON SEPARADOR PUNTO Y COMA (;) PARA EXCEL EN ESPAÑOL
 */
export const exportAuditLogsToCSV = () => {
  const logs = getAuditLogs()
  if (logs.length === 0) {
    alert('No hay registros de auditoría para exportar.')
    return
  }

  // Usamos ';' para que Excel en español separe automáticamente las columnas sin apelmazar en la columna A
  const headers = ['Fecha y Hora', 'Usuario', 'Rol', 'Tipo de Dispositivo', 'Sistema Operativo', 'Navegador', 'Resolución', 'Tipo de Evento', 'Severidad', 'Detalle de la Acción']
  const rows = logs.map(l => [
    `"${new Date(l.timestamp).toLocaleString('es-CO').replace(/"/g, '""')}"`,
    `"${l.userName.replace(/"/g, '""')}"`,
    `"${(l.userRole || 'N/A').replace(/"/g, '""')}"`,
    `"${l.deviceInfo.deviceType}"`,
    `"${l.deviceInfo.os}"`,
    `"${l.deviceInfo.browser}"`,
    `"${l.deviceInfo.resolution}"`,
    `"${l.eventType}"`,
    `"${l.severity}"`,
    `"${l.details.replace(/"/g, '""')}"`
  ])

  // UTF-8 BOM + delimitador ';'
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Auditoria_Forense_IE_General_Santander_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
