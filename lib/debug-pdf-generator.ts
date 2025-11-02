import { HvacReportData } from './hvac-types'

declare global {
  interface Window {
    jspdf: any;
  }
}

export async function generateDebugPDF(reportData: HvacReportData) {
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in browser environment')
  }

  // Load jsPDF if not already loaded
  if (!window.jspdf) {
    await loadJsPDF()
  }

  const { jsPDF } = window.jspdf
  const pdf = new jsPDF()

  const margin = 20
  let yPos = 30

  try {
    // Title
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('DEBUG: KULLANICI VERİLERİ KONTROLÜ', margin, yPos)
    yPos += 20

    // Hospital name
    pdf.setFontSize(14)
    pdf.text('Hastane: ' + reportData.reportInfo.hospitalName, margin, yPos)
    yPos += 10
    pdf.text('Rapor No: ' + reportData.reportInfo.reportNumber, margin, yPos)
    yPos += 20

    // Room data debug
    reportData.rooms.forEach((room, index) => {
      if (yPos > 250) {
        pdf.addPage()
        yPos = 30
      }

      pdf.setFont('helvetica', 'bold')
      pdf.text(`${index + 1}. ${room.roomName || 'İsimsiz Oda'}`, margin, yPos)
      yPos += 10

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      
      // Selected tests
      pdf.text('Seçilen Testler:', margin, yPos)
      yPos += 8
      if (room.selectedTests && room.selectedTests.length > 0) {
        room.selectedTests.forEach(test => {
          pdf.text('- ' + test, margin + 10, yPos)
          yPos += 6
        })
      } else {
        pdf.text('- Hiç test seçilmemiş', margin + 10, yPos)
        yPos += 6
      }
      yPos += 5

      // Test instances debug
      pdf.text('Test Instance Verileri:', margin, yPos)
      yPos += 8
      if (room.testInstances && room.testInstances.length > 0) {
        room.testInstances.forEach(instance => {
          pdf.text(`- ${instance.testType}: ${JSON.stringify(instance.data)}`, margin + 10, yPos)
          yPos += 6
        })
      } else {
        pdf.text('- Hiç test instance yok', margin + 10, yPos)
        yPos += 6
      }
      yPos += 5

      // Room.tests debug
      pdf.text('Room.tests Verileri:', margin, yPos)
      yPos += 8
      if (room.tests) {
        Object.keys(room.tests).forEach(testKey => {
          const testData = room.tests[testKey as keyof typeof room.tests]
          if (testData) {
            pdf.text(`- ${testKey}: ${JSON.stringify(testData)}`, margin + 10, yPos)
            yPos += 6
          }
        })
      } else {
        pdf.text('- Room.tests boş', margin + 10, yPos)
        yPos += 6
      }
      yPos += 15
    })

    // Save the PDF
    const fileName = 'DEBUG_HVAC_' + new Date().toISOString().split('T')[0] + '.pdf'
    pdf.save(fileName)

    return fileName

  } catch (error) {
    console.error('Debug PDF generation error:', error)
    throw new Error('Debug PDF olusturma hatasi: ' + (error as Error).message)
  }
}

async function loadJsPDF() {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
}