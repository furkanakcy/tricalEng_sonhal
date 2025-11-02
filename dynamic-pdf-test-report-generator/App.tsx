import React, { useState, useCallback, useRef } from 'react';
import { ReportData } from './types';
import ReportForm from './components/ReportForm';
import ReportTemplate from './components/ReportTemplate';

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const initialReportData: ReportData = {
  customerName: "MORZON TEKNOLOJİ A.Ş",
  customerAddress: "EYÜP SULTAN MAH. CAMİLİ SOKAK NO:2 SANCAKTEPE İSTANBUL/TÜRKİYE",
  orderNo: "İÇ-210606",
  ministryAuthNo: "159",
  testItemName: "İç Ortam Gürültü Ölçümü",
  receiptDate: "-",
  remarks: "Bu raporda verilen ölçüm sonuçları sadece deneyi yapılan numuneye ve proses koşullarına aittir.",
  testDate: "02.12.2021",
  reportNo: "İÇ2112-42İH-1",
  totalPages: 6,
  publishDate: "09.12.2021",
  personInCharge: "Deniz PARLAK",
  labManager: "Sedat ANIK",
  measurementCount: "2 Ölçüm Noktası",
  measurementAddress: "EYÜP SULTAN MAH. CAMİLİ SOKAK NO:2 SANCAKTEPE İSTANBUL/TÜRKİYE",
  measurementMethod: "TS ISO 1996-2",
  measurementType: "İç Ortam Gürültü Ölçümü",
  measurementExecutor: "Deniz PARLAK",
  reportReviewer: "Sedat ANIK",
  devices: [
    { id: "1", name: "Ses Seviyesi Ölçer", brand: "Cesva", model: "SC310", serial: "T244743" },
    { id: "2", name: "Akustik Kalibratör", brand: "Delta Ohm", model: "HD9101", serial: "08025240" },
    { id: "3", name: "Hava Hızı Ölçer", brand: "Kestrel", model: "3500", serial: "2038455" },
    { id: "4", name: "Hava Hızı Ölçer", brand: "Kestrel", model: "3500", serial: "20384730" },
  ],
  envConditions: {
    temperature: "25,6 °C",
    humidity: "38,2 %RH",
    pressure: "1001,6 hPa",
  },
  calibrations: [
    { id: "1", deviceName: "Akustik Kalibratör", serial: "Delta Ohm", refValue: "94", beforeValue: "94,1", afterValue: "94,1" }
  ],
  measurementPoints: [
    { id: "1", location: "HVF Tavan Tipi Hava Temizleme Cihazı (Maksimumda Çalışırken)", personnel: "-" },
    { id: "2", location: "HVF Tavan Tipi Hava Temizleme Cihazı (Sessiz Modda Çalışırken)", personnel: "-" },
  ],
  measurementResults: [
    { id: 1, location: "HVF Tavan Tipi Hava Temizleme Cihazı (Maksimumda Çalışırken)", duration: "15", leq: "64,9", background: "50,6" },
    { id: 2, location: "HVF Tavan Tipi Hava Temizleme Cihazı (Sessiz Modda Çalışırken)", duration: "15", leq: "48,4", background: "46,3" },
  ],
  preparedBy: "Feyza YÜKSEL"
};

const App: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>(initialReportData);
  const [loading, setLoading] = useState(false);
  const reportPreviewRef = useRef<HTMLDivElement>(null);

  const handleDataChange = useCallback((data: ReportData) => {
    setReportData(data);
  }, []);

  const handleGeneratePdf = async () => {
    setLoading(true);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true,
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const reportPreviewEl = reportPreviewRef.current;
    const reportContainer = document.getElementById('report-container');
    
    if (reportPreviewEl && reportContainer) {
      const originalScrollTop = reportPreviewEl.scrollTop;
      const pages = reportContainer.querySelectorAll('.report-page-a4') as NodeListOf<HTMLElement>;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        // Scroll the container so the current page is at the top
        reportPreviewEl.scrollTop = page.offsetTop - reportContainer.offsetTop;
        
        // Wait for repaint to ensure content is visible
        await new Promise(resolve => setTimeout(resolve, 400));

        try {
          const canvas = await window.html2canvas(page, {
            scale: 2, // Reduced scale from 4 to 2 to prevent rendering issues with text
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          });
          const imgData = canvas.toDataURL('image/png', 1.0);
          
          if (i > 0) {
            pdf.addPage();
          }
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        } catch (error) {
          console.error(`Error rendering page ${i+1}:`, error);
          alert(`Failed to render page ${i+1}. Check the console for details.`);
        }
      }
      pdf.save(`Report_${reportData.reportNo}.pdf`);
      reportPreviewEl.scrollTop = originalScrollTop; // Restore scroll position
    } else {
        alert("Report preview area not found. Cannot generate PDF.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <h1 className="text-2xl font-bold text-gray-800">Dynamic PDF Test Report Generator</h1>
                <button
                  onClick={handleGeneratePdf}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate PDF'
                  )}
                </button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg h-[calc(100vh-120px)] overflow-y-auto">
            <ReportForm data={reportData} onDataChange={handleDataChange} />
          </div>

          <div ref={reportPreviewRef} className="lg:col-span-2 h-[calc(100vh-120px)] overflow-y-auto">
            <div id="report-container" className="bg-gray-500 p-8 flex flex-col items-center gap-8">
              <ReportTemplate data={reportData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;