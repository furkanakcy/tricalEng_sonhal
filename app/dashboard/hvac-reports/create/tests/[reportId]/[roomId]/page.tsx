"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { HvacReportData, Room, TestsData } from "@/lib/hvac-types"

export default function TestEntryForm() {
  const router = useRouter()
  const params = useParams()
  const reportId = params.reportId as string
  const roomId = params.roomId as string
  
  const [report, setReport] = useState<HvacReportData | null>(null)
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [testsData, setTestsData] = useState<TestsData | null>(null)
  const [selectedTests, setSelectedTests] = useState<string[]>([
    'airflowData', 'pressureDifference', 'airFlowDirection', 'hepaLeakage', 'particleCount', 'recoveryTime', 'temperatureHumidity', 'noiseLevel'
  ])
  const [showTestSelection, setShowTestSelection] = useState(true)
  
  // Available test options for selection
  const availableTests = [
    { key: 'airflowData', label: 'Hava Debisi Testi' },
    { key: 'pressureDifference', label: 'Basınç Farkı Testi' },
    { key: 'airFlowDirection', label: 'Hava Akış Yönü Testi' },
    { key: 'hepaLeakage', label: 'HEPA Sızdırmazlık Testi' },
    { key: 'particleCount', label: 'Partikül Sayısı Testi' },
    { key: 'recoveryTime', label: 'Kurtarma Süresi Testi' },
    { key: 'temperatureHumidity', label: 'Sıcaklık ve Nem Testi' },
    { key: 'noiseLevel', label: 'İç Ortam Gürültü Ölçümü' }
  ]
  
  useEffect(() => {
    // Clear localStorage to remove any cached test data
    // Comment out the clear for now to preserve existing data
    // localStorage.removeItem('hvac-reports')
    
    // Load the report data
    const savedReports = localStorage.getItem('hvac-reports')
    if (savedReports) {
      const reports: HvacReportData[] = JSON.parse(savedReports)
      const foundReport = reports.find(r => r.id === reportId)
      if (foundReport) {
        setReport(foundReport)
        const room = foundReport.rooms.find(r => r.id === roomId)
        if (room) {
          setCurrentRoom(room)
          setTestsData(room.tests || {})
          
          // Fixed logic: Check if tests object exists and has any properties
          if (room.tests && Object.keys(room.tests).length > 0) {
            // Check if any test has actual data (not just empty objects)
            const selected: string[] = []
            Object.keys(room.tests).forEach(key => {
              const testData = room.tests && room.tests[key as keyof TestsData]
              if (testData && Object.keys(testData).length > 0) {
                selected.push(key)
              }
            })
            
            if (selected.length > 0) {
              setSelectedTests(selected)
              setShowTestSelection(false)
            }
          }
        }
      }
    }
  }, [reportId, roomId])
  
  if (!report || !currentRoom || !testsData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B5AA3]"></div>
        </div>
      </DashboardLayout>
    )
  }
  
  const handleTestSelectionChange = (testKey: string, checked: boolean) => {
    if (checked) {
      setSelectedTests(prev => [...prev, testKey])
    } else {
      setSelectedTests(prev => prev.filter(key => key !== testKey))
    }
  }

  const handleTestDataChange = (category: keyof TestsData, field: string, value: any) => {
    if (!testsData) return
    
    const updatedTests = {
      ...testsData,
      [category]: {
        ...testsData[category],
        [field]: value
      }
    }
    setTestsData(updatedTests)
  }
  
  const handleSubmit = () => {
    // Initialize only the selected tests
    const initializedTests: Partial<TestsData> = {}
    selectedTests.forEach(testKey => {
      ;(initializedTests as any)[testKey] = testsData?.[testKey as keyof TestsData] || {}
    })
  
      // Update the report in localStorage with the new test data
      const savedReports = localStorage.getItem('hvac-reports')
      if (savedReports) {
        const reports: HvacReportData[] = JSON.parse(savedReports)
        const reportIndex = reports.findIndex(r => r.id === reportId)
        
        if (reportIndex !== -1) {
          const roomIndex = reports[reportIndex].rooms.findIndex(r => r.id === roomId)
          if (roomIndex !== -1) {
            reports[reportIndex].rooms[roomIndex].tests = initializedTests
            reports[reportIndex].updatedAt = new Date().toISOString()
            localStorage.setItem('hvac-reports', JSON.stringify(reports))
          }
        }
      }
      
      // Navigate to next room or back to report list
      const currentRoomIndex = report.rooms.findIndex(r => r.id === roomId)
      const nextRoom = report.rooms[currentRoomIndex + 1]
      
      if (nextRoom) {
        router.push(`/dashboard/hvac-reports/create/tests/${reportId}/${nextRoom.id}`)
      } else {
        router.push(`/dashboard/hvac-reports`)
      }
    }
  
    const startTestEntry = () => {
      setShowTestSelection(false)
    }
    
    const clearAllTests = () => {
      setSelectedTests([])
    }
    
    const selectAllTests = () => {
      setSelectedTests(availableTests.map(test => test.key))
    }
  
  // Test seçimi ekranı
  if (showTestSelection) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentRoom.roomName} - Test Seçimi</h2>
            <p className="text-gray-600 mt-1">Oda numarası: {currentRoom.roomNo} - Sınıf: {currentRoom.roomClass}</p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Yapılacak Testleri Seçin</CardTitle>
              <div className="flex gap-2">
                <Button onClick={selectAllTests} variant="outline" size="sm">
                  Tümünü Seç
                </Button>
                <Button onClick={clearAllTests} variant="outline" size="sm">
                  Tümünü Temizle
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">HVAC performans değerlendirmesi için hangi testleri yapmak istiyorsunuz? Seçtiğiniz testlerin sadece veri girişleri yapılacak ve raporda gösterilecektir.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTests.map((test) => (
                  <div key={test.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={test.key}
                      checked={selectedTests.includes(test.key)}
                      onCheckedChange={(checked) => handleTestSelectionChange(test.key, checked as boolean)}
                    />
                    <Label htmlFor={test.key}>{test.label}</Label>
                  </div>
                ))}
              </div>

              {selectedTests.length === 0 && (
                <p className="text-red-600 font-medium">Lütfen en az bir test seçin.</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/hvac-reports/create/rooms/${reportId}`)}
            >
              Geri
            </Button>
            <Button
              type="button"
              onClick={startTestEntry}
              disabled={selectedTests.length === 0}
              className="bg-[#0B5AA3] hover:bg-[#094a8a]"
            >
              Test Girişine Başla
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Test verisi giriş ekranı
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentRoom.roomName} - Test Girişi</h2>
            <p className="text-gray-600 mt-1">Oda numarası: {currentRoom.roomNo} - Sınıf: {currentRoom.roomClass}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTestSelection(true)}
          >
            Test Seçimini Değiştir
          </Button>
        </div>
        
        <Tabs defaultValue={selectedTests[0]} className="space-y-4">
          <TabsList className={`grid w-full ${selectedTests.length <= 3 ? 'grid-cols-3' : selectedTests.length <= 5 ? 'grid-cols-5' : 'grid-cols-8'}`}>
            {selectedTests.includes('airflowData') && <TabsTrigger value="airflowData">Hava Debisi</TabsTrigger>}
            {selectedTests.includes('pressureDifference') && <TabsTrigger value="pressure">Basınç Farkı</TabsTrigger>}
            {selectedTests.includes('airFlowDirection') && <TabsTrigger value="direction">Akış Yönü</TabsTrigger>}
            {selectedTests.includes('hepaLeakage') && <TabsTrigger value="hepa">HEPA Test</TabsTrigger>}
            {selectedTests.includes('particleCount') && <TabsTrigger value="particle">Partikül</TabsTrigger>}
            {selectedTests.includes('recoveryTime') && <TabsTrigger value="recovery">Kurtarma</TabsTrigger>}
            {selectedTests.includes('temperatureHumidity') && <TabsTrigger value="climate">Sıcaklık/Nem</TabsTrigger>}
            {selectedTests.includes('noiseLevel') && <TabsTrigger value="noise">Gürültü</TabsTrigger>}
          </TabsList>
          
          {selectedTests.includes('airflowData') && (
            <TabsContent value="airflowData">
              <Card>
                <CardHeader>
                  <CardTitle>Hava Debisi ve Hava Değişim Oranı</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Hız (m/s)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={testsData?.airflowData?.speed || ''}
                        onChange={(e) => handleTestDataChange('airflowData', 'speed', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Filtre X Boyutu (mm)</Label>
                      <Input
                        type="number"
                        value={testsData?.airflowData?.filterDimensionX || ''}
                        onChange={(e) => handleTestDataChange('airflowData', 'filterDimensionX', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Filtre Y Boyutu (mm)</Label>
                      <Input
                        type="number"
                        value={testsData?.airflowData?.filterDimensionY || ''}
                        onChange={(e) => handleTestDataChange('airflowData', 'filterDimensionY', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Debi (m³/h)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={testsData?.airflowData?.flowRate || ''}
                        onChange={(e) => handleTestDataChange('airflowData', 'flowRate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {selectedTests.includes('pressureDifference') && (
            <TabsContent value="pressure">
              <Card>
                <CardHeader>
                  <CardTitle>Basınç Farkı</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Basınç (Pa)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={testsData?.pressureDifference?.pressure || ''}
                        onChange={(e) => handleTestDataChange('pressureDifference', 'pressure', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Referans Alan</Label>
                      <Input
                        value={testsData?.pressureDifference?.referenceArea || ''}
                        onChange={(e) => handleTestDataChange('pressureDifference', 'referenceArea', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {selectedTests.includes('airFlowDirection') && (
            <TabsContent value="direction">
              <Card>
                <CardHeader>
                  <CardTitle>Hava Akış Yönü</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Akış Yönü</Label>
                      <Select
                        value={testsData?.airFlowDirection?.direction || ''}
                        onValueChange={(value) => handleTestDataChange('airFlowDirection', 'direction', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Temiz→Kirli">Temiz → Kirli</SelectItem>
                          <SelectItem value="Kirli→Temiz">Kirli → Temiz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Sonuç</Label>
                      <Select
                        value={testsData?.airFlowDirection?.result || ''}
                        onValueChange={(value) => handleTestDataChange('airFlowDirection', 'result', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UYGUNDUR">UYGUNDUR</SelectItem>
                          <SelectItem value="UYGUN DEĞİLDİR">UYGUN DEĞİLDİR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {selectedTests.includes('hepaLeakage') && (
            <TabsContent value="hepa">
              <Card>
                <CardHeader>
                  <CardTitle>HEPA Filtre Sızdırmazlık Testi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Maksimum Sızıntı (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={testsData?.hepaLeakage?.maxLeakage || ''}
                        onChange={(e) => handleTestDataChange('hepaLeakage', 'maxLeakage', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Gerçekleşen Sızıntı (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={testsData?.hepaLeakage?.actualLeakage || ''}
                        onChange={(e) => handleTestDataChange('hepaLeakage', 'actualLeakage', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {selectedTests.includes('particleCount') && (
            <TabsContent value="particle">
              <Card>
                <CardHeader>
                  <CardTitle>Partikül Sayısı ve Temizlik Sınıfı</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>0.5 µm Partikül Sayısı</Label>
                      <Input
                        type="number"
                        value={testsData?.particleCount?.particle05 || ''}
                        onChange={(e) => handleTestDataChange('particleCount', 'particle05', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>5.0 µm Partikül Sayısı</Label>
                      <Input
                        type="number"
                        value={testsData?.particleCount?.particle5 || ''}
                        onChange={(e) => handleTestDataChange('particleCount', 'particle5', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>ISO Sınıfı</Label>
                      <Input
                        value={testsData?.particleCount?.isoClass || ''}
                        onChange={(e) => handleTestDataChange('particleCount', 'isoClass', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {selectedTests.includes('recoveryTime') && (
            <TabsContent value="recovery">
              <Card>
                <CardHeader>
                  <CardTitle>Kurtarma / Geri Kazanım Süresi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Süre (dk)</Label>
                      <Input
                        type="number"
                        value={testsData?.recoveryTime?.duration || ''}
                        onChange={(e) => handleTestDataChange('recoveryTime', 'duration', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Kriter</Label>
                      <Input
                        value={testsData?.recoveryTime?.criteria || ''}
                        onChange={(e) => handleTestDataChange('recoveryTime', 'criteria', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {selectedTests.includes('temperatureHumidity') && (
            <TabsContent value="climate">
              <Card>
                <CardHeader>
                  <CardTitle>Sıcaklık ve Nem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sıcaklık (°C)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={testsData?.temperatureHumidity?.temperature || ''}
                        onChange={(e) => handleTestDataChange('temperatureHumidity', 'temperature', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Nem (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={testsData?.temperatureHumidity?.humidity || ''}
                        onChange={(e) => handleTestDataChange('temperatureHumidity', 'humidity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {selectedTests.includes('noiseLevel') && (
            <TabsContent value="noise">
              <Card>
                <CardHeader>
                  <CardTitle>İç Ortam Gürültü Ölçümü</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Leq (dBA)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={testsData?.noiseLevel?.leq || ''}
                        onChange={(e) => handleTestDataChange('noiseLevel', 'leq', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Arka Plan Gürültüsü (dBA)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={testsData?.noiseLevel?.backgroundNoise || ''}
                        onChange={(e) => handleTestDataChange('noiseLevel', 'backgroundNoise', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Ölçüm Süresi (dk)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={testsData?.noiseLevel?.duration || ''}
                        onChange={(e) => handleTestDataChange('noiseLevel', 'duration', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Ölçüm Noktası</Label>
                      <Input
                        value={testsData?.noiseLevel?.location || ''}
                        onChange={(e) => handleTestDataChange('noiseLevel', 'location', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Frekans (Hz)</Label>
                      <Input
                        value={testsData?.noiseLevel?.frequency || ''}
                        onChange={(e) => handleTestDataChange('noiseLevel', 'frequency', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Kriter</Label>
                      <Input
                        value={testsData?.noiseLevel?.criteria || ''}
                        onChange={(e) => handleTestDataChange('noiseLevel', 'criteria', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Kriter Karşılanıyor mu?</Label>
                    <Select
                      value={testsData?.noiseLevel?.meetsCriteria ? 'true' : 'false'}
                      onValueChange={(value) => handleTestDataChange('noiseLevel', 'meetsCriteria', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">UYGUNDUR</SelectItem>
                        <SelectItem value="false">UYGUN DEĞİLDİR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
        
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTestSelection(true)}
          >
            Test Seçimine Geri Dön
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-[#0B5AA3] hover:bg-[#094a8a]"
          >
            {report.rooms.findIndex(r => r.id === roomId) < report.rooms.length - 1 ? 'Sonraki Oda' : 'Tamamla'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}