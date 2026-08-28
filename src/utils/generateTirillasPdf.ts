import jsPDF from 'jspdf'

export interface DocenteTirillaData {
  id: string
  nombre: string
  usuario: string
  password: string
  materias: { materia: string; grados: string }[]
  total_clases: number
}

export const DOCENTES_DATA: DocenteTirillaData[] = [
  {
    "id": "DOC-02",
    "nombre": "Acosta Lopez Leidys Maria",
    "usuario": "alopez",
    "password": "GS-102",
    "materias": [
      {
        "materia": "Ciencias Naturales",
        "grados": "1-01"
      },
      {
        "materia": "Ciencias Sociales",
        "grados": "1-01"
      },
      {
        "materia": "Educación Artística",
        "grados": "1-01"
      },
      {
        "materia": "Educación Religiosa",
        "grados": "1-01"
      },
      {
        "materia": "Lengua Castellana",
        "grados": "1-01"
      },
      {
        "materia": "Lectura Crítica",
        "grados": "1-01"
      },
      {
        "materia": "Inglés",
        "grados": "1-01"
      },
      {
        "materia": "Aritmética",
        "grados": "1-01"
      },
      {
        "materia": "Geometría",
        "grados": "1-01"
      },
      {
        "materia": "Estadística",
        "grados": "1-01"
      },
      {
        "materia": "Tecnología e Informática",
        "grados": "1-01"
      }
    ],
    "total_clases": 11
  },
  {
    "id": "DOC-31",
    "nombre": "Adrián Olivero",
    "usuario": "aolivero",
    "password": "GS-131",
    "materias": [
      {
        "materia": "Lengua Castellana",
        "grados": "7-01, 7-02, 8-01, 8-02"
      },
      {
        "materia": "Cátedra Socioemocional",
        "grados": "8-01"
      }
    ],
    "total_clases": 5
  },
  {
    "id": "DOC-23",
    "nombre": "Andrés Doria",
    "usuario": "adoria",
    "password": "GS-123",
    "materias": [
      {
        "materia": "Cátedra Socioemocional",
        "grados": "8-02"
      },
      {
        "materia": "Biología",
        "grados": "7-03, 8-01, 8-02"
      },
      {
        "materia": "Química",
        "grados": "7-02, 7-03, 8-01, 8-02"
      },
      {
        "materia": "Física",
        "grados": "6-01, 6-02, 6-03, 7-02, 7-03, 8-01, 8-02"
      }
    ],
    "total_clases": 15
  },
  {
    "id": "DOC-06",
    "nombre": "Cañavera Mejia Padys De Jesus",
    "usuario": "cmejia",
    "password": "GS-106",
    "materias": [
      {
        "materia": "Ciencias Naturales",
        "grados": "3-01"
      },
      {
        "materia": "Ciencias Sociales",
        "grados": "3-01"
      },
      {
        "materia": "Educación Artística",
        "grados": "3-01"
      },
      {
        "materia": "Educación Religiosa",
        "grados": "3-01"
      },
      {
        "materia": "Lengua Castellana",
        "grados": "3-01"
      },
      {
        "materia": "Lectura Crítica",
        "grados": "3-01"
      },
      {
        "materia": "Inglés",
        "grados": "3-01"
      },
      {
        "materia": "Aritmética",
        "grados": "3-01"
      },
      {
        "materia": "Geometría",
        "grados": "3-01"
      },
      {
        "materia": "Estadística",
        "grados": "3-01"
      },
      {
        "materia": "Tecnología e Informática",
        "grados": "3-01"
      }
    ],
    "total_clases": 11
  },
  {
    "id": "DOC-29",
    "nombre": "Cecilia Bula",
    "usuario": "cbula",
    "password": "GS-129",
    "materias": [
      {
        "materia": "Tecnología e Informática",
        "grados": "6-01, 6-02, 6-03, 7-01, 7-02, 7-03, 8-01, 8-02, 8-03, 9-01, 9-02"
      }
    ],
    "total_clases": 11
  },
  {
    "id": "DOC-21",
    "nombre": "Diana Acosta Castro",
    "usuario": "dacosta",
    "password": "GS-121",
    "materias": [
      {
        "materia": "Educación Artística",
        "grados": "7-01, 8-01, 8-02"
      },
      {
        "materia": "Educación Ética y en Valores Humanos",
        "grados": "6-01, 6-02"
      },
      {
        "materia": "Inglés",
        "grados": "6-01, 6-02"
      },
      {
        "materia": "Cátedra Socioemocional",
        "grados": "6-01, 6-02, 6-03, 7-02, 7-03, 8-03, 9-01, 9-02, 10-01, 11-01"
      }
    ],
    "total_clases": 17
  },
  {
    "id": "DOC-07",
    "nombre": "Durango Leon Isabel Cristina",
    "usuario": "dleon",
    "password": "GS-107",
    "materias": [
      {
        "materia": "Ciencias Naturales",
        "grados": "3-02"
      },
      {
        "materia": "Ciencias Sociales",
        "grados": "3-02"
      },
      {
        "materia": "Cátedra de la Paz",
        "grados": "3-02"
      },
      {
        "materia": "Educación Artística",
        "grados": "3-02"
      },
      {
        "materia": "Educación Ética y en Valores Humanos",
        "grados": "3-02"
      },
      {
        "materia": "Educación Física, Recreación y Deportes",
        "grados": "3-02"
      },
      {
        "materia": "Educación Religiosa",
        "grados": "3-02"
      },
      {
        "materia": "Lengua Castellana",
        "grados": "3-02"
      },
      {
        "materia": "Lectura Crítica",
        "grados": "3-02"
      },
      {
        "materia": "Inglés",
        "grados": "3-02"
      },
      {
        "materia": "Aritmética",
        "grados": "3-02"
      },
      {
        "materia": "Geometría",
        "grados": "3-02"
      },
      {
        "materia": "Estadística",
        "grados": "3-02"
      },
      {
        "materia": "Tecnología e Informática",
        "grados": "3-02"
      },
      {
        "materia": "Cátedra Socioemocional",
        "grados": "3-02"
      }
    ],
    "total_clases": 15
  },
  {
    "id": "DOC-18",
    "nombre": "Edgardo Pérez",
    "usuario": "eperez",
    "password": "GS-118",
    "materias": [
      {
        "materia": "Lengua Castellana",
        "grados": "8-03, 9-01, 9-02, 10-01, 11-01"
      }
    ],
    "total_clases": 5
  },
  {
    "id": "DOC-11",
    "nombre": "Eiver Lambraño",
    "usuario": "elambrano",
    "password": "GS-111",
    "materias": [
      {
        "materia": "Aritmética",
        "grados": "4-01, 4-02, 5-01, 5-02"
      },
      {
        "materia": "Geometría",
        "grados": "4-01, 4-02, 5-01, 5-02"
      },
      {
        "materia": "Estadística",
        "grados": "4-01, 4-02, 5-01, 5-02"
      },
      {
        "materia": "Tecnología e Informática",
        "grados": "4-01, 4-02, 5-01, 5-02"
      }
    ],
    "total_clases": 16
  },
  {
    "id": "DOC-16",
    "nombre": "Fernando Guzmán",
    "usuario": "fguzman",
    "password": "GS-116",
    "materias": [
      {
        "materia": "Educación Física, Recreación y Deportes",
        "grados": "6-01, 6-02, 6-03, 7-01, 7-02, 7-03, 8-01, 8-02, 8-03, 9-01, 9-02, 10-01, 11-01"
      }
    ],
    "total_clases": 13
  },
  {
    "id": "DOC-28",
    "nombre": "Francisco Vidal",
    "usuario": "fvidal",
    "password": "GS-128",
    "materias": [
      {
        "materia": "Geometría",
        "grados": "6-01, 6-02, 6-03, 7-01, 7-02, 7-03, 8-01, 8-02, 8-03, 9-01, 9-02"
      },
      {
        "materia": "Estadística",
        "grados": "6-01, 6-02, 6-03, 7-01, 7-02, 7-03, 8-01, 8-02, 8-03, 9-01, 9-02"
      }
    ],
    "total_clases": 22
  },
  {
    "id": "DOC-13",
    "nombre": "Gabriel Rossi",
    "usuario": "grossi",
    "password": "GS-113",
    "materias": [
      {
        "materia": "Educación Artística",
        "grados": "6-01, 6-02, 6-03, 7-02, 7-03, 8-03, 9-01, 9-02, 10-01, 11-01"
      },
      {
        "materia": "Física",
        "grados": "8-03, 9-01, 9-02, 10-01, 11-01"
      }
    ],
    "total_clases": 15
  },
  {
    "id": "DOC-03",
    "nombre": "Héctor Doria",
    "usuario": "hdoria",
    "password": "GS-103",
    "materias": [
      {
        "materia": "Cátedra de la Paz",
        "grados": "1-01, 2-01, 3-01, 4-01, 4-02, 5-01, 5-02"
      },
      {
        "materia": "Educación Artística",
        "grados": "4-01, 4-02, 5-01, 5-02"
      },
      {
        "materia": "Cátedra Socioemocional",
        "grados": "1-01, 2-01, 3-01, 4-01, 4-02, 5-01, 5-02"
      }
    ],
    "total_clases": 18
  },
  {
    "id": "DOC-09",
    "nombre": "Idamith León",
    "usuario": "ileon",
    "password": "GS-109",
    "materias": [
      {
        "materia": "Ciencias Sociales",
        "grados": "4-01, 4-02, 5-01, 5-02"
      },
      {
        "materia": "Lectura Crítica",
        "grados": "4-01, 4-02, 5-01, 5-02"
      }
    ],
    "total_clases": 8
  },
  {
    "id": "DOC-30",
    "nombre": "Iván Darío Pérez Lambraño",
    "usuario": "idario",
    "password": "GS-130",
    "materias": [
      {
        "materia": "Inglés",
        "grados": "6-03, 7-01, 7-02, 7-03, 8-01, 8-02"
      }
    ],
    "total_clases": 6
  },
  {
    "id": "DOC-26",
    "nombre": "Jasulith Berrío",
    "usuario": "jberrio",
    "password": "GS-126",
    "materias": [
      {
        "materia": "Lectura Crítica",
        "grados": "6-01, 6-02, 6-03, 7-01, 7-02, 7-03, 8-01, 8-02, 8-03, 9-01, 9-02"
      }
    ],
    "total_clases": 11
  },
  {
    "id": "DOC-15",
    "nombre": "Katia Gloria",
    "usuario": "kgloria",
    "password": "GS-115",
    "materias": [
      {
        "materia": "Educación Ética y en Valores Humanos",
        "grados": "6-03, 7-01, 7-02, 7-03, 8-01, 8-02, 8-03, 9-01, 9-02, 10-01, 11-01"
      },
      {
        "materia": "Educación Religiosa",
        "grados": "6-01, 6-02, 6-03, 7-01, 7-02, 7-03, 8-01, 8-02, 8-03, 9-01, 9-02"
      }
    ],
    "total_clases": 22
  },
  {
    "id": "DOC-20",
    "nombre": "Luis Camilo Burgos",
    "usuario": "lcamilo",
    "password": "GS-120",
    "materias": [
      {
        "materia": "Ciencias Sociales",
        "grados": "7-03, 8-01, 8-02, 8-03"
      },
      {
        "materia": "Cátedra de la Paz",
        "grados": "7-03, 8-01, 8-02, 8-03"
      },
      {
        "materia": "Tecnología e Informática",
        "grados": "10-01, 11-01"
      }
    ],
    "total_clases": 10
  },
  {
    "id": "DOC-01",
    "nombre": "Luna Saenz Edelsy Cecilia",
    "usuario": "lsaenz",
    "password": "GS-101",
    "materias": [
      {
        "materia": "Ciencias Naturales",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Ciencias Sociales",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Cátedra de la Paz",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Educación Artística",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Educación Ética y en Valores Humanos",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Educación Física, Recreación y Deportes",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Educación Religiosa",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Lengua Castellana",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Lectura Crítica",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Inglés",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Aritmética",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Geometría",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Estadística",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Tecnología e Informática",
        "grados": "Aceleración 01"
      },
      {
        "materia": "Cátedra Socioemocional",
        "grados": "Aceleración 01"
      }
    ],
    "total_clases": 15
  },
  {
    "id": "DOC-22",
    "nombre": "Luz Marina Berrío",
    "usuario": "lmarina",
    "password": "GS-122",
    "materias": [
      {
        "materia": "Cátedra Socioemocional",
        "grados": "7-01"
      },
      {
        "materia": "Biología",
        "grados": "6-01, 6-02, 6-03, 7-01, 7-02"
      },
      {
        "materia": "Química",
        "grados": "6-01, 6-02, 6-03, 7-01"
      },
      {
        "materia": "Física",
        "grados": "7-01"
      }
    ],
    "total_clases": 11
  },
  {
    "id": "DOC-25",
    "nombre": "Marelby Pérez",
    "usuario": "mperez",
    "password": "GS-125",
    "materias": [
      {
        "materia": "Cátedra de la Paz",
        "grados": "6-01"
      },
      {
        "materia": "Lengua Castellana",
        "grados": "6-01, 6-02, 6-03, 7-03"
      }
    ],
    "total_clases": 5
  },
  {
    "id": "DOC-14",
    "nombre": "Mariem Madera",
    "usuario": "mmadera",
    "password": "GS-114",
    "materias": [
      {
        "materia": "Ciencias Sociales",
        "grados": "9-01, 9-02, 10-01, 11-01"
      },
      {
        "materia": "Cátedra de la Paz",
        "grados": "9-01, 9-02, 10-01, 11-01"
      },
      {
        "materia": "Ciencias Económicas y Políticas",
        "grados": "10-01, 11-01"
      },
      {
        "materia": "Filosofía",
        "grados": "10-01, 11-01"
      }
    ],
    "total_clases": 12
  },
  {
    "id": "DOC-24",
    "nombre": "Mario Flórez",
    "usuario": "mflorez",
    "password": "GS-124",
    "materias": [
      {
        "materia": "Ciencias Sociales",
        "grados": "6-01, 6-02, 6-03, 7-01, 7-02"
      },
      {
        "materia": "Cátedra de la Paz",
        "grados": "6-02, 6-03, 7-01, 7-02"
      }
    ],
    "total_clases": 9
  },
  {
    "id": "DOC-17",
    "nombre": "Martín González",
    "usuario": "mgonzalez",
    "password": "GS-117",
    "materias": [
      {
        "materia": "Educación Religiosa",
        "grados": "10-01, 11-01"
      },
      {
        "materia": "Inglés",
        "grados": "8-03, 9-01, 9-02, 10-01, 11-01"
      }
    ],
    "total_clases": 7
  },
  {
    "id": "DOC-19",
    "nombre": "Neider Vides",
    "usuario": "nvides",
    "password": "GS-119",
    "materias": [
      {
        "materia": "Trigonometría",
        "grados": "10-01"
      },
      {
        "materia": "Cálculo",
        "grados": "11-01"
      },
      {
        "materia": "Álgebra",
        "grados": "8-02, 8-03, 9-01, 9-02"
      }
    ],
    "total_clases": 6
  },
  {
    "id": "DOC-12",
    "nombre": "Nhora Montero",
    "usuario": "nmontero",
    "password": "GS-112",
    "materias": [
      {
        "materia": "Biología",
        "grados": "8-03, 9-01, 9-02, 10-01, 11-01"
      },
      {
        "materia": "Química",
        "grados": "8-03, 9-01, 9-02, 10-01, 11-01"
      }
    ],
    "total_clases": 10
  },
  {
    "id": "DOC-04",
    "nombre": "Rafael Becerra",
    "usuario": "rbecerra",
    "password": "GS-104",
    "materias": [
      {
        "materia": "Educación Ética y en Valores Humanos",
        "grados": "1-01, 2-01, 3-01"
      },
      {
        "materia": "Educación Física, Recreación y Deportes",
        "grados": "1-01, 2-01, 3-01, 4-01, 4-02, 5-01, 5-02"
      }
    ],
    "total_clases": 10
  },
  {
    "id": "DOC-08",
    "nombre": "Rolando Ramos",
    "usuario": "rramos",
    "password": "GS-108",
    "materias": [
      {
        "materia": "Ciencias Naturales",
        "grados": "4-01, 4-02, 5-01, 5-02"
      },
      {
        "materia": "Inglés",
        "grados": "4-01, 4-02, 5-01, 5-02"
      }
    ],
    "total_clases": 8
  },
  {
    "id": "DOC-10",
    "nombre": "Rosmery Altamiranda",
    "usuario": "raltamiranda",
    "password": "GS-110",
    "materias": [
      {
        "materia": "Educación Ética y en Valores Humanos",
        "grados": "4-01, 4-02, 5-01, 5-02"
      },
      {
        "materia": "Educación Religiosa",
        "grados": "4-01, 4-02, 5-01, 5-02"
      },
      {
        "materia": "Lengua Castellana",
        "grados": "4-01, 4-02, 5-01, 5-02"
      }
    ],
    "total_clases": 12
  },
  {
    "id": "DOC-27",
    "nombre": "Vanessa Meneses",
    "usuario": "vmeneses",
    "password": "GS-127",
    "materias": [
      {
        "materia": "Aritmética",
        "grados": "6-01, 6-02, 6-03, 7-01, 7-02, 7-03"
      },
      {
        "materia": "Álgebra",
        "grados": "8-01"
      }
    ],
    "total_clases": 7
  },
  {
    "id": "DOC-05",
    "nombre": "Velasquez Borja Indira Lucecita",
    "usuario": "vborja",
    "password": "GS-105",
    "materias": [
      {
        "materia": "Ciencias Naturales",
        "grados": "2-01"
      },
      {
        "materia": "Ciencias Sociales",
        "grados": "2-01"
      },
      {
        "materia": "Educación Artística",
        "grados": "2-01"
      },
      {
        "materia": "Educación Religiosa",
        "grados": "2-01"
      },
      {
        "materia": "Lengua Castellana",
        "grados": "2-01"
      },
      {
        "materia": "Lectura Crítica",
        "grados": "2-01"
      },
      {
        "materia": "Inglés",
        "grados": "2-01"
      },
      {
        "materia": "Aritmética",
        "grados": "2-01"
      },
      {
        "materia": "Geometría",
        "grados": "2-01"
      },
      {
        "materia": "Estadística",
        "grados": "2-01"
      },
      {
        "materia": "Tecnología e Informática",
        "grados": "2-01"
      }
    ],
    "total_clases": 11
  }
]

/**
 * Motor dedicado de generación de PDF para tirillas de acceso docente.
 * Genera un PDF vectorial exacto de 4 tarjetas por hoja tamaño carta.
 */
export function generateAndDownloadTirillasPDF(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter' // 215.9 x 279.4 mm
  })

  const marginX = 10
  const marginY = 10
  const cardWidth = 93
  const cardHeight = 124
  const gapX = 9.9
  const gapY = 11.4

  const totalDocentes = DOCENTES_DATA.length
  const cardsPerPage = 4
  const totalPages = Math.ceil(totalDocentes / cardsPerPage)

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage('letter', 'portrait')
    }

    const startIdx = page * cardsPerPage
    const pageDocentes = DOCENTES_DATA.slice(startIdx, startIdx + cardsPerPage)

    pageDocentes.forEach((d, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)

      const x = marginX + col * (cardWidth + gapX)
      const y = marginY + row * (cardHeight + gapY)

      renderSingleTirilla(doc, d, x, y, cardWidth, cardHeight)
    })
  }

  // Descarga directa del archivo PDF generado
  doc.save('Tirillas_Acceso_Docentes_IE_General_Santander.pdf')
}

function renderSingleTirilla(
  doc: jsPDF,
  d: DocenteTirillaData,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // 1. Línea de corte exterior punteada
  doc.setDrawColor(180, 190, 205)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([2, 2], 0)
  doc.rect(x - 2, y - 2, w + 4, h + 4)
  doc.setLineDashPattern([], 0)

  // Guía de corte
  doc.setFontSize(6.5)
  doc.setTextColor(130, 140, 155)
  doc.text('corte', x + w - 4, y - 2.5, { align: 'right' })

  // 2. Fondo de la tarjeta y borde sólido
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.4)
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD')

  // 3. Encabezado institucional azul oscuro
  doc.setFillColor(15, 23, 42)
  doc.rect(x, y, w, 15, 'F')

  // Línea azul de acento
  doc.setFillColor(37, 99, 235)
  doc.rect(x, y + 14.2, w, 0.8, 'F')

  // Textos encabezado
  doc.setTextColor(203, 213, 225)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.text('INSTITUCION EDUCATIVA GENERAL SANTANDER', x + w / 2, y + 5.5, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7.5)
  doc.text('CREDENCIAL DE ACCESO - PREINFORMES', x + w / 2, y + 10.5, { align: 'center' })

  // 4. Datos del Docente
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  doc.text('DOCENTE TITULAR:', x + 4, y + 20)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(9)
  doc.text(d.nombre, x + 4, y + 25)

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(x + 4, y + 27.5, x + w - 4, y + 27.5)

  // 5. Caja de Credenciales
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.3)
  doc.roundedRect(x + 4, y + 30, w - 8, 22, 2, 2, 'FD')

  // Usuario
  doc.setTextColor(71, 85, 105)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('Usuario:', x + 7, y + 36)

  doc.setFillColor(255, 255, 255)
  doc.roundedRect(x + 22, y + 32, 24, 5.5, 1, 1, 'FD')
  doc.setTextColor(15, 23, 42)
  doc.setFont('courier', 'bold')
  doc.setFontSize(8)
  doc.text(d.usuario, x + 24, y + 36)

  // Contraseña
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('Clave:', x + 50, y + 36)

  doc.setFillColor(255, 255, 255)
  doc.roundedRect(x + 60, y + 32, 25, 5.5, 1, 1, 'FD')
  doc.setTextColor(37, 99, 235)
  doc.setFont('courier', 'bold')
  doc.setFontSize(8)
  doc.text(d.password, x + 62, y + 36)

  // Enlace
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.text('Enlace: http://localhost:3000 (o red del colegio)', x + 7, y + 46)

  // 6. Salones Asignados
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.text('SALONES ASIGNADOS PARA ESTE PERIODO:', x + 4, y + 57)

  let curY = y + 62
  const maxLines = 7
  const displayMats = d.materias.slice(0, maxLines)

  displayMats.forEach((m) => {
    doc.setFillColor(37, 99, 235)
    doc.circle(x + 5.5, curY - 1, 0.7, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(7)
    const mName = m.materia + ':'
    doc.text(mName, x + 8, curY)

    const offsetName = doc.getTextWidth(mName) + 1.5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(51, 65, 85)
    doc.setFontSize(6.8)
    
    let gStr = m.grados
    if (x + 8 + offsetName + doc.getTextWidth(gStr) > x + w - 4) {
      while (gStr.length > 0 && x + 8 + offsetName + doc.getTextWidth(gStr + '...') > x + w - 4) {
        gStr = gStr.slice(0, -1)
      }
      gStr += '...'
    }
    doc.text(gStr, x + 8 + offsetName, curY)

    curY += 5.5
  })

  if (d.materias.length > maxLines) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(5.5)
    doc.setTextColor(100, 116, 139)
    doc.text(`+ ${d.materias.length - maxLines} asignaturas mas registradas`, x + 8, curY)
  }

  // 7. Pie de Tarjeta
  doc.setDrawColor(226, 232, 240)
  doc.line(x + 4, y + h - 7, x + w - 4, y + h - 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Uso personal e intransferible - Coordinacion 2026', x + 4, y + h - 3)

  doc.setFont('helvetica', 'bold')
  doc.text(d.id, x + w - 4, y + h - 3, { align: 'right' })
}
