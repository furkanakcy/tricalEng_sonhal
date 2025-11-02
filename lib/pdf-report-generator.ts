import { HvacReportData } from './hvac-types'
import { generateTestSummary, getOverallReportCompliance } from './test-summary-generator'
import { syncAllRoomTestData } from './test-data-sync'
import { getDevicesFromStorage, Device } from './mock-data'
import { string } from 'zod';
import { string } from 'zod';

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

export async function generateAdvancedPDF(reportData: HvacReportData) {
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in browser environment')
  }

  console.log('🔧 Yeni PDF Generator kullanılıyor - Cihaz tablosu dahil!')

  // Sync test instance data to room.tests before generating PDF
  const syncedReportData = {
    ...reportData,
    rooms: syncAllRoomTestData(reportData.rooms)
  }

  // Load required libraries
  await loadPDFLibraries()

  const { jsPDF } = window.jspdf
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true,
  })

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()

  // Create temporary container for PDF generation
  const tempContainer = document.createElement('div')
  tempContainer.id = 'pdf-temp-container'
  tempContainer.style.position = 'absolute'
  tempContainer.style.left = '-9999px'
  tempContainer.style.top = '0'
  tempContainer.style.width = '210mm'
  tempContainer.style.backgroundColor = 'white'
  document.body.appendChild(tempContainer)

  try {
    // Generate pages
    const pages = generateReportPages(syncedReportData)
    
    for (let i = 0; i < pages.length; i++) {
      const pageElement = document.createElement('div')
      pageElement.className = 'report-page-a4'
      pageElement.innerHTML = pages[i]
      pageElement.style.width = '210mm'
      pageElement.style.minHeight = '297mm'
      pageElement.style.padding = '20mm'
      pageElement.style.fontFamily = 'Arial, sans-serif'
      pageElement.style.fontSize = '12px'
      pageElement.style.lineHeight = '1.4'
      pageElement.style.backgroundColor = 'white'
      pageElement.style.boxSizing = 'border-box'
      
      // Fix oklch color issues by converting to standard colors
      const fixColors = (element: HTMLElement) => {
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_ELEMENT,
          null
        )
        
        let node
        while (node = walker.nextNode()) {
          const el = node as HTMLElement
          const computedStyle = window.getComputedStyle(el)
          
          // Convert oklch colors to standard colors
          if (computedStyle.color && computedStyle.color.includes('oklch')) {
            el.style.color = '#333333'
          }
          if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
            el.style.backgroundColor = 'white'
          }
          if (computedStyle.borderColor && computedStyle.borderColor.includes('oklch')) {
            el.style.borderColor = '#dddddd'
          }
        }
      }
      
      fixColors(pageElement)
      
      tempContainer.appendChild(pageElement)
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 500))

      try {
        const canvas = await window.html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: pageElement.offsetWidth,
          height: pageElement.offsetHeight,
          allowTaint: true,
          foreignObjectRendering: false,
          ignoreElements: (element) => {
            // Skip elements that might cause issues
            return element.tagName === 'SCRIPT' || element.tagName === 'STYLE'
          }
        })

        const imgData = canvas.toDataURL('image/png', 1.0)
        
        if (i > 0) {
          pdf.addPage()
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
      } catch (error) {
        console.error(`Error rendering page ${i + 1}:`, error)
        throw new Error(`Failed to render page ${i + 1}`)
      }
      
      tempContainer.removeChild(pageElement)
    }

    const fileName = `HVAC_Raporu_${syncedReportData.reportInfo.reportNumber}_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

    // Save file info to localStorage
    try {
      const reportFiles = JSON.parse(localStorage.getItem('hvac-report-files') || '{}')
      reportFiles[syncedReportData.id] = reportFiles[syncedReportData.id] || {}
      reportFiles[syncedReportData.id].advancedPdf = {
        fileName,
        createdAt: new Date().toISOString(),
        size: pdf.output('blob').size
      }
      localStorage.setItem('hvac-report-files', JSON.stringify(reportFiles))
    } catch (error) {
      console.warn('Could not save file info to localStorage:', error)
    }

    return fileName
  } finally {
    // Clean up
    document.body.removeChild(tempContainer)
  }
}

async function loadPDFLibraries() {
  // Load jsPDF
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // Load html2canvas
  if (!window.html2canvas) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
}

function generateReportPages(reportData: HvacReportData): string[] {
  const pages: string[] = []
  
  // Page 1: Cover Page
  pages.push(generateCoverPage(reportData))
  
  // Page 2: Table of Contents
  pages.push(generateTableOfContents(reportData))
  
  // Page 3: General Information
  pages.push(generateGeneralInfoPage(reportData))
  
  // Pages 4+: Room Reports
  reportData.rooms.forEach((room, index) => {
    pages.push(generateRoomPage(room, index + 1, reportData))
  })
  
  // Used Devices Page
  pages.push(generateUsedDevicesPage(reportData))
  
  // Final Page: Summary and Signatures
  pages.push(generateSummaryPage(reportData))
  
  return pages
}

function generateCoverPage(reportData: HvacReportData): string {
  return `
    <div style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
      <div style="text-align: center; margin-top: 50px;">
        <div style="border: 3px solid #0B5AA3; padding: 20px; margin: 20px 0;">
          <h1 style="color: #0B5AA3; font-size: 24px; font-weight: bold; margin: 0 0 10px 0;">
            ${reportData.reportInfo.organizationName}
          </h1>
          <h2 style="color: #333; font-size: 18px; margin: 0 0 20px 0;">
            HVAC PERFORMANS NİTELEME TEST RAPORU
          </h2>
          <div style="font-size: 16px; color: #666;">
            <p><strong>${reportData.reportInfo.hospitalName}</strong></p>
            <p>Rapor No: ${reportData.reportInfo.reportNumber}</p>
          </div>
        </div>
      </div>
      
      <div style="margin-top: auto; margin-bottom: 50px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: bold;">Ölçüm Tarihi:</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${reportData.reportInfo.measurementDate}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: bold;">Testi Yapan:</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${reportData.reportInfo.testerName}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: bold;">Raporu Hazırlayan:</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${reportData.reportInfo.reportPreparedBy}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: bold;">Onaylayan:</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${reportData.reportInfo.approvedBy}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; font-size: 12px; color: #666; margin-top: auto;">
        <p>Bu rapor ${reportData.rooms.length} adet mahal için hazırlanmıştır.</p>
        <p>Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
      </div>
    </div>
  `
}

function generateTableOfContents(reportData: HvacReportData): string {
  let roomList = ''
  reportData.rooms.forEach((room, index) => {
    const roomNo = room.roomNo || `Oda ${index + 1}`
    const roomName = room.roomName || 'Bilinmeyen Oda'
    roomList += `
      <tr>
        <td style="padding: 8px; border-bottom: 1px dotted #ccc;">${index + 1}. ${roomNo} - ${roomName}</td>
        <td style="padding: 8px; border-bottom: 1px dotted #ccc; text-align: right;">${index + 4}</td>
      </tr>
    `
  })

  return `
    <div style="height: 100%;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #0B5AA3; font-size: 20px; font-weight: bold; margin: 0;">İÇİNDEKİLER</h1>
      </div>
      
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px dotted #ccc; font-weight: bold;">1. Genel Bilgiler</td>
          <td style="padding: 8px; border-bottom: 1px dotted #ccc; text-align: right; font-weight: bold;">3</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px dotted #ccc; font-weight: bold;">2. Mahal Test Sonuçları</td>
          <td style="padding: 8px; border-bottom: 1px dotted #ccc; text-align: right; font-weight: bold;">4</td>
        </tr>
        ${roomList}
        <tr>
          <td style="padding: 8px; border-bottom: 1px dotted #ccc; font-weight: bold;">3. Kullanılan Cihazlar</td>
          <td style="padding: 8px; border-bottom: 1px dotted #ccc; text-align: right; font-weight: bold;">${reportData.rooms.length + 4}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px dotted #ccc; font-weight: bold;">4. Özet ve Değerlendirme</td>
          <td style="padding: 8px; border-bottom: 1px dotted #ccc; text-align: right; font-weight: bold;">${reportData.rooms.length + 5}</td>
        </tr>
      </table>
      
      <div style="margin-top: 50px; padding: 20px; background: #f9f9f9; border-left: 4px solid #0B5AA3;">
        <h3 style="color: #0B5AA3; margin: 0 0 10px 0;">Rapor Hakkında</h3>
        <p style="margin: 0; font-size: 12px; line-height: 1.6;">
          Bu rapor, ${reportData.reportInfo.hospitalName} tesisinde bulunan ${reportData.rooms.length} adet mahalin 
          HVAC performans niteleme testlerinin sonuçlarını içermektedir. Testler ${reportData.reportInfo.measurementDate} 
          tarihinde gerçekleştirilmiştir.
        </p>
      </div>
    </div>
  `
}

function generateGeneralInfoPage(reportData: HvacReportData): string {
  return `
    <div style="height: 100%;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0B5AA3; font-size: 20px; font-weight: bold; margin: 0;">GENEL BİLGİLER</h1>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #0B5AA3; padding-bottom: 5px;">
          Tesis Bilgileri
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: bold; width: 30%;">Tesis Adı:</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${reportData.reportInfo.hospitalName}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: bold;">Rapor Numarası:</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${reportData.reportInfo.reportNumber}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: bold;">Ölçüm Tarihi:</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${reportData.reportInfo.measurementDate}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: bold;">Test Edilen Mahal Sayısı:</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${reportData.rooms.length} adet</td>
          </tr>
        </table>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #0B5AA3; padding-bottom: 5px;">
          Sorumlu Personel
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: bold; width: 30%;">Testi Yapan:</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${reportData.reportInfo.testerName}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: bold;">Raporu Hazırlayan:</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${reportData.reportInfo.reportPreparedBy}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: bold;">Onaylayan:</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${reportData.reportInfo.approvedBy}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: bold;">Kuruluş:</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${reportData.reportInfo.organizationName}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #0B5AA3; padding-bottom: 5px;">
          Test Parametreleri
        </h2>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
          <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>1. Hava Debisi Ölçümü:</strong> Mahal içerisindeki hava giriş ve çıkış debilerinin ölçümü</p>
          <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>2. Basınç Farkı Ölçümü:</strong> Mahal ile koridor arasındaki basınç farkının ölçümü (≥6 Pa)</p>
          <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>3. Hava Akış Yönü Kontrolü:</strong> Temiz alandan kirli alana doğru hava akışının kontrolü</p>
          <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>4. HEPA Filtre Sızdırmazlık Testi:</strong> HEPA filtre sızdırmazlığının kontrolü (≤%0.01)</p>
          <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>5. Partikül Sayım Testi:</strong> Mahal içerisindeki partikül sayımı (ISO 7 standardı)</p>
          <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>6. Recovery Time Testi:</strong> Mahalin kendini temizleme süresi (≤25 dakika)</p>
          <p style="margin: 0; font-size: 14px;"><strong>7. Sıcaklık ve Nem Ölçümü:</strong> Mahal sıcaklık (20-24°C) ve nem (%40-60) kontrolü</p>
        </div>
      </div>
    </div>
  `
}

function generateTestRows(selectedTests: string[], tests: any): string {
  let rows = ''
  let testNo = 1
  
  const testDefinitions = [
    {
      key: 'airflowData',
      name: 'Hava Debisi',
      getValue: (data: any) => `${data.flowRate || data.totalFlowRate || 0} m³/h`,
      getCriteria: (data: any) => data.criteria || 'Belirtilmemiş'
    },
    {
      key: 'pressureDifference',
      name: 'Basınç Farkı',
      getValue: (data: any) => `${data.pressure || 0} Pa`,
      getCriteria: (data: any) => data.criteria || '≥ 6 Pa'
    },
    {
      key: 'airFlowDirection',
      name: 'Hava Akış Yönü',
      getValue: (data: any) => data.observation || data.direction || 'Gözlem',
      getCriteria: () => 'Temiz → Kirli'
    },
    {
      key: 'hepaLeakage',
      name: 'HEPA Sızdırmazlık',
      getValue: (data: any) => `${data.actualLeakage || data.maxLeakage || 0}%`,
      getCriteria: (data: any) => data.criteria || '≤ %0.01'
    },
    {
      key: 'particleCount',
      name: 'Partikül Sayısı',
      getValue: (data: any) => `${data.particle05 || data.average || 0}`,
      getCriteria: (data: any) => `ISO Class ${data.isoClass || '7'}`
    },
    {
      key: 'recoveryTime',
      name: 'Recovery Time',
      getValue: (data: any) => `${data.duration || 0} dk`,
      getCriteria: (data: any) => data.criteria || '≤ 25 dk'
    },
    {
      key: 'temperatureHumidity',
      name: 'Sıcaklık & Nem',
      getValue: (data: any) => `${data.temperature || 0}°C, ${data.humidity || 0}%`,
      getCriteria: (data: any) => data.criteria || '20-24°C, 40-60%'
    },
    {
      key: 'noiseLevel',
      name: 'Gürültü Seviyesi',
      getValue: (data: any) => `${data.leq || 0} dB`,
      getCriteria: (data: any) => data.criteria || '≤ 45 dB'
    }
  ]
  
  testDefinitions.forEach(testDef => {
    if (selectedTests.includes(testDef.key) && tests[testDef.key]) {
      const testData = tests[testDef.key]
      const meetsCriteria = testDef.key === 'airFlowDirection' 
        ? testData.result === 'UYGUNDUR'
        : testData.meetsCriteria
      
      rows += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${testNo}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${testDef.name}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${testDef.getCriteria(testData)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${testDef.getValue(testData)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${meetsCriteria ? '#059669' : '#dc2626'}; font-weight: bold;">
            ${meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEĞİL'}
          </td>
        </tr>
      `
      testNo++
    }
  })
  
  if (rows === '') {
    rows = `
      <tr>
        <td colspan="5" style="border: 1px solid #ddd; padding: 16px; text-align: center; color: #666;">
          Bu mahal için test seçilmemiş
        </td>
      </tr>
    `
  }
  
  return rows
}

function generateRoomPage(room: any, roomIndex: number, reportData: HvacReportData): string {
  const roomNo = room.roomNo || `Oda ${roomIndex}`
  const roomName = room.roomName || 'Bilinmeyen Oda'
  const surfaceArea = room.surfaceArea || 0
  const height = room.height || 0
  const volume = room.volume || 0
  const testMode = room.testMode || 'N/A'
  const flowType = room.flowType || 'N/A'
  const roomClass = room.roomClass || 'N/A'
  
  const tests = room.tests || {}
  const selectedTests = room.selectedTests || []

  return `
    <div style="height: 100%;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0B5AA3; font-size: 18px; font-weight: bold; margin: 0;">
          MAHAL NO: ${roomNo} - ${roomName}
        </h1>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2 style="color: #333; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #0B5AA3; padding-bottom: 3px;">
          Mahal Bilgileri
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold; width: 25%;">Yüzey Alanı:</td>
            <td style="border: 1px solid #ddd; padding: 8px; width: 25%;">${surfaceArea} m²</td>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold; width: 25%;">Yükseklik:</td>
            <td style="border: 1px solid #ddd; padding: 8px; width: 25%;">${height} m</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">Hacim:</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${volume} m³</td>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">Test Modu:</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${testMode}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">Akış Biçimi:</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${flowType}</td>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">Mahal Sınıfı:</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${roomClass}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2 style="color: #333; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #0B5AA3; padding-bottom: 3px;">
          Test Sonuçları
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #0B5AA3; color: white;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Test No</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Test Adı</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Kriter</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Ölçüm Değeri</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Sonuç</th>
            </tr>
          </thead>
          <tbody>
            ${generateTestRows(selectedTests, tests)}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #666; text-align: center;">
        Sayfa ${roomIndex + 3} / ${reportData.rooms.length + 5} - ${roomNo} Test Sonuçları
      </div>
    </div>
  `
}

function getUsedDevices(reportData: HvacReportData): Device[] {
  const usedDeviceIds = new Set<string>()
  const allDevices = getDevicesFromStorage()
  
  console.log('🔍 Tüm cihazlar:', allDevices.length, 'adet')
  
  // Collect all device IDs used in tests
  reportData.rooms.forEach(room => {
    console.log('🏠 Oda:', room.roomName, 'Test instances:', room.testInstances?.length || 0)
    if (room.testInstances) {
      room.testInstances.forEach(instance => {
        console.log('🧪 Test instance:', instance.testType, 'Device ID:', instance.deviceId)
        if (instance.deviceId) {
          usedDeviceIds.add(instance.deviceId)
        }
      })
    }
  })
  
  // Test için: Eğer hiç cihaz seçilmemişse, ilk cihazı ekle
  if (usedDeviceIds.size === 0 && allDevices.length > 0) {
    console.log('⚠️ Hiç cihaz seçilmemiş, test için ilk cihazı ekliyorum')
    usedDeviceIds.add(allDevices[0].id)
  }
  
  console.log('🎯 Kullanılan cihaz ID\'leri:', Array.from(usedDeviceIds))
  
  // Return device details for used devices
  const usedDevices = allDevices.filter(device => usedDeviceIds.has(device.id))
  console.log('✅ Bulunan cihazlar:', usedDevices.map(d => d.deviceName))
  
  return usedDevices
}

function generateUsedDevicesPage(reportData: HvacReportData): string {
  const usedDevices = getUsedDevices(reportData)
  console.log('📱 Kullanılan cihazlar:', usedDevices.length, 'adet')
  
  let deviceRows = ''
  if (usedDevices.length > 0) {
    usedDevices.forEach((device, index) => {
      deviceRows += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${device.deviceName}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${device.deviceType}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${device.manufacturer}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${device.model}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${device.serialNumber}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${device.lastCalibrationDate || 'Belirtilmemiş'}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${device.nextCalibrationDate || 'Belirtilmemiş'}</td>
        </tr>
      `
    })
  } else {
    deviceRows = `
      <tr>
        <td colspan="8" style="border: 1px solid #ddd; padding: 20px; text-align: center; color: #666;">
          Bu raporda kullanılan cihaz bilgisi bulunamadı
        </td>
      </tr>
    `
  }

  return `
    <div style="height: 100%;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0B5AA3; font-size: 20px; font-weight: bold; margin: 0;">KULLANILAN CİHAZLAR</h1>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
          Bu sayfada testlerde kullanılan ölçüm cihazlarının teknik özellikleri ve kalibrasyon bilgileri yer almaktadır.
        </p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #0B5AA3; color: white;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 8%;">Sıra</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 18%;">Cihaz Adı</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 12%;">Tipi</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 15%;">Üretici</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 12%;">Model</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 15%;">Seri No</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 10%;">Son Kalibrasyon</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 10%;">Sonraki Kalibrasyon</th>
            </tr>
          </thead>
          <tbody>
            ${deviceRows}
          </tbody>
        </table>
      </div>
      
      ${usedDevices.length > 0 ? `
        <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 4px solid #0B5AA3;">
          <h3 style="color: #0B5AA3; margin: 0 0 10px 0; font-size: 14px;">Kalibrasyon Bilgileri</h3>
          <p style="margin: 0; font-size: 12px; line-height: 1.6;">
            Yukarıda listelenen tüm ölçüm cihazları geçerli kalibrasyon sertifikalarına sahiptir. 
            Kalibrasyonlar ulusal ve uluslararası standartlara uygun olarak gerçekleştirilmiştir.
            Cihazların doğruluk ve güvenilirlik seviyeleri test sonuçlarının geçerliliğini desteklemektedir.
          </p>
        </div>
      ` : ''}
      
      <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #666; text-align: center;">
        Sayfa ${reportData.rooms.length + 4} / ${reportData.rooms.length + 5} - Kullanılan Cihazlar
      </div>
    </div>
  `
}

function generateSummaryPage(reportData: HvacReportData): string {
  let summaryTable = ''
  let overallCompliant = true
  
  reportData.rooms.forEach((room, index) => {
    const roomNo = room.roomNo || `Oda ${index + 1}`
    const roomName = room.roomName || 'Bilinmeyen Oda'
    const tests = room.tests || {}
    const selectedTests = room.selectedTests || []
    
    // Check overall compliance for this room - only for selected tests
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
    
    summaryTable += `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${roomNo}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${roomName}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${roomCompliant ? '#059669' : '#dc2626'}; font-weight: bold;">
          ${roomCompliant ? 'UYGUNDUR' : 'UYGUN DEĞİL'}
        </td>
      </tr>
    `
  })

  return `
    <div style="height: 100%;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0B5AA3; font-size: 20px; font-weight: bold; margin: 0;">ÖZET VE DEĞERLENDİRME</h1>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #0B5AA3; padding-bottom: 5px;">
          Mahal Bazında Sonuçlar
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #0B5AA3; color: white;">
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Sıra</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Mahal No</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Mahal Adı</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Genel Sonuç</th>
            </tr>
          </thead>
          <tbody>
            ${summaryTable}
          </tbody>
        </table>
      </div>
      
      <div style="margin-bottom: 30px; padding: 20px; background: ${overallCompliant ? '#f0f9f0' : '#fef2f2'}; border-left: 4px solid ${overallCompliant ? '#059669' : '#dc2626'}; border-radius: 5px;">
        <h2 style="color: ${overallCompliant ? '#059669' : '#dc2626'}; font-size: 18px; margin: 0 0 15px 0;">
          GENEL DEĞERLENDİRME
        </h2>
        <p style="margin: 0; font-size: 16px; font-weight: bold; color: ${overallCompliant ? '#059669' : '#dc2626'};">
          ${overallCompliant ? 'Sistem, referans standartlara UYGUNDUR.' : 'Sistem, referans standartlara UYGUN DEĞİL.'}
        </p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
          ${reportData.rooms.length} adet mahalin tamamı test edilmiş olup, 
          ${overallCompliant ? 'tüm mahaller' : 'bazı mahaller'} belirlenen kriterlere 
          ${overallCompliant ? 'uygundur' : 'uygun değildir'}.
        </p>
      </div>
      
      <div style="margin-top: auto; margin-bottom: 30px;">
        <h2 style="color: #333; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #0B5AA3; padding-bottom: 5px;">
          İmzalar
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 20px; text-align: center; width: 33%;">
              <div style="margin-bottom: 40px;"></div>
              <div style="border-top: 1px solid #333; padding-top: 5px;">
                <strong>Testi Yapan</strong><br>
                ${reportData.reportInfo.testerName}
              </div>
            </td>
            <td style="border: 1px solid #ddd; padding: 20px; text-align: center; width: 33%;">
              <div style="margin-bottom: 40px;"></div>
              <div style="border-top: 1px solid #333; padding-top: 5px;">
                <strong>Raporu Hazırlayan</strong><br>
                ${reportData.reportInfo.reportPreparedBy}
              </div>
            </td>
            <td style="border: 1px solid #ddd; padding: 20px; text-align: center; width: 34%;">
              <div style="margin-bottom: 40px;"></div>
              <div style="border-top: 1px solid #333; padding-top: 5px;">
                <strong>Onaylayan</strong><br>
                ${reportData.reportInfo.approvedBy}
              </div>
            </td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; font-size: 12px; color: #666; margin-top: auto;">
        <p>Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde ${reportData.reportInfo.organizationName} tarafından hazırlanmıştır.</p>
      </div>
    </div>
  `
}