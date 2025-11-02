"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { PlusIcon, TrashIcon } from "@/components/icons"
import { HvacReportData, Room, HvacReportInfo, TestMode, FlowType, RoomClass, TestInstance } from "@/lib/hvac-types"
import { getDevicesFromStorage, Device } from "@/lib/mock-data"
import {
  calculateAirFlowRate,
  calculateAirChangeRate,
  calculateRoomVolume,
  calculateParticleAverage,
  determineISOClass,
  meetsISOStandard,
  validatePressureDifference,
  validateHepaLeakage,
  validateRecoveryTime,
  validateTemperature,
  validateHumidity
} from "@/lib/hvac-calculations"

const reportInfoSchema = z.object({
  hospitalName: z.string().min(1, "Hastane adı gerekli"),
  reportNumber: z.string().min(1, "Rapor numarası gerekli"),
  measurementDate: z.string().min(1, "Ölçüm tarihi gerekli"),
  testerName: z.string().min(1, "Test eden kişi gerekli"),
  reportPreparedBy: z.string().min(1, "Raporu hazırlayan gerekli"),
  approvedBy: z.string().min(1, "Onaylayan gerekli"),
  organizationName: z.string().min(1, "Kuruluş adı gerekli"),
})

interface HvacReportFormProps {
  onSave: (reportData: HvacReportData) => void
}

export function HvacReportForm({ onSave }: HvacReportFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [reportInfo, setReportInfo] = useState<HvacReportInfo>({
    hospitalName: "",
    reportNumber: "",
    measurementDate: "",
    testerName: "",
    reportPreparedBy: "",
    approvedBy: "",
    organizationName: "BC Laboratuvarı"
  })
  const [rooms, setRooms] = useState<Room[]>([])
  const [devices, setDevices] = useState<Device[]>([])

  // Load devices on component mount
  useEffect(() => {
    const loadedDevices = getDevicesFromStorage()
    setDevices(loadedDevices.filter(device => device.status === 'active'))
  }, [])

  const {
    register: registerInfo,
    handleSubmit: handleSubmitInfo,
    formState: { errors: infoErrors }
  } = useForm<HvacReportInfo>({
    resolver: zodResolver(reportInfoSchema),
    defaultValues: reportInfo
  })

  const steps = [
    { id: 0, title: "Genel Bilgiler", description: "Rapor ve kuruluş bilgileri" },
    { id: 1, title: "Mahal Listesi", description: "Test edilecek odalar" },
    { id: 2, title: "Test Seçimi", description: "Her oda için yapılacak testler" },
    { id: 3, title: "Test Verileri", description: "Seçilen testlerin verilerini girin" },
    { id: 4, title: "Önizleme", description: "Rapor kontrolü ve indirme" }
  ]

  const addRoom = () => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      roomNo: "",
      roomName: "",
      surfaceArea: 0,
      height: 0,
      volume: 0,
      testMode: TestMode.AtRest,
      flowType: FlowType.Turbulence,
      roomClass: RoomClass.ClassII,
      selectedTests: [],
      testCounts: {},
      testInstances: [],
      tests: {
        airflowData: {
          speed: 0,
          filterDimensionX: 0,
          filterDimensionY: 0,
          flowRate: 0,
          totalFlowRate: 0,
          airChangeRate: 0,
          meetsCriteria: false,
          criteria: ''
        },
        pressureDifference: {
          pressure: 0,
          referenceArea: "",
          meetsCriteria: false,
          criteria: '≥ 6 Pa'
        },
        airFlowDirection: {
          direction: "Temiz→Kirli",
          result: "UYGUNDUR",
          observation: ""
        },
        hepaLeakage: {
          maxLeakage: 0,
          actualLeakage: 0,
          meetsCriteria: false,
          criteria: '≤ %0.01'
        },
        particleCount: {
          particle05: 0,
          particle5: 0,
          particles05um: [],
          average: 0,
          isoClass: "",
          meetsCriteria: false
        },
        recoveryTime: {
          duration: 0,
          meetsCriteria: false,
          criteria: '≤ 25 dk'
        },
        temperatureHumidity: {
          temperature: 0,
          humidity: 0,
          meetsCriteria: false,
          criteria: '20-24°C, 40-60%'
        }
      }
    }

    try {
      setRooms([...rooms, newRoom])
    } catch (error) {
      console.error('Error adding room:', error)
      alert('Oda eklenirken bir hata oluştu.')
    }
  }

  const generateTestInstances = (room: Room) => {
    const instances: TestInstance[] = []

    room.selectedTests.forEach(testType => {
      const count = room.testCounts[testType] || 1
      for (let i = 0; i < count; i++) {
        instances.push({
          id: `${room.id}-${testType}-${i}`,
          testType,
          testIndex: i,
          data: getDefaultTestData(testType)
        })
      }
    })

    return instances
  }

  const getDefaultTestData = (testType: string) => {
    switch (testType) {
      case 'airflowData':
        return {
          speed: 0,
          filterDimensionX: 0,
          filterDimensionY: 0,
          flowRate: 0,
          totalFlowRate: 0,
          airChangeRate: 0,
          meetsCriteria: false,
          criteria: ''
        }
      case 'pressureDifference':
        return {
          pressure: 0,
          referenceArea: "",
          meetsCriteria: false,
          criteria: '≥ 6 Pa'
        }
      case 'airFlowDirection':
        return {
          direction: "Temiz→Kirli",
          result: "UYGUNDUR",
          observation: ""
        }
      case 'hepaLeakage':
        return {
          maxLeakage: 0,
          actualLeakage: 0,
          meetsCriteria: false,
          criteria: '≤ %0.01'
        }
      case 'particleCount':
        return {
          particle05: 0,
          particle5: 0,
          particles05um: [],
          average: 0,
          isoClass: "",
          meetsCriteria: false
        }
      case 'recoveryTime':
        return {
          duration: 0,
          meetsCriteria: false,
          criteria: '≤ 25 dk'
        }
      case 'temperatureHumidity':
        return {
          temperature: 0,
          humidity: 0,
          meetsCriteria: false,
          criteria: '20-24°C, 40-60%'
        }
      case 'noiseLevel':
        return {
          leq: 0,
          backgroundNoise: 0,
          duration: 0,
          meetsCriteria: false
        }
      default:
        return {}
    }
  }

  const removeRoom = (roomId: string) => {
    setRooms(rooms.filter(room => room.id !== roomId))
  }

  const updateRoom = (roomId: string, updates: Partial<Room>) => {
    try {
      setRooms(rooms.map(room =>
        room.id === roomId ? { ...room, ...updates } : room
      ))
    } catch (error) {
      console.error('Error updating room:', error)
      alert('Oda güncellenirken bir hata oluştu.')
    }
  }

  const updateRoomTestCount = (roomId: string, testType: string, count: number) => {
    try {
      const room = rooms.find(r => r.id === roomId)
      if (!room) return

      const updatedTestCounts = { ...room.testCounts }
      let updatedSelectedTests = [...room.selectedTests]

      if (count <= 0) {
        delete updatedTestCounts[testType]
        // Remove from selected tests if count is 0
        updatedSelectedTests = room.selectedTests.filter(t => t !== testType)
      } else {
        updatedTestCounts[testType] = count
        // Add to selected tests if not already there
        if (!room.selectedTests.includes(testType)) {
          updatedSelectedTests.push(testType)
        }
      }

      // Create test instances based on new counts
      const tempRoom = { ...room, testCounts: updatedTestCounts, selectedTests: updatedSelectedTests }
      const updatedRoom = {
        ...tempRoom,
        testInstances: generateTestInstances(tempRoom)
      }

      updateRoom(roomId, updatedRoom)
    } catch (error) {
      console.error('Error updating room test count:', error)
      alert('Test sayısı güncellenirken bir hata oluştu.')
    }
  }

  const updateTestInstanceData = (roomId: string, instanceId: string, field: string, value: any) => {
    try {
      const room = rooms.find(r => r.id === roomId)
      if (!room) return

      const updatedInstances = room.testInstances.map(instance => {
        if (instance.id === instanceId) {
          const updatedInstance = { ...instance }
          
          // Handle device selection
          if (field === 'deviceId') {
            const selectedDevice = devices.find(d => d.id === value)
            updatedInstance.deviceId = value
            updatedInstance.deviceName = selectedDevice ? `${selectedDevice.deviceName} (${selectedDevice.model})` : ''
          } else {
            updatedInstance.data = { ...updatedInstance.data, [field]: value }

            // Auto-validate based on test type and field
            if (instance.testType === 'pressureDifference' && field === 'pressure') {
              updatedInstance.data.meetsCriteria = validatePressureDifference(value)
            } else if (instance.testType === 'hepaLeakage' && field === 'actualLeakage') {
              updatedInstance.data.meetsCriteria = validateHepaLeakage(value)
            } else if (instance.testType === 'particleCount') {
              if (field === 'particles05um') {
                const average = value.length > 0 ? value.reduce((a: number, b: number) => a + b, 0) / value.length : 0
                updatedInstance.data.particle05 = average
                updatedInstance.data.average = average
                updatedInstance.data.isoClass = determineISOClass(average)
                updatedInstance.data.meetsCriteria = meetsISOStandard(average)
              } else if (field === 'particle05') {
                updatedInstance.data.isoClass = determineISOClass(value)
                updatedInstance.data.meetsCriteria = meetsISOStandard(value)
              }
            } else if (instance.testType === 'recoveryTime' && field === 'duration') {
              updatedInstance.data.meetsCriteria = validateRecoveryTime(value)
            } else if (instance.testType === 'temperatureHumidity') {
              if (field === 'temperature' || field === 'humidity') {
                const tempValue = field === 'temperature' ? value : (updatedInstance.data?.temperature || 0)
                const humidValue = field === 'humidity' ? value : (updatedInstance.data?.humidity || 0)
                const tempValid = validateTemperature(tempValue)
                const humidValid = validateHumidity(humidValue)
                updatedInstance.data.meetsCriteria = tempValid && humidValid
              }
            }
          }

          return updatedInstance
        }
        return instance
      })

      // Also update room.tests directly for immediate sync
      const updatedTests = { ...room.tests }
      const updatedInstance = updatedInstances.find(inst => inst.id === instanceId)
      if (updatedInstance && updatedInstance.testType) {
        updatedTests[updatedInstance.testType as keyof typeof updatedTests] = updatedInstance.data
      }

      updateRoom(roomId, { testInstances: updatedInstances, tests: updatedTests })
    } catch (error) {
      console.error('Error updating test instance data:', error)
      alert('Test verisi güncellenirken bir hata oluştu.')
    }
  }

  const toggleRoomTest = (roomId: string, testType: string) => {
    try {
      const room = rooms.find(r => r.id === roomId)
      if (!room) return

      const updatedTests = [...room.selectedTests]
      const testIndex = updatedTests.indexOf(testType)

      if (testIndex > -1) {
        updatedTests.splice(testIndex, 1)
      } else {
        updatedTests.push(testType)
      }

      updateRoom(roomId, { selectedTests: updatedTests })
    } catch (error) {
      console.error('Error toggling room test:', error)
      alert('Test seçimi güncellenirken bir hata oluştu.')
    }
  }

  const selectAllTestsForRoom = (roomId: string) => {
    try {
      const allTests = [
        'airflowData',
        'pressureDifference',
        'airFlowDirection',
        'hepaLeakage',
        'particleCount',
        'recoveryTime',
        'temperatureHumidity',
        'noiseLevel'
      ]
      updateRoom(roomId, { selectedTests: allTests })
    } catch (error) {
      console.error('Error selecting all tests:', error)
      alert('Tüm testler seçilirken bir hata oluştu.')
    }
  }

  const clearAllTestsForRoom = (roomId: string) => {
    try {
      updateRoom(roomId, { selectedTests: [] })
    } catch (error) {
      console.error('Error clearing all tests:', error)
      alert('Testler temizlenirken bir hata oluştu.')
    }
  }

  const updateRoomBasicInfo = (roomId: string, field: string, value: any) => {
    try {
      const room = rooms.find(r => r.id === roomId)
      if (!room) return

      const updatedRoom = { ...room, [field]: value }

      // Auto-calculate volume when area or height changes
      if (field === 'surfaceArea' || field === 'height') {
        updatedRoom.volume = calculateRoomVolume(
          updatedRoom.surfaceArea,
          updatedRoom.height
        )
      }

      updateRoom(roomId, updatedRoom)
    } catch (error) {
      console.error('Error updating room basic info:', error)
      alert('Oda bilgileri güncellenirken bir hata oluştu.')
    }
  }


  const onSubmitInfo = (data: HvacReportInfo) => {
    setReportInfo(data)
    setCurrentStep(1)
  }

  const consolidateTestData = (room: Room): Room => {
    // Convert test instances back to room.tests format
    const consolidatedTests = { ...room.tests }

    // Group test instances by test type and take the latest data for each type
    const testDataByType: { [key: string]: any } = {}

    room.testInstances.forEach(instance => {
      if (instance.testType && instance.data) {
        // For multiple instances of same test type, we could aggregate or take the latest
        // For now, let's take the latest (last) instance data
        testDataByType[instance.testType] = instance.data
      }
    })

    // Merge with existing tests
    Object.keys(testDataByType).forEach(testType => {
      consolidatedTests[testType as keyof typeof consolidatedTests] = testDataByType[testType]
    })

    return { ...room, tests: consolidatedTests }
  }

  const handleSaveReport = () => {
    try {
      // Validate required data
      if (!reportInfo.hospitalName || !reportInfo.reportNumber) {
        alert('Lütfen gerekli rapor bilgilerini doldurun.')
        return
      }

      if (rooms.length === 0) {
        alert('En az bir oda eklemelisiniz.')
        return
      }

      // Consolidate test instance data back to room.tests format
      const consolidatedRooms = rooms.map(room => consolidateTestData(room))

      const reportData: HvacReportData = {
        id: `report-${Date.now()}`,
        reportInfo,
        rooms: consolidatedRooms,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      onSave(reportData)
    } catch (error) {
      console.error('Error saving report:', error)
      alert('Rapor kaydedilirken bir hata oluştu.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= index
                ? 'bg-[#0B5AA3] border-[#0B5AA3] text-white'
                : 'border-gray-300 text-gray-500'
                }`}>
                {index + 1}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${currentStep >= index ? 'text-[#0B5AA3]' : 'text-gray-500'
                  }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${currentStep > index ? 'bg-[#0B5AA3]' : 'bg-gray-300'
                  }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Genel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitInfo(onSubmitInfo)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hospitalName">Hastane Adı</Label>
                  <Input
                    id="hospitalName"
                    {...registerInfo("hospitalName")}
                    placeholder="Örn: Nallıhan Devlet Hastanesi"
                  />
                  {infoErrors.hospitalName && (
                    <p className="text-sm text-red-600">{infoErrors.hospitalName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reportNumber">Rapor Numarası</Label>
                  <Input
                    id="reportNumber"
                    {...registerInfo("reportNumber")}
                    placeholder="Örn: V-2504-039"
                  />
                  {infoErrors.reportNumber && (
                    <p className="text-sm text-red-600">{infoErrors.reportNumber.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="measurementDate">Ölçüm Tarihi</Label>
                  <Input
                    id="measurementDate"
                    type="date"
                    {...registerInfo("measurementDate")}
                  />
                  {infoErrors.measurementDate && (
                    <p className="text-sm text-red-600">{infoErrors.measurementDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="testerName">Testi Yapan</Label>
                  <Input
                    id="testerName"
                    {...registerInfo("testerName")}
                    placeholder="Örn: Nurettin Karaca"
                  />
                  {infoErrors.testerName && (
                    <p className="text-sm text-red-600">{infoErrors.testerName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reportPreparedBy">Raporu Hazırlayan</Label>
                  <Input
                    id="reportPreparedBy"
                    {...registerInfo("reportPreparedBy")}
                    placeholder="Örn: Merve Yazır"
                  />
                  {infoErrors.reportPreparedBy && (
                    <p className="text-sm text-red-600">{infoErrors.reportPreparedBy.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="approvedBy">Onaylayan</Label>
                  <Input
                    id="approvedBy"
                    {...registerInfo("approvedBy")}
                    placeholder="Örn: Sevgi Kılınç"
                  />
                  {infoErrors.approvedBy && (
                    <p className="text-sm text-red-600">{infoErrors.approvedBy.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="organizationName">Kuruluş Adı</Label>
                  <Input
                    id="organizationName"
                    {...registerInfo("organizationName")}
                    placeholder="Örn: BC Laboratuvarı"
                  />
                  {infoErrors.organizationName && (
                    <p className="text-sm text-red-600">{infoErrors.organizationName.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-[#0B5AA3] hover:bg-[#094a8a]">
                  Devam Et
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Mahal (Oda) Listesi
              <Button onClick={addRoom} className="bg-[#0B5AA3] hover:bg-[#094a8a]">
                <PlusIcon size={16} className="mr-2" />
                Oda Ekle
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Henüz oda eklenmemiş</p>
                <Button onClick={addRoom} className="bg-[#0B5AA3] hover:bg-[#094a8a]">
                  <PlusIcon size={16} className="mr-2" />
                  İlk Odayı Ekle
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {rooms.map((room, index) => (
                  <Card key={room.id} className="border-l-4 border-l-[#0B5AA3]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Oda {index + 1}</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRoom(room.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon size={16} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Mahal No</Label>
                          <Input
                            value={room.roomNo}
                            onChange={(e) => updateRoomBasicInfo(room.id, 'roomNo', e.target.value)}
                            placeholder="Örn: 0005"
                          />
                        </div>

                        <div>
                          <Label>Mahal Adı</Label>
                          <Input
                            value={room.roomName}
                            onChange={(e) => updateRoomBasicInfo(room.id, 'roomName', e.target.value)}
                            placeholder="Örn: Steril Depo"
                          />
                        </div>

                        <div>
                          <Label>Yüzey Alanı (m²)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={room.surfaceArea}
                            onChange={(e) => updateRoomBasicInfo(room.id, 'surfaceArea', parseFloat(e.target.value) || 0)}
                            placeholder="14.00"
                          />
                        </div>

                        <div>
                          <Label>Yükseklik (m)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={room.height}
                            onChange={(e) => updateRoomBasicInfo(room.id, 'height', parseFloat(e.target.value) || 0)}
                            placeholder="3.00"
                          />
                        </div>

                        <div>
                          <Label>Hacim (m³)</Label>
                          <Input
                            value={room.volume}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>

                        <div>
                          <Label>Test Modu</Label>
                          <Select
                            value={room.testMode}
                            onValueChange={(value) => updateRoomBasicInfo(room.id, 'testMode', value as TestMode)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={TestMode.AtRest}>{TestMode.AtRest}</SelectItem>
                              <SelectItem value={TestMode.InOperation}>{TestMode.InOperation}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Akış Biçimi</Label>
                          <Select
                            value={room.flowType}
                            onValueChange={(value) => updateRoomBasicInfo(room.id, 'flowType', value as FlowType)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={FlowType.Turbulence}>{FlowType.Turbulence}</SelectItem>
                              <SelectItem value={FlowType.Laminar}>{FlowType.Laminar}</SelectItem>
                              <SelectItem value={FlowType.Unidirectional}>{FlowType.Unidirectional}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Mahal Sınıfı</Label>
                          <Select
                            value={room.roomClass}
                            onValueChange={(value) => updateRoomBasicInfo(room.id, 'roomClass', value as RoomClass)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={RoomClass.ClassIB}>{RoomClass.ClassIB}</SelectItem>
                              <SelectItem value={RoomClass.ClassII}>{RoomClass.ClassII}</SelectItem>
                              <SelectItem value={RoomClass.IntensiveCare}>{RoomClass.IntensiveCare}</SelectItem>
                              <SelectItem value={RoomClass.Other}>Diğer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(0)}
              >
                Geri
              </Button>
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={rooms.length === 0}
                className="bg-[#0B5AA3] hover:bg-[#094a8a]"
              >
                Devam Et
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Seçimi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {rooms.map((room, index) => (
                <Card key={room.id} className="border-l-4 border-l-[#0B5AA3]">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Oda {index + 1} - {room.roomName || 'İsimsiz Mahal'}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllTestsForRoom(room.id)}
                          className="text-xs"
                        >
                          Tümünü Seç
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearAllTestsForRoom(room.id)}
                          className="text-xs"
                        >
                          Tümünü Temizle
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Airflow Data Test */}
                      <div
                        className={`p-4 border rounded-lg transition-all ${room.selectedTests.includes('airflowData')
                            ? 'border-[#0B5AA3] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={room.selectedTests.includes('airflowData')}
                              onChange={() => toggleRoomTest(room.id, 'airflowData')}
                              className="rounded"
                            />
                            <div>
                              <Label className="font-medium">Hava Debisi Testi</Label>
                              <p className="text-sm text-gray-600">Akış hızı ve debisi ölçümü</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs">Adet:</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={room.testCounts['airflowData'] || 1}
                              onChange={(e) => updateRoomTestCount(room.id, 'airflowData', parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-sm"
                              disabled={!room.selectedTests.includes('airflowData')}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pressure Difference Test */}
                      <div
                        className={`p-4 border rounded-lg transition-all ${room.selectedTests.includes('pressureDifference')
                            ? 'border-[#0B5AA3] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={room.selectedTests.includes('pressureDifference')}
                              onChange={() => toggleRoomTest(room.id, 'pressureDifference')}
                              className="rounded"
                            />
                            <div>
                              <Label className="font-medium">Basınç Farkı Testi</Label>
                              <p className="text-sm text-gray-600">Oda basınç ölçümü</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs">Adet:</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={room.testCounts['pressureDifference'] || 1}
                              onChange={(e) => updateRoomTestCount(room.id, 'pressureDifference', parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-sm"
                              disabled={!room.selectedTests.includes('pressureDifference')}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Air Flow Direction Test */}
                      <div
                        className={`p-4 border rounded-lg transition-all ${room.selectedTests.includes('airFlowDirection')
                            ? 'border-[#0B5AA3] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={room.selectedTests.includes('airFlowDirection')}
                              onChange={() => toggleRoomTest(room.id, 'airFlowDirection')}
                              className="rounded"
                            />
                            <div>
                              <Label className="font-medium">Hava Akış Yönü Testi</Label>
                              <p className="text-sm text-gray-600">Akış yönü kontrolü</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs">Adet:</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={room.testCounts['airFlowDirection'] || 1}
                              onChange={(e) => updateRoomTestCount(room.id, 'airFlowDirection', parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-sm"
                              disabled={!room.selectedTests.includes('airFlowDirection')}
                            />
                          </div>
                        </div>
                      </div>

                      {/* HEPA Leakage Test */}
                      <div
                        className={`p-4 border rounded-lg transition-all ${room.selectedTests.includes('hepaLeakage')
                            ? 'border-[#0B5AA3] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={room.selectedTests.includes('hepaLeakage')}
                              onChange={() => toggleRoomTest(room.id, 'hepaLeakage')}
                              className="rounded"
                            />
                            <div>
                              <Label className="font-medium">HEPA Sızdırmazlık Testi</Label>
                              <p className="text-sm text-gray-600">HEPA filtre sızdırmazlık testi</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs">Adet:</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={room.testCounts['hepaLeakage'] || 1}
                              onChange={(e) => updateRoomTestCount(room.id, 'hepaLeakage', parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-sm"
                              disabled={!room.selectedTests.includes('hepaLeakage')}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Particle Count Test */}
                      <div
                        className={`p-4 border rounded-lg transition-all ${room.selectedTests.includes('particleCount')
                            ? 'border-[#0B5AA3] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={room.selectedTests.includes('particleCount')}
                              onChange={() => toggleRoomTest(room.id, 'particleCount')}
                              className="rounded"
                            />
                            <div>
                              <Label className="font-medium">Partikül Sayısı Testi</Label>
                              <p className="text-sm text-gray-600">0.5 µm partikül ölçümü</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs">Adet:</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={room.testCounts['particleCount'] || 1}
                              onChange={(e) => updateRoomTestCount(room.id, 'particleCount', parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-sm"
                              disabled={!room.selectedTests.includes('particleCount')}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Recovery Time Test */}
                      <div
                        className={`p-4 border rounded-lg transition-all ${room.selectedTests.includes('recoveryTime')
                            ? 'border-[#0B5AA3] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={room.selectedTests.includes('recoveryTime')}
                              onChange={() => toggleRoomTest(room.id, 'recoveryTime')}
                              className="rounded"
                            />
                            <div>
                              <Label className="font-medium">Recovery Time Testi</Label>
                              <p className="text-sm text-gray-600">Hava temizleme süresi</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs">Adet:</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={room.testCounts['recoveryTime'] || 1}
                              onChange={(e) => updateRoomTestCount(room.id, 'recoveryTime', parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-sm"
                              disabled={!room.selectedTests.includes('recoveryTime')}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Temperature & Humidity Test */}
                      <div
                        className={`p-4 border rounded-lg transition-all ${room.selectedTests.includes('temperatureHumidity')
                            ? 'border-[#0B5AA3] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={room.selectedTests.includes('temperatureHumidity')}
                              onChange={() => toggleRoomTest(room.id, 'temperatureHumidity')}
                              className="rounded"
                            />
                            <div>
                              <Label className="font-medium">Sıcaklık ve Nem Testi</Label>
                              <p className="text-sm text-gray-600">Sıcaklık ve nem kontrolü</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs">Adet:</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={room.testCounts['temperatureHumidity'] || 1}
                              onChange={(e) => updateRoomTestCount(room.id, 'temperatureHumidity', parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-sm"
                              disabled={!room.selectedTests.includes('temperatureHumidity')}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Noise Level Test */}
                      <div
                        className={`p-4 border rounded-lg transition-all ${room.selectedTests.includes('noiseLevel')
                            ? 'border-[#0B5AA3] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={room.selectedTests.includes('noiseLevel')}
                              onChange={() => toggleRoomTest(room.id, 'noiseLevel')}
                              className="rounded"
                            />
                            <div>
                              <Label className="font-medium">İç Ortam Gürültü Ölçümü</Label>
                              <p className="text-sm text-gray-600">Ortam gürültü seviyesi ölçümü</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs">Adet:</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={room.testCounts['noiseLevel'] || 1}
                              onChange={(e) => updateRoomTestCount(room.id, 'noiseLevel', parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-sm"
                              disabled={!room.selectedTests.includes('noiseLevel')}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Seçilen Testler:</span> {room.selectedTests.length} / 7
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {room.selectedTests.length === 0
                          ? 'Hiçbir test seçilmedi. Lütfen en az bir test seçin.'
                          : `Seçilen testler: ${room.selectedTests.join(', ')}`
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                Geri
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={rooms.some(room => room.selectedTests.length === 0)}
                className="bg-[#0B5AA3] hover:bg-[#094a8a]"
              >
                Test Verilerini Gir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Verileri</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={rooms[0]?.id} className="w-full">
              <TabsList className="flex w-full overflow-x-auto">
                {rooms.map((room, index) => (
                  <TabsTrigger
                    key={room.id}
                    value={room.id}
                    className="flex-shrink-0 min-w-[120px]"
                  >
                    {room.roomName || `Oda ${index + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>

              {rooms.map((room) => (
                <TabsContent key={room.id} value={room.id} className="space-y-6">
                  {room.testInstances.length > 0 ? (
                    room.testInstances.map((instance) => {
                      const getTestTitle = (testType: string) => {
                        const titles = {
                          'airflowData': 'Hava Debisi Testi',
                          'pressureDifference': 'Basınç Farkı Testi',
                          'airFlowDirection': 'Hava Akış Yönü Testi',
                          'hepaLeakage': 'HEPA Sızdırmazlık Testi',
                          'particleCount': 'Partikül Sayısı Testi',
                          'recoveryTime': 'Recovery Time Testi',
                          'temperatureHumidity': 'Sıcaklık ve Nem Testi'
                        }
                        return titles[testType as keyof typeof titles] || testType
                      }

                      const renderTestForm = (instance: TestInstance) => {
                        const { testType, testIndex, data } = instance

                        switch (testType) {
                          case 'airflowData':
                            // Calculate air change rate if room volume is available
                            const airChangeRate = room.volume > 0 ? ((data?.totalFlowRate || data?.flowRate || 0) / room.volume) : 0
                            const airChangeOK = airChangeRate >= 20

                            return (
                              <Card key={instance.id}>
                                <CardHeader>
                                  <CardTitle className="text-lg">Hava Debisi Testi - Test {testIndex + 1}</CardTitle>
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Gerekli Aralık:</strong> ≥ 20 ACH (Hava değişim oranı saatte en az 20 olmalı)
                                  </p>
                                </CardHeader>
                                <CardContent>
                                  {/* Device Selection */}
                                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Label className="text-sm font-medium text-blue-800">Kullanılan Cihaz</Label>
                                    <Select
                                      value={instance.deviceId || ''}
                                      onValueChange={(value) => updateTestInstanceData(room.id, instance.id, 'deviceId', value)}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Test için kullanılacak cihazı seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {devices.map((device) => (
                                          <SelectItem key={device.id} value={device.id}>
                                            {device.deviceName} - {device.model} ({device.serialNumber})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {instance.deviceName && (
                                      <p className="text-xs text-blue-600 mt-1">Seçilen: {instance.deviceName}</p>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div>
                                      <Label>Hız (m/s)</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={data?.speed || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'speed', parseFloat(e.target.value) || 0)}
                                        placeholder="0.3"
                                      />
                                    </div>
                                    <div>
                                      <Label>Filtre X (cm)</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={data?.filterDimensionX || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'filterDimensionX', parseFloat(e.target.value) || 0)}
                                        placeholder="30"
                                      />
                                    </div>
                                    <div>
                                      <Label>Filtre Y (cm)</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={data?.filterDimensionY || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'filterDimensionY', parseFloat(e.target.value) || 0)}
                                        placeholder="25"
                                      />
                                    </div>
                                    <div>
                                      <Label>Toplam Debi (m³/h) <span className="text-red-500">*</span></Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={data?.totalFlowRate || data?.flowRate || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'totalFlowRate', parseFloat(e.target.value) || 0)}
                                        placeholder="450"
                                        className={data?.totalFlowRate ? (airChangeOK ? 'border-green-500' : 'border-red-500') : ''}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Min: {room.volume * 20} m³/h</p>
                                    </div>
                                    <div>
                                      <Label>Sonuç</Label>
                                      <div className={`p-2 rounded text-center font-medium ${airChangeOK
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {airChangeOK ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">{airChangeRate.toFixed(1)} ACH</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )

                          case 'pressureDifference':
                            return (
                              <Card key={instance.id}>
                                <CardHeader>
                                  <CardTitle className="text-lg">Basınç Farkı Testi - Test {testIndex + 1}</CardTitle>
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Gerekli Aralık:</strong> ≥ 6.0 Pa (Pozitif basınç farkı gerekli)
                                  </p>
                                </CardHeader>
                                <CardContent>
                                  {/* Device Selection */}
                                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Label className="text-sm font-medium text-blue-800">Kullanılan Cihaz</Label>
                                    <Select
                                      value={instance.deviceId || ''}
                                      onValueChange={(value) => updateTestInstanceData(room.id, instance.id, 'deviceId', value)}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Test için kullanılacak cihazı seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {devices.map((device) => (
                                          <SelectItem key={device.id} value={device.id}>
                                            {device.deviceName} - {device.model} ({device.serialNumber})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {instance.deviceName && (
                                      <p className="text-xs text-blue-600 mt-1">Seçilen: {instance.deviceName}</p>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <Label>Basınç (Pa) <span className="text-red-500">*</span></Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        value={data?.pressure || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'pressure', parseFloat(e.target.value) || 0)}
                                        placeholder="7"
                                        className={data?.pressure ? ((data.pressure >= 6) ? 'border-green-500' : 'border-red-500') : ''}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Min: 6.0 Pa</p>
                                    </div>
                                    <div>
                                      <Label>Referans Alan</Label>
                                      <Input
                                        value={data?.referenceArea || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'referenceArea', e.target.value)}
                                        placeholder="Koridor"
                                      />
                                    </div>
                                    <div>
                                      <Label>Sonuç</Label>
                                      <div className={`p-2 rounded text-center font-medium ${(data?.pressure || 0) >= 6
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {(data?.pressure || 0) >= 6 ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )

                          case 'airFlowDirection':
                            return (
                              <Card key={instance.id}>
                                <CardHeader>
                                  <CardTitle className="text-lg">Hava Akış Yönü Testi - Test {testIndex + 1}</CardTitle>
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Gerekli Durum:</strong> Temiz alandan kirli alana doğru hava akışı (Gözlemsel test)
                                  </p>
                                </CardHeader>
                                <CardContent>
                                  {/* Device Selection */}
                                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Label className="text-sm font-medium text-blue-800">Kullanılan Cihaz</Label>
                                    <Select
                                      value={instance.deviceId || ''}
                                      onValueChange={(value) => updateTestInstanceData(room.id, instance.id, 'deviceId', value)}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Test için kullanılacak cihazı seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {devices.map((device) => (
                                          <SelectItem key={device.id} value={device.id}>
                                            {device.deviceName} - {device.model} ({device.serialNumber})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {instance.deviceName && (
                                      <p className="text-xs text-blue-600 mt-1">Seçilen: {instance.deviceName}</p>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <Label>Akış Yönü</Label>
                                      <Input
                                        value={data?.direction || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'direction', e.target.value)}
                                        placeholder="Temiz→Kirli"
                                      />
                                    </div>
                                    <div>
                                      <Label>Gözlem <span className="text-red-500">*</span></Label>
                                      <Input
                                        value={data?.observation || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'observation', e.target.value)}
                                        placeholder="Duman testi ile kontrol edildi"
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Hava akış yönünü gözlemleyin</p>
                                    </div>
                                    <div>
                                      <Label>Sonuç</Label>
                                      <div className="p-2 rounded bg-green-100 text-green-800 text-center font-medium">
                                        GEÇTİ ✓
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">Gözlemsel test</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )

                          case 'hepaLeakage':
                            return (
                              <Card key={instance.id}>
                                <CardHeader>
                                  <CardTitle className="text-lg">HEPA Sızdırmazlık Testi - Test {testIndex + 1}</CardTitle>
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Gerekli Aralık:</strong> ≤ 0.01% (Maksimum %0.01 sızıntı kabul edilir)
                                  </p>
                                </CardHeader>
                                <CardContent>
                                  {/* Device Selection */}
                                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Label className="text-sm font-medium text-blue-800">Kullanılan Cihaz</Label>
                                    <Select
                                      value={instance.deviceId || ''}
                                      onValueChange={(value) => updateTestInstanceData(room.id, instance.id, 'deviceId', value)}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Test için kullanılacak cihazı seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {devices.map((device) => (
                                          <SelectItem key={device.id} value={device.id}>
                                            {device.deviceName} - {device.model} ({device.serialNumber})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {instance.deviceName && (
                                      <p className="text-xs text-blue-600 mt-1">Seçilen: {instance.deviceName}</p>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <Label>Max Sızıntı (%)</Label>
                                      <Input
                                        type="number"
                                        step="0.001"
                                        value={data?.maxLeakage || 0.01}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'maxLeakage', parseFloat(e.target.value) || 0)}
                                        placeholder="0.01"
                                      />
                                    </div>
                                    <div>
                                      <Label>Gerçek Sızıntı (%) <span className="text-red-500">*</span></Label>
                                      <Input
                                        type="number"
                                        step="0.001"
                                        value={data?.actualLeakage || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'actualLeakage', parseFloat(e.target.value) || 0)}
                                        placeholder="0.005"
                                        className={data?.actualLeakage ? ((data.actualLeakage <= 0.01) ? 'border-green-500' : 'border-red-500') : ''}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Max: 0.01%</p>
                                    </div>
                                    <div>
                                      <Label>Sonuç</Label>
                                      <div className={`p-2 rounded text-center font-medium ${(data?.actualLeakage || 0) <= 0.01
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {(data?.actualLeakage || 0) <= 0.01 ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )

                          case 'particleCount':
                            const getISOClass = (particle05: number) => {
                              if (particle05 <= 3520) return '5'
                              if (particle05 <= 35200) return '6'
                              if (particle05 <= 352000) return '7'
                              return '8'
                            }
                            const currentClass = getISOClass(data?.average || 0)
                            const isClassAcceptable = parseInt(currentClass) <= 7

                            return (
                              <Card key={instance.id}>
                                <CardHeader>
                                  <CardTitle className="text-lg">Partikül Sayısı Testi - Test {testIndex + 1}</CardTitle>
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Gerekli Aralık:</strong> ISO Class 5-7 (≤ 352,000 partikül/m³ for 0.5μm)
                                  </p>
                                </CardHeader>
                                <CardContent>
                                  {/* Device Selection */}
                                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Label className="text-sm font-medium text-blue-800">Kullanılan Cihaz</Label>
                                    <Select
                                      value={instance.deviceId || ''}
                                      onValueChange={(value) => updateTestInstanceData(room.id, instance.id, 'deviceId', value)}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Test için kullanılacak cihazı seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {devices.map((device) => (
                                          <SelectItem key={device.id} value={device.id}>
                                            {device.deviceName} - {device.model} ({device.serialNumber})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {instance.deviceName && (
                                      <p className="text-xs text-blue-600 mt-1">Seçilen: {instance.deviceName}</p>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <div>
                                      <Label>0.5 µm Partikül Ölçümleri (virgülle ayırın) <span className="text-red-500">*</span></Label>
                                      <Input
                                        value={data?.particles05um?.join(', ') || ''}
                                        onChange={(e) => {
                                          const values = e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
                                          updateTestInstanceData(room.id, instance.id, 'particles05um', values)
                                        }}
                                        placeholder="3200, 3400, 3600, 3300"
                                        className={data?.average ? (isClassAcceptable ? 'border-green-500' : 'border-red-500') : ''}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Max ortalama: 352,000</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <Label>Ortalama (0.5 µm)</Label>
                                        <Input
                                          value={data?.average || 0}
                                          disabled
                                          className="bg-gray-50"
                                        />
                                      </div>
                                      <div>
                                        <Label>ISO Sınıfı</Label>
                                        <div className={`p-2 rounded text-center font-medium ${isClassAcceptable ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                                          }`}>
                                          ISO Class {currentClass}
                                        </div>
                                      </div>
                                      <div>
                                        <Label>Sonuç</Label>
                                        <div className={`p-2 rounded text-center font-medium ${isClassAcceptable
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                          }`}>
                                          {isClassAcceptable ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )

                          case 'recoveryTime':
                            return (
                              <Card key={instance.id}>
                                <CardHeader>
                                  <CardTitle className="text-lg">Recovery Time Testi - Test {testIndex + 1}</CardTitle>
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Gerekli Aralık:</strong> ≤ 25 dakika (Temizlik süresinin 25 dakikayı geçmemesi gerekir)
                                  </p>
                                </CardHeader>
                                <CardContent>
                                  {/* Device Selection */}
                                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Label className="text-sm font-medium text-blue-800">Kullanılan Cihaz</Label>
                                    <Select
                                      value={instance.deviceId || ''}
                                      onValueChange={(value) => updateTestInstanceData(room.id, instance.id, 'deviceId', value)}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Test için kullanılacak cihazı seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {devices.map((device) => (
                                          <SelectItem key={device.id} value={device.id}>
                                            {device.deviceName} - {device.model} ({device.serialNumber})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {instance.deviceName && (
                                      <p className="text-xs text-blue-600 mt-1">Seçilen: {instance.deviceName}</p>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Recovery Time (dakika) <span className="text-red-500">*</span></Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        value={data?.duration || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'duration', parseFloat(e.target.value) || 0)}
                                        placeholder="24"
                                        className={data?.duration ? ((data.duration <= 25) ? 'border-green-500' : 'border-red-500') : ''}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Max: 25 dk</p>
                                    </div>
                                    <div>
                                      <Label>Sonuç</Label>
                                      <div className={`p-2 rounded text-center font-medium ${(data?.duration || 0) <= 25
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {(data?.duration || 0) <= 25 ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )

                          case 'temperatureHumidity':
                            const tempOK = (data?.temperature || 0) >= 20 && (data?.temperature || 0) <= 24
                            const humidityOK = (data?.humidity || 0) >= 40 && (data?.humidity || 0) <= 60
                            const bothOK = tempOK && humidityOK

                            return (
                              <Card key={instance.id}>
                                <CardHeader>
                                  <CardTitle className="text-lg">Sıcaklık ve Nem Testi - Test {testIndex + 1}</CardTitle>
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Gerekli Aralık:</strong> Sıcaklık: 20-24°C, Nem: 40-60%
                                  </p>
                                </CardHeader>
                                <CardContent>
                                  {/* Device Selection */}
                                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Label className="text-sm font-medium text-blue-800">Kullanılan Cihaz</Label>
                                    <Select
                                      value={instance.deviceId || ''}
                                      onValueChange={(value) => updateTestInstanceData(room.id, instance.id, 'deviceId', value)}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Test için kullanılacak cihazı seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {devices.map((device) => (
                                          <SelectItem key={device.id} value={device.id}>
                                            {device.deviceName} - {device.model} ({device.serialNumber})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {instance.deviceName && (
                                      <p className="text-xs text-blue-600 mt-1">Seçilen: {instance.deviceName}</p>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <Label>Sıcaklık (°C) <span className="text-red-500">*</span></Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        value={data?.temperature || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'temperature', parseFloat(e.target.value) || 0)}
                                        placeholder="22.5"
                                        className={data?.temperature ? (tempOK ? 'border-green-500' : 'border-red-500') : ''}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Aralık: 20-24°C</p>
                                    </div>
                                    <div>
                                      <Label>Nem (%) <span className="text-red-500">*</span></Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        value={data?.humidity || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'humidity', parseFloat(e.target.value) || 0)}
                                        placeholder="55"
                                        className={data?.humidity ? (humidityOK ? 'border-green-500' : 'border-red-500') : ''}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Aralık: 40-60%</p>
                                    </div>
                                    <div>
                                      <Label>Sonuç</Label>
                                      <div className={`p-2 rounded text-center font-medium ${bothOK
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {bothOK ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )

                          case 'noiseLevel':
                            return (
                              <Card key={instance.id}>
                                <CardHeader>
                                  <CardTitle className="text-lg">İç Ortam Gürültü Ölçümü - Test {testIndex + 1}</CardTitle>
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Gerekli Aralık:</strong> ≤ 45 dB (Leq değeri 45 dB'yi geçmemeli)
                                  </p>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                      <Label>Leq (dBA) <span className="text-red-500">*</span></Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        value={data?.leq || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'leq', parseFloat(e.target.value) || 0)}
                                        placeholder="45.0"
                                        className={data?.leq ? ((data.leq <= 45) ? 'border-green-500' : 'border-red-500') : ''}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Max: 45 dB</p>
                                    </div>
                                    <div>
                                      <Label>Arka Fon (dBA)</Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        value={data?.backgroundNoise || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'backgroundNoise', parseFloat(e.target.value) || 0)}
                                        placeholder="30.0"
                                      />
                                    </div>
                                    <div>
                                      <Label>Ölçüm Süresi (dk)</Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        value={data?.duration || ''}
                                        onChange={(e) => updateTestInstanceData(room.id, instance.id, 'duration', parseFloat(e.target.value) || 0)}
                                        placeholder="5.0"
                                      />
                                    </div>
                                    <div>
                                      <Label>Sonuç</Label>
                                      <div className={`p-2 rounded text-center font-medium ${(data?.leq || 0) <= 45
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {(data?.leq || 0) <= 45 ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          default:
                            return null
                        }
                      }

                      return renderTestForm(instance)
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Bu oda için hiçbir test seçilmemiş</p>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                      >
                        Test Seçimine Geri Dön
                      </Button>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
              >
                Geri
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-[#0B5AA3] hover:bg-[#094a8a]"
              >
                Önizleme
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Rapor Önizlemesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Rapor Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Hastane:</span> {reportInfo.hospitalName}</div>
                  <div><span className="font-medium">Rapor No:</span> {reportInfo.reportNumber}</div>
                  <div><span className="font-medium">Tarih:</span> {reportInfo.measurementDate}</div>
                  <div><span className="font-medium">Oda Sayısı:</span> {rooms.length}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Seçilen Test Sonuçları Özeti</h3>
                {rooms.map((room, index) => (
                  <Card key={room.id} className="border-l-4 border-l-[#0B5AA3]">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{room.roomName || 'Bilinmeyen Oda'}</h4>
                          <p className="text-sm text-gray-600">Mahal No: {room.roomNo || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Sayfa {index + 1}/{rooms.length}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {room.selectedTests.includes('pressureDifference') && (
                          <div className={`p-2 rounded text-center ${room.tests?.pressureDifference?.meetsCriteria ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            Basınç: {room.tests?.pressureDifference?.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEĞİL'}
                          </div>
                        )}
                        {room.selectedTests.includes('hepaLeakage') && (
                          <div className={`p-2 rounded text-center ${room.tests?.hepaLeakage?.meetsCriteria ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            HEPA: {room.tests?.hepaLeakage?.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEĞİL'}
                          </div>
                        )}
                        {room.selectedTests.includes('particleCount') && (
                          <div className={`p-2 rounded text-center ${room.tests?.particleCount?.meetsCriteria ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            Partikül: {room.tests?.particleCount?.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEĞİL'}
                          </div>
                        )}
                        {room.selectedTests.includes('recoveryTime') && (
                          <div className={`p-2 rounded text-center ${room.tests?.recoveryTime?.meetsCriteria ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            Recovery: {room.tests?.recoveryTime?.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEĞİL'}
                          </div>
                        )}
                        {room.selectedTests.includes('temperatureHumidity') && (
                          <div className={`p-2 rounded text-center ${room.tests?.temperatureHumidity?.meetsCriteria ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            Sıcaklık/Nem: {room.tests?.temperatureHumidity?.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEĞİL'}
                          </div>
                        )}
                        {room.selectedTests.includes('airFlowDirection') && (
                          <div className={`p-2 rounded text-center ${room.tests?.airFlowDirection?.result === 'UYGUNDUR' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            Akış Yönü: {room.tests?.airFlowDirection?.result || 'UYGUN DEĞİL'}
                          </div>
                        )}
                        {room.selectedTests.includes('airflowData') && (
                          <div className={`p-2 rounded text-center ${room.tests?.airflowData?.meetsCriteria ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            Hava Debisi: {room.tests?.airflowData?.meetsCriteria ? 'UYGUNDUR' : 'UYGUN DEĞİL'}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                >
                  Geri
                </Button>
                <Button
                  onClick={handleSaveReport}
                  className="bg-[#0B5AA3] hover:bg-[#094a8a]"
                >
                  Raporu Kaydet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
