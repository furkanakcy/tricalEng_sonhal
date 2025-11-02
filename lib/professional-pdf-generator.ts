import { HvacReportData } from './hvac-types'
import { syncAllRoomTestData } from './test-data-sync'
import { getDevicesFromStorage, Device } from './mock-data'

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

export async function generateProfessionalPDF(reportData: HvacReportData) {
  console.log('🔍 Professional PDF Generator - Input Data:', {
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

  // Sync test instance data to room.tests before generating PDF
  const syncedReportData = {
    ...reportData,
    rooms: syncAllRoomTestData(reportData.rooms)
  }

  console.log('🔄 Professional PDF Generator - After Sync:', {
    roomCount: syncedReportData.rooms.length,
    firstRoom: syncedReportData.rooms[0] ? {
      id: syncedReportData.rooms[0].id,
      name: syncedReportData.rooms[0].roomName,
      selectedTests: syncedReportData.rooms[0].selectedTests,
      testsData: syncedReportData.rooms[0].tests
    } : null
  })

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
  tempContainer.style.color = '#000000'
  tempContainer.style.fontFamily = 'Arial, sans-serif'
  
  // Add CSS to override any oklch colors globally
  const styleElement = document.createElement('style')
  styleElement.textContent = `
    #pdf-temp-container,
    #pdf-temp-container * {
      color: #333333 !important;
      background-color: white !important;
      border-color: #000000 !important;
      fill: #333333 !important;
      stroke: #333333 !important;
      outline-color: #333333 !important;
      text-decoration-color: #333333 !important;
    }
    
    #pdf-temp-container h1,
    #pdf-temp-container h2,
    #pdf-temp-container h3 {
      color: #000000 !important;
      font-weight: bold !important;
    }
    
    #pdf-temp-container table,
    #pdf-temp-container td,
    #pdf-temp-container th {
      border: 1px solid #000000 !important;
    }
    
    /* Remove all Tailwind classes that might cause oklch issues */
    #pdf-temp-container [class*="text-"],
    #pdf-temp-container [class*="bg-"],
    #pdf-temp-container [class*="border-"] {
      color: #333333 !important;
      background-color: white !important;
      border-color: #000000 !important;
    }
  `
  document.head.appendChild(styleElement)
  document.body.appendChild(tempContainer)

  try {
    // Generate pages with SZUTEST format using synced data
    const pages = generateSZUTESTPages(syncedReportData)
    
    for (let i = 0; i < pages.length; i++) {
      const pageElement = document.createElement('div')
      pageElement.className = 'report-page-a4'
      pageElement.innerHTML = pages[i]
      
      // Apply SZUTEST styling
      applySZUTESTStyling(pageElement)
      
      tempContainer.appendChild(pageElement)
      
      // Wait for content to render and styles to be applied
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Final color fix after DOM insertion
      fixColorIssues(pageElement)
      
      // Ensure element is properly attached and visible
      if (!document.body.contains(tempContainer)) {
        document.body.appendChild(tempContainer)
      }
      
      if (!tempContainer.contains(pageElement)) {
        tempContainer.appendChild(pageElement)
      }

      try {
        // Additional color fix right before rendering
        fixColorIssues(pageElement)
        
        // Force a reflow to ensure all styles are applied
        pageElement.offsetHeight
        
        // Make element visible temporarily for better rendering
        tempContainer.style.position = 'fixed'
        tempContainer.style.left = '0px'
        tempContainer.style.top = '0px'
        tempContainer.style.zIndex = '-1000'
        tempContainer.style.visibility = 'visible'
        tempContainer.style.display = 'block'
        
        // Ensure pageElement has proper dimensions
        pageElement.style.width = '210mm'
        pageElement.style.minHeight = '297mm'
        pageElement.style.display = 'block'
        pageElement.style.visibility = 'visible'
        
        // Wait for DOM to settle and ensure element is ready
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Final check that element exists and is visible
        if (!document.contains(pageElement)) {
          throw new Error('Page element not found in DOM')
        }
        
        const canvas = await window.html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: pageElement.offsetWidth,
          height: pageElement.offsetHeight,
          allowTaint: true,
          foreignObjectRendering: false,
          removeContainer: false,
          windowWidth: pageElement.offsetWidth,
          windowHeight: pageElement.offsetHeight,
          onclone: function(clonedDoc) {
            // Ensure the cloned element exists and is properly styled
            const clonedElement = clonedDoc.getElementById('pdf-temp-container')
            if (clonedElement) {
              clonedElement.style.position = 'static'
              clonedElement.style.left = 'auto'
              clonedElement.style.top = 'auto'
              clonedElement.style.visibility = 'visible'
              clonedElement.style.display = 'block'
              
              // Fix all color issues in cloned document
              const allClonedElements = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))] as HTMLElement[]
              allClonedElements.forEach(el => {
                // Remove all CSS classes
                if (el.className) {
                  el.className = ''
                }
                
                // Force basic colors
                el.style.setProperty('color', '#333333', 'important')
                el.style.setProperty('background-color', 'white', 'important')
                el.style.setProperty('border-color', '#000000', 'important')
                
                // Remove CSS custom properties
                const styles = el.style
                for (let i = styles.length - 1; i >= 0; i--) {
                  const property = styles[i]
                  if (property.startsWith('--')) {
                    el.style.removeProperty(property)
                  }
                }
              })
            }
          }
        })

        // Hide container again
        tempContainer.style.position = 'absolute'
        tempContainer.style.left = '-9999px'
        tempContainer.style.top = '0px'
        tempContainer.style.zIndex = 'auto'

        const imgData = canvas.toDataURL('image/png', 1.0)
        
        if (i > 0) {
          pdf.addPage()
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
      } catch (error) {
        console.error(`Error rendering page ${i + 1}:`, error)
        console.error('Error details:', error)
        
        // Hide container in case of error
        tempContainer.style.position = 'absolute'
        tempContainer.style.left = '-9999px'
        tempContainer.style.top = '0px'
        tempContainer.style.zIndex = 'auto'
        
        throw new Error(`Failed to render page ${i + 1}: ${error.message || 'Unknown error'}`)
      }
      
      tempContainer.removeChild(pageElement)
    }

    const fileName = `HVAC_Raporu_${syncedReportData.reportInfo.reportNumber}_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

    // Save file info to localStorage
    try {
      const reportFiles = JSON.parse(localStorage.getItem('hvac-report-files') || '{}')
      reportFiles[syncedReportData.id] = reportFiles[syncedReportData.id] || {}
      reportFiles[syncedReportData.id].professionalPdf = {
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
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer)
    }
    // Remove the style element we created
    if (document.head.contains(styleElement)) {
      document.head.removeChild(styleElement)
    }
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

function applySZUTESTStyling(pageElement: HTMLElement) {
  pageElement.style.width = '210mm'
  pageElement.style.minHeight = '297mm'
  pageElement.style.padding = '32px'
  pageElement.style.fontFamily = 'Arial, sans-serif'
  pageElement.style.fontSize = '12px'
  pageElement.style.lineHeight = '1.4'
  pageElement.style.backgroundColor = 'white'
  pageElement.style.boxSizing = 'border-box'
  pageElement.style.color = '#000000'
  
  // Fix all oklch and other unsupported color issues
  fixColorIssues(pageElement)
}

function fixColorIssues(element: HTMLElement) {
  // Get all elements including the root element
  const allElements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[]
  
  allElements.forEach(el => {
    // Remove all CSS classes that might contain oklch colors
    if (el.className) {
      el.className = ''
    }
    
    // Force set basic styles with !important
    el.style.setProperty('color', '#333333', 'important')
    el.style.setProperty('background-color', 'white', 'important')
    el.style.setProperty('border-color', '#000000', 'important')
    
    // Remove any CSS custom properties
    const styles = el.style
    for (let i = styles.length - 1; i >= 0; i--) {
      const property = styles[i]
      if (property.startsWith('--')) {
        el.style.removeProperty(property)
      }
    }
    
    // Override specific problematic properties
    el.style.setProperty('fill', '#333333', 'important')
    el.style.setProperty('stroke', '#333333', 'important')
    el.style.setProperty('outline-color', '#333333', 'important')
    el.style.setProperty('text-decoration-color', '#333333', 'important')
    
    // Handle specific element types
    if (el.tagName === 'TD' || el.tagName === 'TH') {
      el.style.setProperty('border', '1px solid #000000', 'important')
    }
    
    if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3') {
      el.style.setProperty('color', '#000000', 'important')
      el.style.setProperty('font-weight', 'bold', 'important')
    }
  })
}

function getUsedDevicesForProfessionalPDF(reportData: HvacReportData): Device[] {
  const usedDeviceIds = new Set<string>()
  const allDevices = getDevicesFromStorage()
  
  console.log('📱 Professional PDF - Tüm cihazlar:', allDevices.length, 'adet')
  
  // Collect all device IDs used in tests
  reportData.rooms.forEach(room => {
    console.log('🏠 Professional PDF - Oda:', room.roomName, 'Test instances:', room.testInstances?.length || 0)
    if (room.testInstances) {
      room.testInstances.forEach(instance => {
        console.log('🧪 Professional PDF - Test instance:', instance.testType, 'Device ID:', instance.deviceId)
        if (instance.deviceId) {
          usedDeviceIds.add(instance.deviceId)
        }
      })
    }
  })
  
  // Test için: Eğer hiç cihaz seçilmemişse, ilk cihazı ekle
  if (usedDeviceIds.size === 0 && allDevices.length > 0) {
    console.log('⚠️ Professional PDF - Hiç cihaz seçilmemiş, test için ilk cihazı ekliyorum')
    usedDeviceIds.add(allDevices[0].id)
  }
  
  console.log('🎯 Professional PDF - Kullanılan cihaz ID\'leri:', Array.from(usedDeviceIds))
  
  const usedDevices = allDevices.filter(device => usedDeviceIds.has(device.id))
  console.log('✅ Professional PDF - Bulunan cihazlar:', usedDevices.map(d => d.deviceName))
  
  return usedDevices
}

function generateSZUTESTPages(reportData: HvacReportData): string[] {
  const pages: string[] = []
  
  // Page 1: Cover Page with SZUTEST Header
  pages.push(generateSZUTESTCoverPage(reportData))
  
  // Page 2: Table of Contents
  pages.push(generateSZUTESTTableOfContents(reportData))
  
  // Page 3: General Information
  pages.push(generateSZUTESTGeneralInfo(reportData))
  
  // Pages 4+: Room Reports
  reportData.rooms.forEach((room, index) => {
    pages.push(generateSZUTESTRoomPage(room, index + 1, reportData))
  })
  
  // Used Devices Page
  pages.push(generateSZUTESTUsedDevicesPage(reportData))
  
  // Final Page: Summary and Signatures
  pages.push(generateSZUTESTSummaryPage(reportData))
  
  return pages
}

function generateSZUTESTCoverPage(reportData: HvacReportData): string {
  return `
    <div style="display: flex; flex-direction: column; height: 100%; font-family: Arial, sans-serif; font-size: 12px;">
      <!-- SZUTEST Header -->
      <div style="display: flex; align-items: start; justify-content: space-between; padding-bottom: 16px; border-bottom: 2px solid black; font-size: 10px;">
        <div style="width: 25%;">
          <div style="width: 80px; height: 60px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
            <span style="font-size: 8px; font-weight: bold;">SZUTEST</span>
          </div>
        </div>
        <div style="width: 50%; text-align: center; padding-top: 8px;">
          <h2 style="font-weight: bold; font-size: 16px; margin: 0;">SZUTEST DENEY LABORATUVARI</h2>
          <h3 style="font-weight: bold; font-size: 14px; margin: 4px 0;">SZUTEST TEST LABORATORY</h3>
          <p style="margin-top: 16px; font-size: 12px;">Szutest Uygunluk Değerlendirme A.Ş.</p>
          <p style="margin: 0;">Yukarı Dudullu Mah. Nato Yolu Cad. Çam Sok. No:7 Ümraniye / İSTANBUL</p>
        </div>
        <div style="width: 25%; display: flex; flex-direction: column; align-items: flex-end;">
          <div style="border: 2px solid black; padding: 4px; width: 96px; height: 96px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div style="color: #dc2626; font-weight: bold; font-size: 18px; letter-spacing: -1px;">TÜRKAK</div>
            <div style="width: 24px; height: 24px; color: #dc2626; margin: 4px 0; font-size: 20px;">✓</div>
            <div style="text-align: center; border: 1px solid black; padding: 2px 8px; margin-top: 4px;">
              <p style="font-weight: bold; margin: 0;">Test</p>
            </div>
            <p style="font-size: 6px; font-weight: bold; margin: 4px 0 0 0;">TS EN ISO/IEC 17025</p>
            <p style="font-size: 6px; font-weight: bold; margin: 0;">AB-0920-T</p>
          </div>
          <table style="text-align: center; font-size: 10px; border-collapse: collapse; border: 2px solid black; margin-top: 8px; width: 96px;">
            <tbody>
              <tr><td style="border: 2px solid black; padding: 4px;">${reportData.reportInfo.reportNumber.split('-')[0]}-T</td></tr>
              <tr><td style="border: 2px solid black; padding: 4px;">${reportData.reportInfo.reportNumber}</td></tr>
              <tr><td style="border: 2px solid black; padding: 4px;">${new Date().getFullYear().toString().slice(-2)}-${String(new Date().getMonth() + 1).padStart(2, '0')}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Main Content -->
      <main style="flex-grow: 1; margin: 16px 0;">
        <h1 style="text-align: center; font-weight: bold; font-size: 20px; margin: 16px 0;">Deney Raporu <br /> Test Report</h1>
        <p style="text-align: center; font-weight: bold; color: #dc2626; font-size: 16px;">HVAC PERFORMANS NİTELEME<br />TEST RAPORU</p>
        
        <div style="margin-top: 24px; border-bottom: 1px solid black;">
          <div style="display: flex; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black;">
            <div style="width: 40%; padding: 4px; border-right: 1px solid black; font-weight: bold;">Müşteri adı / adresi<br />Customer name / address</div>
            <div style="width: 60%; padding: 4px;">: ${reportData.reportInfo.hospitalName}<br/>: ${reportData.reportInfo.organizationName}</div>
          </div>
          <div style="display: flex; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black;">
            <div style="width: 40%; padding: 4px; border-right: 1px solid black; font-weight: bold;">İstek numarası Order no</div>
            <div style="width: 60%; padding: 4px;">: ${reportData.reportInfo.reportNumber}</div>
          </div>
          <div style="display: flex; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black;">
            <div style="width: 40%; padding: 4px; border-right: 1px solid black; font-weight: bold;">Bakanlık Yetki Numarası Ministry authorization no</div>
            <div style="width: 60%; padding: 4px;">: AB-0920-T</div>
          </div>
          <div style="display: flex; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black;">
            <div style="width: 40%; padding: 4px; border-right: 1px solid black; font-weight: bold;">Numune adı ve tarifi Name and identity of test item</div>
            <div style="width: 60%; padding: 4px;">: HVAC Performans Niteleme Testi</div>
          </div>
          <div style="display: flex; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black;">
            <div style="width: 40%; padding: 4px; border-right: 1px solid black; font-weight: bold;">Numune kabul tarihi The date of receipt of test item</div>
            <div style="width: 60%; padding: 4px;">: ${reportData.reportInfo.measurementDate}</div>
          </div>
          <div style="display: flex; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black;">
            <div style="width: 40%; padding: 4px; border-right: 1px solid black; font-weight: bold;">Açıklamalar Remarks</div>
            <div style="width: 60%; padding: 4px;">: ${reportData.rooms.length} adet mahal test edilmiştir</div>
          </div>
          <div style="display: flex; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black;">
            <div style="width: 40%; padding: 4px; border-right: 1px solid black; font-weight: bold;">Ölçüm tarihi The date of test</div>
            <div style="width: 60%; padding: 4px;">: ${reportData.reportInfo.measurementDate}</div>
          </div>
          <div style="display: flex; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black;">
            <div style="width: 40%; padding: 4px; border-right: 1px solid black; font-weight: bold;">Rapor no Report no</div>
            <div style="width: 60%; padding: 4px;">: ${reportData.reportInfo.reportNumber}</div>
          </div>
          <div style="display: flex; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black;">
            <div style="width: 40%; padding: 4px; border-right: 1px solid black; font-weight: bold;">Rapor sayfa sayısı Number of pages of the Report</div>
            <div style="width: 60%; padding: 4px;">: ${reportData.rooms.length + 5}</div>
          </div>
        </div>
        
        <p style="font-size: 10px; margin-top: 16px; line-height: 1.6; text-align: justify;">
          Deney laboratuvarı olarak faaliyet gösteren SZUTEST Uygunluk Değerlendirme A.Ş. TÜRKAK'tan AB-0920-T dosya numarası ile TS EN ISO / IEC 17025:2017 standardına göre akredite edilmiştir. SZUTEST Uygunluk Değerlendirme A.Ş. accredited by TÜRKAK under registration number AB-0920-T for TS EN ISO / IEC 17025:2017 as test laboratory.
        </p>
        
        <div style="display: flex; justify-content: space-around; margin-top: 32px;">
          <div style="text-align: center;">
            <p style="font-weight: bold;">Yayımlandığı Tarih<br />Date</p>
            <p style="margin-top: 16px;">${new Date().toLocaleDateString('tr-TR')}</p>
          </div>
          <div style="text-align: center;">
            <p style="font-weight: bold;">Deney Sorumlusu<br />Person in charge of test</p>
            <p style="margin-top: 16px;">${reportData.reportInfo.testerName}</p>
          </div>
          <div style="text-align: center;">
            <p style="font-weight: bold;">Laboratuvar Müdürü<br />Head of test laboratory</p>
            <p style="margin-top: 16px;">${reportData.reportInfo.approvedBy}</p>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <div style="margin-top: auto; padding-top: 8px; border-top: 2px solid #2563eb; font-size: 9px; display: flex; justify-content: space-between; align-items: center;">
        <p style="width: 75%;">Bu rapor, laboratuvarın yazılı izni olmadan kısmen kopyalanıp çoğaltılamaz. İmzasız ve mühürsüz raporlar geçersizdir. This report shall not be reproduced other than in full except with the permission of the laboratory. Testing reports without signature and seal are not valid.</p>
        <p style="width: 25%; text-align: right; font-weight: bold;">FR.L.HVAC.D.01 R:01</p>
      </div>
    </div>
  `
}

function generateSubsequentPageHeader(pageNum: number, reportData: HvacReportData): string {
  return `
    <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px; border-bottom: 2px solid black; height: 80px;">
      <div style="width: 25%; display: flex; align-items: center; border-right: 2px solid black; height: 100%; padding-right: 8px;">
        <div style="width: 66%; height: 40px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
          <span style="font-size: 8px; font-weight: bold;">SZUTEST</span>
        </div>
        <div style="width: 34%; text-align: center; margin-left: 8px; border-left: 1px solid black; padding-left: 8px;">
          <p style="font-size: 10px; margin: 0;">Sayfa ${pageNum} / ${reportData.rooms.length + 5}</p>
          <p style="font-size: 10px; margin: 0;">Page ${pageNum} / ${reportData.rooms.length + 5}</p>
        </div>
      </div>
      <div style="width: 50%; text-align: center;">
        <h2 style="font-weight: bold; font-size: 16px; margin: 0;">SZUTEST DENEY LABORATUVARI</h2>
        <h3 style="font-weight: bold; font-size: 14px; margin: 4px 0;">SZUTEST TEST LABORATORY</h3>
        <p style="margin-top: 8px; font-size: 12px;">SZUTEST Uygunluk Değerlendirme A.Ş.</p>
      </div>
      <div style="width: 25%; display: flex; justify-content: flex-end;">
        <table style="text-align: center; font-size: 10px; border-collapse: collapse; border: 2px solid black; width: 96px;">
          <tbody>
            <tr><td style="border: 2px solid black; padding: 4px;">${reportData.reportInfo.reportNumber.split('-')[0]}-T</td></tr>
            <tr><td style="border: 2px solid black; padding: 4px;">${reportData.reportInfo.reportNumber}</td></tr>
            <tr><td style="border: 2px solid black; padding: 4px;">${new Date().getFullYear().toString().slice(-2)}-${String(new Date().getMonth() + 1).padStart(2, '0')}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generatePageFooter(): string {
  return `
    <div style="margin-top: auto; padding-top: 8px; border-top: 2px solid #2563eb; font-size: 9px; display: flex; justify-content: space-between; align-items: center;">
      <p style="width: 75%;">Bu rapor, laboratuvarın yazılı izni olmadan kısmen kopyalanıp çoğaltılamaz. İmzasız ve mühürsüz raporlar geçersizdir. This report shall not be reproduced other than in full except with the permission of the laboratory. Testing reports without signature and seal are not valid.</p>
      <p style="width: 25%; text-align: right; font-weight: bold;">FR.L.HVAC.D.01 R:01</p>
    </div>
  `
}

function generateSZUTESTTableOfContents(reportData: HvacReportData): string {
  let roomList = ''
  reportData.rooms.forEach((room, index) => {
    const roomNo = room.roomNo || `Oda ${index + 1}`
    const roomName = room.roomName || 'Bilinmeyen Oda'
    roomList += `
      <div style="display: flex; justify-content: space-between; align-items: end; border-bottom: 1px dotted #ccc; padding: 4px 0;">
        <span>${index + 1}. ${roomNo} - ${roomName}</span>
        <span>${index + 4}</span>
      </div>
    `
  })

  return `
    <div style="height: 100%; font-family: Arial, sans-serif; font-size: 12px;">
      ${generateSubsequentPageHeader(2, reportData)}

      <!-- Content -->
      <div style="margin: 16px 0;">
        <h1 style="text-align: center; font-weight: bold; font-size: 20px; margin: 0 0 16px 0;">İÇİNDEKİLER</h1>
        
        <div style="font-size: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: end; border-bottom: 2px dotted #ccc; padding: 4px 0; font-weight: bold;">
            <span>1. GİRİŞ</span>
            <span>3</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: end; border-bottom: 2px dotted #ccc; padding: 4px 0; margin-left: 32px;">
            <span>1.1 Test Bilgileri</span>
            <span>3</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: end; border-bottom: 2px dotted #ccc; padding: 4px 0; font-weight: bold; margin-top: 16px;">
            <span>2. TEST ANALİZ YÖNTEMİ ve KULLANILAN METOTLAR</span>
            <span>3</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: end; border-bottom: 2px dotted #ccc; padding: 4px 0; font-weight: bold; margin-top: 16px;">
            <span>3. TEST NOKTALARI</span>
            <span>4</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: end; border-bottom: 2px dotted #ccc; padding: 4px 0; font-weight: bold; margin-top: 16px;">
            <span>4. TEST SONUÇLARI</span>
            <span>4</span>
          </div>
          ${roomList}
          <div style="display: flex; justify-content: space-between; align-items: end; border-bottom: 2px dotted #ccc; padding: 4px 0; font-weight: bold; margin-top: 16px;">
            <span>5. KULLANILAN CİHAZLAR</span>
            <span>${reportData.rooms.length + 4}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: end; border-bottom: 2px dotted #ccc; padding: 4px 0; font-weight: bold; margin-top: 16px;">
            <span>6. DEĞERLENDİRME</span>
            <span>${reportData.rooms.length + 5}</span>
          </div>
        </div>
      </div>

      ${generatePageFooter()}
    </div>
  `
}

function generateSZUTESTGeneralInfo(reportData: HvacReportData): string {
  return `
    <div style="height: 100%; font-family: Arial, sans-serif; font-size: 12px;">
      ${generateSubsequentPageHeader(3, reportData)}

      <!-- Content -->
      <div style="margin: 16px 0;">
        <div style="margin-bottom: 24px;">
          <h3 style="font-weight: bold; margin-bottom: 12px; border-bottom: 2px solid #2563eb; padding-bottom: 4px;">
            1. GİRİŞ
          </h3>
          <p style="margin-top: 4px; font-size: 12px; line-height: 1.6; text-align: justify;">
            ${reportData.reportInfo.hospitalName} isimli iş yerinin talebi doğrultusunda SZUTEST Deney Laboratuvarının yetkili deney personeli tarafından yapılan ön inceleme sonucu iş yerinde HVAC performans niteleme testleri yapılmış olup, inceleme ve testler ile ilgili tüm sonuçlar ve öneriler bu raporda belirtilmiştir.
          </p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-weight: bold; margin-bottom: 12px; border-bottom: 2px solid #2563eb; padding-bottom: 4px;">
            1.1 Test Bilgileri
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 4px;">
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold; width: 25%;">Test Sayısı</td>
                <td style="border: 1px solid #ddd; padding: 8px; width: 25%;">${reportData.rooms.length} Mahal</td>
                <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold; width: 25%;">Test Tarihi</td>
                <td style="border: 1px solid #ddd; padding: 8px; width: 25%;">${reportData.reportInfo.measurementDate}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">Testin Yapıldığı Adres</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${reportData.reportInfo.hospitalName}</td>
                <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">Rapor Numarası</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${reportData.reportInfo.reportNumber}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">Test Metodu</td>
                <td style="border: 1px solid #ddd; padding: 8px;">ISO 14644-1, ISO 14644-3</td>
                <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">Testi Gerçekleştiren</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${reportData.reportInfo.testerName}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">Test Türü</td>
                <td style="border: 1px solid #ddd; padding: 8px;">HVAC Performans Niteleme</td>
                <td style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">Raporu Gözden Geçiren</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${reportData.reportInfo.approverName}</td>
              </tr>
            </tbody>
          </table>
          <p style="text-align: center; font-weight: bold; margin-top: 4px; font-size: 12px;">Tablo 1: Test Bilgileri</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-weight: bold; margin-bottom: 12px; border-bottom: 2px solid #2563eb; padding-bottom: 4px;">
            2. TEST ANALİZ YÖNTEMİ ve KULLANILAN METOTLAR
          </h3>
          <p style="margin-top: 4px; font-size: 12px; line-height: 1.6; text-align: justify;">
            Firma yetkilileri ile birlikte belirlenen test noktalarında yapılan testler, ${reportData.reportInfo.measurementDate} tarihinde tipik çalışma koşullarında gerçekleştirilmiştir. HVAC performans niteleme testleri, yapılan ön inceleme sonucunda firmanın rutin çalışma koşullarına göre ISO 14644-1 ve ISO 14644-3 standartlarına uygun olarak gerçekleştirilmiştir.
          </p>
        </div>
      </div>

      ${generatePageFooter()}
    </div>
  `
}

function generateSZUTESTRoomPage(room: any, roomIndex: number, reportData: HvacReportData): string {
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

  // Generate test rows for all test instances (multiple instances of same test type)
  const generateSelectedTestRows = () => {
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
    
    // Get all test instances for selected tests, sorted by testType and testIndex
    const testInstances = (room.testInstances || [])
      .filter(instance => selectedTests.includes(instance.testType))
      .sort((a, b) => {
        // First sort by test type order in testDefinitions
        const aIndex = testDefinitions.findIndex(def => def.key === a.testType)
        const bIndex = testDefinitions.findIndex(def => def.key === b.testType)
        if (aIndex !== bIndex) return aIndex - bIndex
        
        // Then sort by testIndex within same test type
        return (a.testIndex || 0) - (b.testIndex || 0)
      })
    
    // Generate rows for each test instance
    testInstances.forEach(instance => {
      const testDef = testDefinitions.find(def => def.key === instance.testType)
      if (testDef && instance.data) {
        const testData = instance.data
        const meetsCriteria = testDef.key === 'airFlowDirection' 
          ? testData.result === 'UYGUNDUR'
          : testData.meetsCriteria
        
        // Add test index to test name if there are multiple instances of same type
        const sameTypeInstances = testInstances.filter(inst => inst.testType === instance.testType)
        const testName = sameTypeInstances.length > 1 
          ? `${testDef.name} ${instance.testIndex || 1}`
          : testDef.name
        
        rows += `
          <tr>
            <td style="border: 2px solid black; padding: 8px; text-align: center;">${testNo}</td>
            <td style="border: 2px solid black; padding: 8px;">${testName}</td>
            <td style="border: 2px solid black; padding: 8px; text-align: center;">${testDef.getCriteria(testData)}</td>
            <td style="border: 2px solid black; padding: 8px; text-align: center;">${testDef.getValue(testData)}</td>
            <td style="border: 2px solid black; padding: 8px; text-align: center; color: ${meetsCriteria ? '#059669' : '#dc2626'}; font-weight: bold;">
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
          <td colspan="5" style="border: 2px solid black; padding: 16px; text-align: center; color: #666;">
            Bu mahal için test seçilmemiş
          </td>
        </tr>
      `
    }
    
    return rows
  }

  return `
    <div style="height: 100%; font-family: Arial, sans-serif; font-size: 12px;">
      ${generateSubsequentPageHeader(roomIndex + 3, reportData)}

      <!-- Content -->
      <div style="margin: 16px 0;">
        <div style="text-align: center; margin-bottom: 16px;">
          <h1 style="font-weight: bold; font-size: 18px; margin: 0;">
            MAHAL NO: ${roomNo} - ${roomName}
          </h1>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #2563eb; padding-bottom: 2px;">
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
        
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #2563eb; padding-bottom: 2px;">
            Test Sonuçları
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #2563eb; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Test No</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Test Adı</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Kriter</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Ölçüm Değeri</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Sonuç</th>
              </tr>
            </thead>
            <tbody>
              ${generateSelectedTestRows()}
            </tbody>
          </table>
        </div>
      </div>

      ${generatePageFooter()}
    </div>
  `
}



function generateSZUTESTUsedDevicesPage(reportData: HvacReportData): string {
  const usedDevices = getUsedDevicesForProfessionalPDF(reportData)
  
  let deviceRows = ''
  if (usedDevices.length > 0) {
    usedDevices.forEach((device, index) => {
      deviceRows += `
        <tr>
          <td style="border: 2px solid black; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 2px solid black; padding: 8px;">${device.deviceName}</td>
          <td style="border: 2px solid black; padding: 8px;">${device.deviceType}</td>
          <td style="border: 2px solid black; padding: 8px;">${device.manufacturer}</td>
          <td style="border: 2px solid black; padding: 8px;">${device.model}</td>
          <td style="border: 2px solid black; padding: 8px;">${device.serialNumber}</td>
          <td style="border: 2px solid black; padding: 8px; text-align: center;">${device.lastCalibrationDate || 'Belirtilmemiş'}</td>
          <td style="border: 2px solid black; padding: 8px; text-align: center;">${device.nextCalibrationDate || 'Belirtilmemiş'}</td>
        </tr>
      `
    })
  } else {
    deviceRows = `
      <tr>
        <td colspan="8" style="border: 2px solid black; padding: 20px; text-align: center; color: #666;">
          Bu raporda kullanılan cihaz bilgisi bulunamadı
        </td>
      </tr>
    `
  }

  return `
    <div style="height: 100%; font-family: Arial, sans-serif; font-size: 12px;">
      ${generateSubsequentPageHeader(reportData.rooms.length + 4, reportData)}

      <!-- Content -->
      <div style="margin: 16px 0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-weight: bold; font-size: 18px; margin: 0;">
            KULLANILAN CİHAZLAR
          </h1>
          <h2 style="font-weight: bold; font-size: 16px; margin: 4px 0; color: #666;">
            USED DEVICES
          </h2>
        </div>
        
        <div style="margin-bottom: 16px;">
          <p style="font-size: 12px; color: #666; margin-bottom: 16px; text-align: justify;">
            Bu sayfada testlerde kullanılan ölçüm cihazlarının teknik özellikleri ve kalibrasyon bilgileri yer almaktadır.
            The technical specifications and calibration information of the measuring devices used in the tests are given on this page.
          </p>
        </div>
        
        <div style="margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background: #2563eb; color: white;">
                <th style="border: 2px solid black; padding: 8px; text-align: center; width: 8%;">Sıra<br/>No</th>
                <th style="border: 2px solid black; padding: 8px; text-align: center; width: 18%;">Cihaz Adı<br/>Device Name</th>
                <th style="border: 2px solid black; padding: 8px; text-align: center; width: 12%;">Tipi<br/>Type</th>
                <th style="border: 2px solid black; padding: 8px; text-align: center; width: 15%;">Üretici<br/>Manufacturer</th>
                <th style="border: 2px solid black; padding: 8px; text-align: center; width: 12%;">Model<br/>Model</th>
                <th style="border: 2px solid black; padding: 8px; text-align: center; width: 15%;">Seri No<br/>Serial No</th>
                <th style="border: 2px solid black; padding: 8px; text-align: center; width: 10%;">Son Kalibrasyon<br/>Last Calibration</th>
                <th style="border: 2px solid black; padding: 8px; text-align: center; width: 10%;">Sonraki Kalibrasyon<br/>Next Calibration</th>
              </tr>
            </thead>
            <tbody>
              ${deviceRows}
            </tbody>
          </table>
          <p style="text-align: center; font-weight: bold; margin-top: 8px; font-size: 12px;">
            Tablo ${reportData.rooms.length + 1}: Kullanılan Cihazlar / Table ${reportData.rooms.length + 1}: Used Devices
          </p>
        </div>
        
        ${usedDevices.length > 0 ? `
          <div style="margin-top: 24px; padding: 16px; background: #f9f9f9; border-left: 4px solid #2563eb;">
            <h3 style="color: #2563eb; margin: 0 0 12px 0; font-size: 14px;">
              Kalibrasyon Bilgileri / Calibration Information
            </h3>
            <p style="margin: 0; font-size: 11px; line-height: 1.6; text-align: justify;">
              Yukarıda listelenen tüm ölçüm cihazları geçerli kalibrasyon sertifikalarına sahiptir. 
              Kalibrasyonlar ulusal ve uluslararası standartlara uygun olarak gerçekleştirilmiştir.
              Cihazların doğruluk ve güvenilirlik seviyeleri test sonuçlarının geçerliliğini desteklemektedir.
              <br/><br/>
              All measuring devices listed above have valid calibration certificates. 
              Calibrations have been carried out in accordance with national and international standards.
              The accuracy and reliability levels of the devices support the validity of the test results.
            </p>
          </div>
        ` : ''}
      </div>

      ${generatePageFooter()}
    </div>
  `
}

function generateSZUTESTSummaryPage(reportData: HvacReportData): string {
  // Calculate overall compliance based on selected tests only
  let totalTests = 0
  let passedTests = 0
  
  reportData.rooms.forEach(room => {
    const tests = room.tests || {} as any
    const selectedTests = room.selectedTests || []
    
    // Only count selected tests
    if (selectedTests.includes('airflowData') && tests.airflowData) {
      totalTests++
      if (tests.airflowData.meetsCriteria) passedTests++
    }
    if (selectedTests.includes('pressureDifference') && tests.pressureDifference) {
      totalTests++
      if (tests.pressureDifference.meetsCriteria) passedTests++
    }
    if (selectedTests.includes('airFlowDirection') && tests.airFlowDirection) {
      totalTests++
      if (tests.airFlowDirection.result === 'UYGUNDUR') passedTests++
    }
    if (selectedTests.includes('hepaLeakage') && tests.hepaLeakage) {
      totalTests++
      if (tests.hepaLeakage.meetsCriteria) passedTests++
    }
    if (selectedTests.includes('particleCount') && tests.particleCount) {
      totalTests++
      if (tests.particleCount.meetsCriteria) passedTests++
    }
    if (selectedTests.includes('recoveryTime') && tests.recoveryTime) {
      totalTests++
      if (tests.recoveryTime.meetsCriteria) passedTests++
    }
    if (selectedTests.includes('temperatureHumidity') && tests.temperatureHumidity) {
      totalTests++
      if (tests.temperatureHumidity.meetsCriteria) passedTests++
    }
    if (selectedTests.includes('noiseLevel') && tests.noiseLevel) {
      totalTests++
      if (tests.noiseLevel.meetsCriteria) passedTests++
    }
  })
  
  const complianceRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
  const overallStatus = complianceRate >= 80 ? 'BAŞARILI' : 'BAŞARISIZ'
  const statusColor = complianceRate >= 80 ? '#059669' : '#dc2626'

  return `
    <div style="height: 100%; font-family: Arial, sans-serif; font-size: 12px;">
      ${generateSubsequentPageHeader(reportData.rooms.length + 5, reportData)}

      <!-- Content -->
      <div style="margin: 16px 0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-weight: bold; font-size: 18px; margin: 0;">
            6. DEĞERLENDİRME
          </h1>
        </div>
        
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 14px; margin-bottom: 12px; border-bottom: 2px solid #2563eb; padding-bottom: 4px;">
            6.1 Genel Değerlendirme
          </h2>
          <div style="background: #f9f9f9; padding: 16px; border-left: 4px solid ${statusColor}; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 style="color: ${statusColor}; margin: 0 0 8px 0; font-size: 16px;">Test Sonucu: ${overallStatus}</h3>
                <p style="margin: 0; font-size: 12px;">
                  Toplam ${totalTests} test gerçekleştirilmiş, ${passedTests} tanesi başarılı olmuştur.
                </p>
              </div>
              <div style="text-align: center;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: ${statusColor}; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                  <span style="font-size: 20px; font-weight: bold;">${complianceRate}%</span>
                  <span style="font-size: 10px;">Uygunluk</span>
                </div>
              </div>
            </div>
          </div>
          
          <p style="font-size: 12px; line-height: 1.6; text-align: justify;">
            ${reportData.reportInfo.hospitalName} tesisinde ${reportData.rooms.length} adet mahal için gerçekleştirilen 
            HVAC performans niteleme testleri ${reportData.reportInfo.measurementDate} tarihinde tamamlanmıştır. 
            Testler ISO 14644-1 ve ISO 14644-3 standartlarına uygun olarak gerçekleştirilmiştir.
          </p>
        </div>

        <div style="display: flex; justify-content: space-around; margin-top: 40px; border-top: 2px solid #ddd; padding-top: 24px;">
          <div style="text-align: center;">
            <p style="font-weight: bold; margin-bottom: 40px;">Raporu Hazırlayan<br/>Prepared by</p>
            <div style="border-bottom: 1px solid #000; width: 150px; margin: 0 auto 8px;"></div>
            <p style="font-size: 12px; margin: 0;">${reportData.reportInfo.testerName}</p>
            <p style="font-size: 10px; margin: 4px 0 0 0; color: #666;">İmza ve Tarih</p>
          </div>
          <div style="text-align: center;">
            <p style="font-weight: bold; margin-bottom: 40px;">Laboratuvar Müdürü<br/>Head of test laboratory</p>
            <div style="border-bottom: 1px solid #000; width: 150px; margin: 0 auto 8px;"></div>
            <p style="font-size: 12px; margin: 0;">${reportData.reportInfo.approvedBy}</p>
            <p style="font-size: 10px; margin: 4px 0 0 0; color: #666;">İmza ve Tarih</p>
          </div>
        </div>
      </div>

      ${generatePageFooter()}
    </div>
  `
}