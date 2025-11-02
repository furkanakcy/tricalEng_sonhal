"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Room } from "@/lib/hvac-types"
import { updateRoomTestValue } from "@/lib/hvac-form-data-manager"

interface HvacTestInputProps {
  rooms: Room[]
  onRoomsUpdate: (rooms: Room[]) => void
}

export function HvacTestInput({ rooms, onRoomsUpdate }: HvacTestInputProps) {
  const [activeRoom, setActiveRoom] = useState<string>('')

  const handleTestValueChange = (roomId: string, testType: string, field: string, value: any) => {
    const updatedRooms = updateRoomTestValue(rooms, roomId, testType, field, value)
    onRoomsUpdate(updatedRooms)
  }

  const renderTestInput = (room: Room, testType: string) => {
    const testData = room.tests?.[testType as keyof typeof room.tests] || {}

    switch (testType) {
      case 'pressureDifference':
        return (
          <Card key={testType} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Basınç Farkı Testi</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Gerekli Aralık:</strong> ≥ 6.0 Pa (Pozitif basınç farkı gerekli)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Basınç (Pa) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={testData.pressure || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'pressure', parseFloat(e.target.value) || 0)}
                    placeholder="6.0"
                    className={testData.pressure ? (testData.pressure >= 6 ? 'border-green-500' : 'border-red-500') : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Min: 6.0 Pa</p>
                </div>
                <div>
                  <Label>Referans Alan</Label>
                  <Input
                    value={testData.referenceArea || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'referenceArea', e.target.value)}
                    placeholder="Koridor"
                  />
                </div>
                <div>
                  <Label>Sonuç</Label>
                  <div className={`p-2 rounded text-center font-medium ${
                    testData.meetsCriteria ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {testData.pressure >= 6 ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'hepaLeakage':
        return (
          <Card key={testType} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">HEPA Sızdırmazlık Testi</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Gerekli Aralık:</strong> ≤ 0.01% (Maksimum %0.01 sızıntı kabul edilir)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Gerçek Sızıntı (%) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={testData.actualLeakage || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'actualLeakage', parseFloat(e.target.value) || 0)}
                    placeholder="0.005"
                    className={testData.actualLeakage ? (testData.actualLeakage <= 0.01 ? 'border-green-500' : 'border-red-500') : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Max: 0.01%</p>
                </div>
                <div>
                  <Label>Maksimum Sızıntı (%)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={testData.maxLeakage || 0.01}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'maxLeakage', parseFloat(e.target.value) || 0)}
                    placeholder="0.01"
                  />
                </div>
                <div>
                  <Label>Sonuç</Label>
                  <div className={`p-2 rounded text-center font-medium ${
                    (testData.actualLeakage || 0) <= 0.01 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {(testData.actualLeakage || 0) <= 0.01 ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
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
        const currentClass = getISOClass(testData.particle05 || 0)
        const isClassAcceptable = parseInt(currentClass) <= 7
        
        return (
          <Card key={testType} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Partikül Sayım Testi</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Gerekli Aralık:</strong> ISO Class 5-7 (≤ 352,000 partikül/m³ for 0.5μm)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>0.5 μm Partikül <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={testData.particle05 || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'particle05', parseInt(e.target.value) || 0)}
                    placeholder="100000"
                    className={testData.particle05 ? (isClassAcceptable ? 'border-green-500' : 'border-red-500') : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Max: 352,000</p>
                </div>
                <div>
                  <Label>5.0 μm Partikül</Label>
                  <Input
                    type="number"
                    value={testData.particle5 || 0}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'particle5', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>ISO Sınıfı</Label>
                  <div className={`p-2 rounded text-center font-medium ${
                    isClassAcceptable ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    ISO Class {currentClass}
                  </div>
                </div>
                <div>
                  <Label>Sonuç</Label>
                  <div className={`p-2 rounded text-center font-medium ${
                    isClassAcceptable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isClassAcceptable ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'recoveryTime':
        return (
          <Card key={testType} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Recovery Time Testi</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Gerekli Aralık:</strong> ≤ 25 dakika (Temizlik süresinin 25 dakikayı geçmemesi gerekir)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Süre (dakika) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={testData.duration || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'duration', parseFloat(e.target.value) || 0)}
                    placeholder="15.5"
                    className={testData.duration ? (testData.duration <= 25 ? 'border-green-500' : 'border-red-500') : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Max: 25 dk</p>
                </div>
                <div>
                  <Label>Sonuç</Label>
                  <div className={`p-2 rounded text-center font-medium ${
                    (testData.duration || 0) <= 25 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {(testData.duration || 0) <= 25 ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'temperatureHumidity':
        const tempOK = testData.temperature >= 20 && testData.temperature <= 24
        const humidityOK = testData.humidity >= 40 && testData.humidity <= 60
        const bothOK = tempOK && humidityOK
        
        return (
          <Card key={testType} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Sıcaklık ve Nem Testi</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Gerekli Aralık:</strong> Sıcaklık: 20-24°C, Nem: 40-60%
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Sıcaklık (°C) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={testData.temperature || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'temperature', parseFloat(e.target.value) || 0)}
                    placeholder="22.5"
                    className={testData.temperature ? (tempOK ? 'border-green-500' : 'border-red-500') : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Aralık: 20-24°C</p>
                </div>
                <div>
                  <Label>Nem (%) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={testData.humidity || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'humidity', parseFloat(e.target.value) || 0)}
                    placeholder="55"
                    className={testData.humidity ? (humidityOK ? 'border-green-500' : 'border-red-500') : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Aralık: 40-60%</p>
                </div>
                <div>
                  <Label>Sonuç</Label>
                  <div className={`p-2 rounded text-center font-medium ${
                    bothOK ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {bothOK ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'airflowData':
        // Calculate air change rate if room volume is available
        const airChangeRate = room.volume > 0 ? ((testData.totalFlowRate || testData.flowRate || 0) / room.volume) : 0
        const airChangeOK = airChangeRate >= 20
        
        return (
          <Card key={testType} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Hava Debisi Testi</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Gerekli Aralık:</strong> ≥ 20 ACH (Hava değişim oranı saatte en az 20 olmalı)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Debi (m³/h)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={testData.flowRate || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'flowRate', parseFloat(e.target.value) || 0)}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label>Toplam Debi (m³/h) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={testData.totalFlowRate || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'totalFlowRate', parseFloat(e.target.value) || 0)}
                    placeholder="1000"
                    className={testData.totalFlowRate ? (airChangeOK ? 'border-green-500' : 'border-red-500') : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Min: {room.volume * 20} m³/h</p>
                </div>
                <div>
                  <Label>ACH (Hava Değişimi)</Label>
                  <div className={`p-2 rounded text-center font-medium ${
                    airChangeOK ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {airChangeRate.toFixed(1)} ACH
                  </div>
                </div>
                <div>
                  <Label>Sonuç</Label>
                  <div className={`p-2 rounded text-center font-medium ${
                    airChangeOK ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {airChangeOK ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'airFlowDirection':
        return (
          <Card key={testType} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Hava Akış Yönü Testi</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Gerekli Durum:</strong> Temiz alandan kirli alana doğru hava akışı (Gözlemsel test)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Gözlem <span className="text-red-500">*</span></Label>
                  <Input
                    value={testData.observation || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'observation', e.target.value)}
                    placeholder="Temiz alandan kirli alana doğru"
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

      case 'noiseLevel':
        return (
          <Card key={testType} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Gürültü Seviyesi Testi</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Gerekli Aralık:</strong> ≤ 45 dB (Leq değeri 45 dB'yi geçmemeli)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Leq (dB) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={testData.leq || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'leq', parseFloat(e.target.value) || 0)}
                    placeholder="42.5"
                    className={testData.leq ? (testData.leq <= 45 ? 'border-green-500' : 'border-red-500') : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Max: 45 dB</p>
                </div>
                <div>
                  <Label>Arka Fon (dB)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={testData.backgroundNoise || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'backgroundNoise', parseFloat(e.target.value) || 0)}
                    placeholder="30.0"
                  />
                </div>
                <div>
                  <Label>Süre (dk)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={testData.duration || ''}
                    onChange={(e) => handleTestValueChange(room.id, testType, 'duration', parseFloat(e.target.value) || 0)}
                    placeholder="5.0"
                  />
                </div>
                <div>
                  <Label>Sonuç</Label>
                  <div className={`p-2 rounded text-center font-medium ${
                    (testData.leq || 0) <= 45 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {(testData.leq || 0) <= 45 ? 'GEÇTİ ✓' : 'GEÇMEDİ ✗'}
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Test Verilerini Girin</h2>
      
      {rooms.map((room, roomIndex) => (
        <Card key={room.id} className="border-l-4 border-l-[#0B5AA3]">
          <CardHeader>
            <CardTitle className="text-lg">
              Oda {roomIndex + 1}: {room.roomName || 'İsimsiz Mahal'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {room.selectedTests && room.selectedTests.length > 0 ? (
              <div className="space-y-4">
                {room.selectedTests.map(testType => renderTestInput(room, testType))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Bu oda için hiç test seçilmemiş
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}