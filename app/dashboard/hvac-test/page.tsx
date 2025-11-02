"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HvacTestInput } from "@/components/hvac-test-input"
import { Room, HvacReportData, HvacReportInfo, TestMode, FlowType, RoomClass } from "@/lib/hvac-types"
import { updateRoomSelectedTests, validateReportData } from "@/lib/hvac-form-data-manager"
import { generateBasicPDF } from "@/lib/basic-pdf-generator"
import { generateDebugPDF } from "@/lib/debug-pdf-generator"

export default function HvacTestPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  const [reportInfo, setReportInfo] = useState<HvacReportInfo>({
    hospitalName: "Test Hastanesi",
    reportNumber: "TEST-001",
    measurementDate: new Date().toISOString().split('T')[0],
    testerName: "Test Uzmanı",
    reportPreparedBy: "Rapor Hazırlayıcı",
    approvedBy: "Onaylayan",
    organizationName: "BC Laboratuvarı"
  })

  const [rooms, setRooms] = useState<Room[]>([
    {
      id: 'test-room-1',
      roomNo: '001',
      roomName: 'Test Odası 1',
      surfaceArea: 25,
      height: 3,
      volume: 75,
      testMode: TestMode.AtRest,
      flowType: FlowType.Turbulence,
      roomClass: RoomClass.ClassII,
      selectedTests: ['pressureDifference', 'hepaLeakage', 'particleCount'],
      testCounts: {},
      testInstances: [],
      tests: {}
    }
  ])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B5AA3]"></div>
      </div>
    )
  }

  const handleTestSelection = (roomId: string, testType: string, selected: boolean) => {
    const room = rooms.find(r => r.id === roomId)
    if (!room) return

    const currentTests = room.selectedTests || []
    let updatedTests: string[]

    if (selected) {
      updatedTests = [...currentTests, testType]
    } else {
      updatedTests = currentTests.filter(t => t !== testType)
    }

    const updatedRooms = updateRoomSelectedTests(rooms, roomId, updatedTests)
    setRooms(updatedRooms)
  }

  const handleGeneratePDF = async () => {
    try {
      const reportData: HvacReportData = {
        id: 'test-report',
        reportInfo,
        rooms,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const validation = validateReportData(reportData)
      if (!validation.isValid) {
        alert('Hata: ' + validation.errors.join(', '))
        return
      }

      await generateBasicPDF(reportData)
      alert('PDF başarıyla oluşturuldu!')
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('PDF oluşturma hatası: ' + (error as Error).message)
    }
  }

  const handleGenerateDebugPDF = async () => {
    try {
      const reportData: HvacReportData = {
        id: 'test-report',
        reportInfo,
        rooms,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await generateDebugPDF(reportData)
      alert('Debug PDF oluşturuldu!')
    } catch (error) {
      console.error('Debug PDF generation error:', error)
      alert('Debug PDF oluşturma hatası: ' + (error as Error).message)
    }
  }

  const availableTests = [
    { key: 'airflowData', name: 'Hava Debisi' },
    { key: 'pressureDifference', name: 'Basınç Farkı' },
    { key: 'airFlowDirection', name: 'Hava Akış Yönü' },
    { key: 'hepaLeakage', name: 'HEPA Sızdırmazlık' },
    { key: 'particleCount', name: 'Partikül Sayısı' },
    { key: 'recoveryTime', name: 'Recovery Time' },
    { key: 'temperatureHumidity', name: 'Sıcaklık & Nem' },
    { key: 'noiseLevel', name: 'Gürültü Seviyesi' }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HVAC Test Sistemi</h2>
          <p className="text-gray-600 mt-1">Kullanıcı verilerini test edin</p>
        </div>

        {/* Report Info */}
        <Card>
          <CardHeader>
            <CardTitle>Rapor Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Hastane Adı</Label>
                <Input
                  value={reportInfo.hospitalName}
                  onChange={(e) => setReportInfo({...reportInfo, hospitalName: e.target.value})}
                />
              </div>
              <div>
                <Label>Rapor Numarası</Label>
                <Input
                  value={reportInfo.reportNumber}
                  onChange={(e) => setReportInfo({...reportInfo, reportNumber: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Test Seçimi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availableTests.map(test => (
                <div key={test.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={test.key}
                    checked={rooms[0]?.selectedTests?.includes(test.key) || false}
                    onChange={(e) => handleTestSelection('test-room-1', test.key, e.target.checked)}
                  />
                  <label htmlFor={test.key} className="text-sm">{test.name}</label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Input */}
        <HvacTestInput rooms={rooms} onRoomsUpdate={setRooms} />

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={handleGeneratePDF} className="bg-[#0B5AA3] hover:bg-[#094a8a]">
            PDF Oluştur
          </Button>
          <Button onClick={handleGenerateDebugPDF} variant="outline">
            🐛 Debug PDF
          </Button>
        </div>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(rooms[0]?.tests, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}