import { HvacReportData } from './hvac-types'
import { generateTestSummary } from './test-summary-generator'
import { syncAllRoomTestData } from './test-data-sync'

declare global {
  interface Window {
    jspdf: any;
  }
}

export async function generateBasicPDF(reportData: HvacReportData) {
  console.log('🔍 Basic PDF Generator - Input Data:', {
    roomCount: reportData.rooms.length,
    firstRoom: reportData.rooms[0] ? {
      id: reportData.rooms[0].id,
      name: reportData.rooms[0].roomName,
      selectedTests: reportData.rooms[0].selectedTests,
      testsData: reportData.rooms[0].tests
    } : null
  })
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in browser environment')
  }

  // Load jsPDF if not already loaded
  if (!window.jspdf) {
    await loadJsPDF()
  }

  const { jsPDF } = window.jspdf
  const pdf = new jsPDF()

  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 20
  let yPos = 30

  try {
    // Sync test instance data to room.tests before generating PDF
    const syncedReportData = {
      ...reportData,
      rooms: syncAllRoomTestData(reportData.rooms)
    }
    // Title
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('HVAC PERFORMANS NITELEME TEST RAPORU', margin, yPos)
    yPos += 20

    // Hospital name
    pdf.setFontSize(14)
    pdf.text(syncedReportData.reportInfo.hospitalName, margin, yPos)
    yPos += 15

    // Report info
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Rapor No: ' + syncedReportData.reportInfo.reportNumber, margin, yPos)
    yPos += 10
    pdf.text('Tarih: ' + syncedReportData.reportInfo.measurementDate, margin, yPos)
    yPos += 10
    pdf.text('Testi Yapan: ' + syncedReportData.reportInfo.testerName, margin, yPos)
    yPos += 20

    // Room results
    pdf.setFont('helvetica', 'bold')
    pdf.text('MAHAL TEST SONUCLARI', margin, yPos)
    yPos += 15

    syncedReportData.rooms.forEach((room, index) => {
      if (yPos > 250) {
        pdf.addPage()
        yPos = 30
      }

      const roomNo = room.roomNo || ('Oda ' + (index + 1))
      const roomName = room.roomName || 'Bilinmeyen Oda'
      
      pdf.setFont('helvetica', 'bold')
      pdf.text((index + 1) + '. ' + roomNo + ' - ' + roomName, margin, yPos)
      yPos += 10

      pdf.setFont('helvetica', 'normal')
      pdf.text('Alan: ' + (room.surfaceArea || 0) + ' m2', margin + 10, yPos)
      yPos += 8
      pdf.text('Hacim: ' + (room.volume || 0) + ' m3', margin + 10, yPos)
      yPos += 8

      const selectedTests = room.selectedTests || []
      
      // Get all test instances for selected tests, sorted by testType and testIndex
      const testInstances = (room.testInstances || [])
        .filter(instance => selectedTests.includes(instance.testType))
        .sort((a, b) => {
          // First sort by test type
          if (a.testType !== b.testType) return a.testType.localeCompare(b.testType)
          // Then sort by testIndex within same test type
          return (a.testIndex || 0) - (b.testIndex || 0)
        })
      
      // Generate results for each test instance
      const results: string[] = []
      
      testInstances.forEach(instance => {
        if (!instance.data) return
        
        const testData = instance.data
        const sameTypeInstances = testInstances.filter(inst => inst.testType === instance.testType)
        const testSuffix = sameTypeInstances.length > 1 ? ` ${instance.testIndex || 1}` : ''
        
        switch (instance.testType) {
          case 'airflowData':
            results.push(`Hava Debisi${testSuffix}: ${(testData.flowRate || testData.totalFlowRate || 0)} m3/h - ${testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'}`)
            break
          case 'pressureDifference':
            results.push(`Basinc Farki${testSuffix}: ${(testData.pressure || 0)} Pa - ${testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'}`)
            break
          case 'airFlowDirection':
            results.push(`Hava Akis Yonu${testSuffix}: ${testData.result || 'Belirtilmemis'}`)
            break
          case 'hepaLeakage':
            results.push(`HEPA Sizdimazlik${testSuffix}: ${(testData.actualLeakage || testData.maxLeakage || 0)}% - ${testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'}`)
            break
          case 'particleCount':
            results.push(`Partikul Sayisi${testSuffix}: ${(testData.particle05 || testData.average || 0)} - ${testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'}`)
            break
          case 'recoveryTime':
            results.push(`Recovery Time${testSuffix}: ${(testData.duration || 0)} dk - ${testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'}`)
            break
          case 'temperatureHumidity':
            results.push(`Sicaklik & Nem${testSuffix}: ${(testData.temperature || 0)}C, ${(testData.humidity || 0)}% - ${testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'}`)
            break
          case 'noiseLevel':
            results.push(`Gurultu Seviyesi${testSuffix}: ${(testData.leq || 0)} dB - ${testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'}`)
            break
        }
      })

      // If no tests selected, show a message
      if (results.length === 0) {
        results.push('Bu mahal icin test secilmemis.')
      }

      results.forEach(result => {
        if (yPos > 270) {
          pdf.addPage()
          yPos = 30
        }
        pdf.text(result, margin + 15, yPos)
        yPos += 6
      })

      yPos += 10
    })

    // Overall assessment
    if (yPos > 240) {
      pdf.addPage()
      yPos = 30
    }

    pdf.setFont('helvetica', 'bold')
    pdf.text('GENEL DEGERLENDIRME', margin, yPos)
    yPos += 15

    const allCompliant = syncedReportData.rooms.every(room => {
      const tests = room.tests || {}
      const selectedTests = room.selectedTests || []
      
      // Check only selected tests for compliance
      let roomCompliant = true
      
      if (selectedTests.includes('airflowData') && tests.airflowData) {
        roomCompliant = roomCompliant && (tests.airflowData.meetsCriteria ?? false)
      }
      if (selectedTests.includes('pressureDifference') && tests.pressureDifference) {
        roomCompliant = roomCompliant && (tests.pressureDifference.meetsCriteria ?? false)
      }
      if (selectedTests.includes('airFlowDirection') && tests.airFlowDirection) {
        roomCompliant = roomCompliant && (tests.airFlowDirection.result === 'UYGUNDUR')
      }
      if (selectedTests.includes('hepaLeakage') && tests.hepaLeakage) {
        roomCompliant = roomCompliant && (tests.hepaLeakage.meetsCriteria ?? false)
      }
      if (selectedTests.includes('particleCount') && tests.particleCount) {
        roomCompliant = roomCompliant && (tests.particleCount.meetsCriteria ?? false)
      }
      if (selectedTests.includes('recoveryTime') && tests.recoveryTime) {
        roomCompliant = roomCompliant && (tests.recoveryTime.meetsCriteria ?? false)
      }
      if (selectedTests.includes('temperatureHumidity') && tests.temperatureHumidity) {
        roomCompliant = roomCompliant && (tests.temperatureHumidity.meetsCriteria ?? false)
      }
      if (selectedTests.includes('noiseLevel') && tests.noiseLevel) {
        roomCompliant = roomCompliant && (tests.noiseLevel.meetsCriteria ?? false)
      }
      
      return roomCompliant
    })

    pdf.setFont('helvetica', 'normal')
    const assessment = allCompliant 
      ? 'Sistem, referans standartlara UYGUNDUR.'
      : 'Sistem, referans standartlara UYGUN DEGIL.'
    pdf.text(assessment, margin, yPos)
    yPos += 20

    // Signatures
    pdf.setFont('helvetica', 'bold')
    pdf.text('IMZALAR', margin, yPos)
    yPos += 15

    pdf.setFont('helvetica', 'normal')
    pdf.text('Testi Yapan: ' + syncedReportData.reportInfo.testerName, margin, yPos)
    yPos += 10
    pdf.text('Raporu Hazirlayan: ' + syncedReportData.reportInfo.reportPreparedBy, margin, yPos)
    yPos += 10
    pdf.text('Onaylayan: ' + syncedReportData.reportInfo.approvedBy, margin, yPos)

    // Save the PDF
    const fileName = 'HVAC_Raporu_' + syncedReportData.reportInfo.reportNumber + '_' + new Date().toISOString().split('T')[0] + '.pdf'
    pdf.save(fileName)

    // Save file info to localStorage
    try {
      const reportFiles = JSON.parse(localStorage.getItem('hvac-report-files') || '{}')
      reportFiles[reportData.id] = reportFiles[reportData.id] || {}
      reportFiles[reportData.id].basicPdf = {
        fileName,
        createdAt: new Date().toISOString(),
        size: pdf.output('blob').size
      }
      localStorage.setItem('hvac-report-files', JSON.stringify(reportFiles))
    } catch (error) {
      console.warn('Could not save file info to localStorage:', error)
    }

    return fileName

  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('PDF olusturma hatasi: ' + (error as Error).message)
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