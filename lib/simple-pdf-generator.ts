import { HvacReportData } from './hvac-types'
import { generateTestSummary, getOverallReportCompliance } from './test-summary-generator'
import { syncAllRoomTestData } from './test-data-sync'

declare global {
  interface Window {
    jspdf: any;
  }
}

export async function generateSimplePDFReport(reportData: HvacReportData) {
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in browser environment')
  }

  // Sync test instance data to room.tests before generating PDF
  const syncedReportData = {
    ...reportData,
    rooms: syncAllRoomTestData(reportData.rooms)
  }

  // Load jsPDF if not already loaded
  if (!window.jspdf) {
    await loadJsPDF()
  }

  const { jsPDF } = window.jspdf
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Helper functions
  const addRect = (x: number, y: number, width: number, height: number, style = 'S') => {
    pdf.rect(x, y, width, height, style)
  }

  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // Page 1: Cover Page
  yPosition = 50
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(11, 90, 163)
  const orgNameWidth = pdf.getTextWidth(syncedReportData.reportInfo.organizationName)
  pdf.text(syncedReportData.reportInfo.organizationName, (pageWidth - orgNameWidth) / 2, yPosition)
  pdf.setTextColor(0, 0, 0)

  yPosition += 15
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  const titleWidth = pdf.getTextWidth('HVAC PERFORMANS NITELEME TEST RAPORU')
  pdf.text('HVAC PERFORMANS NITELEME TEST RAPORU', (pageWidth - titleWidth) / 2, yPosition)

  yPosition += 20
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'normal')
  const hospitalWidth = pdf.getTextWidth(syncedReportData.reportInfo.hospitalName)
  pdf.text(syncedReportData.reportInfo.hospitalName, (pageWidth - hospitalWidth) / 2, yPosition)
  
  yPosition += 10
  pdf.setFontSize(14)
  const reportNoText = 'Rapor No: ' + syncedReportData.reportInfo.reportNumber
  const reportNoWidth = pdf.getTextWidth(reportNoText)
  pdf.text(reportNoText, (pageWidth - reportNoWidth) / 2, yPosition)

  // Report info table
  yPosition += 40
  const tableData = [
    ['Olcum Tarihi:', syncedReportData.reportInfo.measurementDate],
    ['Testi Yapan:', syncedReportData.reportInfo.testerName],
    ['Raporu Hazirlayan:', syncedReportData.reportInfo.reportPreparedBy],
    ['Onaylayan:', syncedReportData.reportInfo.approvedBy]
  ]

  pdf.setFontSize(12)
  tableData.forEach(([label, value]) => {
    addRect(margin, yPosition - 5, contentWidth, 10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(label, margin + 5, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.text(value, margin + 60, yPosition)
    yPosition += 10
  })

  // Page 2: Table of Contents
  pdf.addPage()
  yPosition = margin + 20

  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  const tocWidth = pdf.getTextWidth('ICINDEKILER')
  pdf.text('ICINDEKILER', (pageWidth - tocWidth) / 2, yPosition)
  
  yPosition += 20
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')

  const tocItems = [
    ['1. Genel Bilgiler', '3'],
    ['2. Mahal Test Sonuclari', '4']
  ]
  
  syncedReportData.rooms.forEach((room, index) => {
    const roomNo = room.roomNo || ('Oda ' + (index + 1))
    const roomName = room.roomName || 'Bilinmeyen Oda'
    tocItems.push(['   ' + (index + 1) + '. ' + roomNo + ' - ' + roomName, String(index + 4)])
  })
  
  tocItems.push(['3. Ozet ve Degerlendirme', String(syncedReportData.rooms.length + 4)])

  tocItems.forEach(([item, page]) => {
    pdf.text(item, margin, yPosition)
    const pageWidth2 = pdf.getTextWidth(page)
    pdf.text(page, pageWidth - margin - pageWidth2, yPosition)
    yPosition += 8
  })

  // Page 3: General Information
  pdf.addPage()
  yPosition = margin + 20

  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  const genelWidth = pdf.getTextWidth('GENEL BILGILER')
  pdf.text('GENEL BILGILER', (pageWidth - genelWidth) / 2, yPosition)
  
  yPosition += 20
  pdf.setFontSize(14)
  pdf.text('Tesis Bilgileri', margin, yPosition)
  yPosition += 10

  const generalInfo = [
    ['Tesis Adi:', syncedReportData.reportInfo.hospitalName],
    ['Rapor Numarasi:', syncedReportData.reportInfo.reportNumber],
    ['Olcum Tarihi:', syncedReportData.reportInfo.measurementDate],
    ['Test Edilen Mahal Sayisi:', syncedReportData.rooms.length + ' adet']
  ]

  pdf.setFontSize(12)
  generalInfo.forEach(([label, value]) => {
    addRect(margin, yPosition - 5, contentWidth, 8)
    pdf.setFont('helvetica', 'bold')
    pdf.text(label, margin + 2, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.text(value, margin + 70, yPosition)
    yPosition += 8
  })

  yPosition += 15
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Sorumlu Personel', margin, yPosition)
  yPosition += 10

  const personnel = [
    ['Testi Yapan:', syncedReportData.reportInfo.testerName],
    ['Raporu Hazirlayan:', syncedReportData.reportInfo.reportPreparedBy],
    ['Onaylayan:', syncedReportData.reportInfo.approvedBy],
    ['Kurulus:', syncedReportData.reportInfo.organizationName]
  ]

  pdf.setFontSize(12)
  personnel.forEach(([label, value]) => {
    addRect(margin, yPosition - 5, contentWidth, 8)
    pdf.setFont('helvetica', 'bold')
    pdf.text(label, margin + 2, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.text(value, margin + 70, yPosition)
    yPosition += 8
  })

  // Room Pages
  syncedReportData.rooms.forEach((room, roomIndex) => {
    pdf.addPage()
    yPosition = margin + 20

    const roomNo = room.roomNo || ('Oda ' + (roomIndex + 1))
    const roomName = room.roomName || 'Bilinmeyen Oda'

    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    const roomTitle = 'MAHAL NO: ' + roomNo + ' - ' + roomName
    const roomTitleWidth = pdf.getTextWidth(roomTitle)
    pdf.text(roomTitle, (pageWidth - roomTitleWidth) / 2, yPosition)
    
    yPosition += 20
    pdf.setFontSize(12)
    pdf.text('Mahal Bilgileri', margin, yPosition)
    yPosition += 10

    const roomInfo = [
      ['Yuzey Alani:', (room.surfaceArea || 0) + ' m2'],
      ['Yukseklik:', (room.height || 0) + ' m'],
      ['Hacim:', (room.volume || 0) + ' m3'],
      ['Test Modu:', room.testMode || 'N/A'],
      ['Akis Bicimi:', room.flowType || 'N/A'],
      ['Mahal Sinifi:', room.roomClass || 'N/A']
    ]

    roomInfo.forEach(([label, value]) => {
      addRect(margin, yPosition - 5, contentWidth, 8)
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, margin + 2, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(value, margin + 50, yPosition)
      yPosition += 8
    })

    yPosition += 15
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Test Sonuclari', margin, yPosition)
    yPosition += 10

    // Test results table header
    const colWidths = [15, 45, 35, 35, 35]
    const colX = [margin, margin + 15, margin + 60, margin + 95, margin + 130]
    
    addRect(margin, yPosition - 5, contentWidth, 10)
    pdf.setFillColor(11, 90, 163)
    pdf.rect(margin, yPosition - 5, contentWidth, 10, 'F')
    
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.text('No', colX[0] + 2, yPosition)
    pdf.text('Test Adı', colX[1] + 2, yPosition)
    pdf.text('Kriter', colX[2] + 2, yPosition)
    pdf.text('Ölçüm', colX[3] + 2, yPosition)
    pdf.text('Sonuç', colX[4] + 2, yPosition)
    
    yPosition += 10
    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'normal')

    const tests = room.tests || {}
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
    
    const testResults: string[][] = []
    let testNo = 1
    
    // Generate results for each test instance
    testInstances.forEach(instance => {
      if (!instance.data) return
      
      const testData = instance.data
      const sameTypeInstances = testInstances.filter(inst => inst.testType === instance.testType)
      const testSuffix = sameTypeInstances.length > 1 ? ` ${instance.testIndex || 1}` : ''
      
      let testName = ''
      let criteria = ''
      let measurement = ''
      let result = ''
      
      switch (instance.testType) {
        case 'airflowData':
          testName = `Hava Debisi${testSuffix}`
          criteria = testData.criteria || 'Belirtilmemis'
          measurement = `${testData.flowRate || testData.totalFlowRate || 0} m3/h`
          result = testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'
          break
        case 'pressureDifference':
          testName = `Basinc Farki${testSuffix}`
          criteria = testData.criteria || '>= 6 Pa'
          measurement = `${testData.pressure || 0} Pa`
          result = testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'
          break
        case 'airFlowDirection':
          testName = `Hava Akis Yonu${testSuffix}`
          criteria = 'Temiz -> Kirli'
          measurement = testData.observation || testData.direction || 'Gozlem'
          result = testData.result || 'Belirtilmemis'
          break
        case 'hepaLeakage':
          testName = `HEPA Sizdimazlik${testSuffix}`
          criteria = testData.criteria || '<= %0.01'
          measurement = `${testData.actualLeakage || testData.maxLeakage || 0}%`
          result = testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'
          break
        case 'particleCount':
          testName = `Partikul Sayisi${testSuffix}`
          criteria = `ISO Class ${testData.isoClass || '7'}`
          measurement = String(testData.particle05 || testData.average || 0)
          result = testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'
          break
        case 'recoveryTime':
          testName = `Recovery Time${testSuffix}`
          criteria = testData.criteria || '<= 25 dk'
          measurement = `${testData.duration || 0} dk`
          result = testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'
          break
        case 'temperatureHumidity':
          testName = `Sicaklik & Nem${testSuffix}`
          criteria = testData.criteria || '20-24C, 40-60%'
          measurement = `${testData.temperature || 0}C, ${testData.humidity || 0}%`
          result = testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'
          break
        case 'noiseLevel':
          testName = `Gurultu Seviyesi${testSuffix}`
          criteria = testData.criteria || '<= 45 dB'
          measurement = `${testData.leq || 0} dB`
          result = testData.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEGIL'
          break
      }
      
      if (testName) {
        testResults.push([
          String(testNo),
          testName,
          criteria,
          measurement,
          result
        ])
        testNo++
      }
    })
    
    // If no tests selected, show message
    if (testResults.length === 0) {
      testResults.push(['', 'Bu mahal icin test secilmemis', '', '', ''])
    }

    testResults.forEach(([no, test, criteria, measurement, result]) => {
      addRect(margin, yPosition - 5, contentWidth, 8)
      
      pdf.text(no, colX[0] + 2, yPosition)
      pdf.text(test, colX[1] + 2, yPosition)
      pdf.text(criteria, colX[2] + 2, yPosition)
      pdf.text(measurement, colX[3] + 2, yPosition)
      
      // Color code the result
      if (result.includes('UYGUNDUR') && !result.includes('DEGIL')) {
        pdf.setTextColor(5, 150, 105) // Green
      } else if (result.includes('UYGUN DEGIL')) {
        pdf.setTextColor(220, 38, 38) // Red
      }
      pdf.text(result, colX[4] + 2, yPosition)
      pdf.setTextColor(0, 0, 0) // Reset to black
      
      yPosition += 8
    })
  })

  // Summary Page
  pdf.addPage()
  yPosition = margin + 20

  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  const summaryTitle = 'OZET VE DEGERLENDIRME'
  const summaryWidth = pdf.getTextWidth(summaryTitle)
  pdf.text(summaryTitle, (pageWidth - summaryWidth) / 2, yPosition)
  
  yPosition += 20
  pdf.setFontSize(14)
  pdf.text('Mahal Bazinda Sonuclar', margin, yPosition)
  yPosition += 10

  // Summary table header
  addRect(margin, yPosition - 5, contentWidth, 10)
  pdf.setFillColor(11, 90, 163)
  pdf.rect(margin, yPosition - 5, contentWidth, 10, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Sira', margin + 5, yPosition)
  pdf.text('Mahal No', margin + 25, yPosition)
  pdf.text('Mahal Adi', margin + 65, yPosition)
  pdf.text('Genel Sonuc', margin + 125, yPosition)
  
  yPosition += 10
  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'normal')

  let overallCompliant = true
  syncedReportData.rooms.forEach((room, index) => {
    const roomNo = room.roomNo || ('Oda ' + (index + 1))
    const roomName = room.roomName || 'Bilinmeyen Oda'
    const tests = room.tests || {}
    const selectedTests = room.selectedTests || []
    
    // Check compliance only for selected tests
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
    
    if (!roomCompliant) overallCompliant = false
    
    addRect(margin, yPosition - 5, contentWidth, 8)
    pdf.text(String(index + 1), margin + 5, yPosition)
    pdf.text(roomNo, margin + 25, yPosition)
    pdf.text(roomName, margin + 65, yPosition)
    
    if (roomCompliant) {
      pdf.setTextColor(5, 150, 105) // Green
      pdf.text('UYGUNDUR', margin + 125, yPosition)
    } else {
      pdf.setTextColor(220, 38, 38) // Red
      pdf.text('UYGUN DEGIL', margin + 125, yPosition)
    }
    pdf.setTextColor(0, 0, 0) // Reset to black
    
    yPosition += 8
  })

  // Overall assessment
  yPosition += 20
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('GENEL DEGERLENDIRME', margin, yPosition)
  
  yPosition += 15
  pdf.setFontSize(14)
  if (overallCompliant) {
    pdf.setTextColor(5, 150, 105) // Green
    pdf.text('Sistem, referans standartlara UYGUNDUR.', margin, yPosition)
  } else {
    pdf.setTextColor(220, 38, 38) // Red
    pdf.text('Sistem, referans standartlara UYGUN DEGIL.', margin, yPosition)
  }
  pdf.setTextColor(0, 0, 0) // Reset to black

  // Signatures
  yPosition += 30
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Imzalar', margin, yPosition)
  yPosition += 20

  const signatureWidth = contentWidth / 3
  const signatures = [
    ['Testi Yapan', syncedReportData.reportInfo.testerName],
    ['Raporu Hazirlayan', syncedReportData.reportInfo.reportPreparedBy],
    ['Onaylayan', syncedReportData.reportInfo.approvedBy]
  ]

  signatures.forEach(([title, name], index) => {
    const x = margin + (index * signatureWidth)
    addRect(x, yPosition, signatureWidth - 5, 30)
    pdf.text(title, x + 5, yPosition + 40)
    pdf.text(name, x + 5, yPosition + 50)
  })

  // Save the PDF
  const fileName = 'HVAC_Raporu_' + syncedReportData.reportInfo.reportNumber + '_' + new Date().toISOString().split('T')[0] + '.pdf'
  pdf.save(fileName)

  // Save file info to localStorage
  try {
    const reportFiles = JSON.parse(localStorage.getItem('hvac-report-files') || '{}')
    reportFiles[syncedReportData.id] = reportFiles[syncedReportData.id] || {}
    reportFiles[syncedReportData.id].simplePdf = {
      fileName,
      createdAt: new Date().toISOString(),
      size: pdf.output('blob').size
    }
    localStorage.setItem('hvac-report-files', JSON.stringify(reportFiles))
  } catch (error) {
    console.warn('Could not save file info to localStorage:', error)
  }

  return fileName
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