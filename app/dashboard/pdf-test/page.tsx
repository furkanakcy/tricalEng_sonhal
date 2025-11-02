'use client'

import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/dashboard-layout'
import { PDFTestComponent } from '@/components/pdf-test-component'

export default function PDFTestPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B5AA3]"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PDF Generator Test</h2>
          <p className="text-gray-600 mt-1">Gelişmiş PDF generator sistemini test edin</p>
        </div>
        
        <PDFTestComponent />
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">SZUTEST Profesyonel Format</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• ReportTemplate.tsx'den esinlenerek geliştirilmiş tam uyumlu format</li>
            <li>• SZUTEST laboratuvar standartlarına uygun header ve footer</li>
            <li>• TÜRKAK akreditasyon logosu ve bilgileri</li>
            <li>• Profesyonel tablo düzenleri ve sayfa numaralandırması</li>
            <li>• İçindekiler, genel bilgiler, test sonuçları ve değerlendirme sayfaları</li>
          </ul>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Özellikler</h3>
          <ul className="text-green-800 space-y-1 text-sm">
            <li>• Laboratuvar kalitesinde profesyonel görünüm</li>
            <li>• Otomatik sayfa numaralandırması ve içindekiler</li>
            <li>• Test sonuçlarına göre renkli durum göstergeleri</li>
            <li>• İmza alanları ve resmi footer bilgileri</li>
            <li>• HTML2Canvas ile yüksek kaliteli PDF çıktısı</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}