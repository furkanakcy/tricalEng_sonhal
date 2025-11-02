import { HvacReportData, Room } from './hvac-types'

export interface TestSummary {
  testName: string
  testKey: string
  isSelected: boolean
  hasData: boolean
  meetsCriteria: boolean | null
  value: string
  criteria: string
}

export interface RoomSummary {
  roomId: string
  roomNo: string
  roomName: string
  tests: TestSummary[]
  overallCompliant: boolean
  selectedTestCount: number
  passedTestCount: number
}

export function generateTestSummary(reportData: HvacReportData): RoomSummary[] {
  const testDefinitions = [
    {
      key: 'airflowData',
      name: 'Hava Debisi',
      getDisplayValue: (data: any) => data ? `${data.flowRate || data.totalFlowRate || 0} m³/h` : 'Veri yok',
      getCriteria: (data: any) => data?.criteria || 'Belirtilmemiş'
    },
    {
      key: 'pressureDifference',
      name: 'Basınç Farkı',
      getDisplayValue: (data: any) => data ? `${data.pressure || 0} Pa` : 'Veri yok',
      getCriteria: (data: any) => data?.criteria || '≥ 6 Pa'
    },
    {
      key: 'airFlowDirection',
      name: 'Hava Akış Yönü',
      getDisplayValue: (data: any) => data ? (data.observation || data.direction || 'Gözlem') : 'Veri yok',
      getCriteria: () => 'Temiz → Kirli'
    },
    {
      key: 'hepaLeakage',
      name: 'HEPA Sızdırmazlık',
      getDisplayValue: (data: any) => data ? `${data.actualLeakage || data.maxLeakage || 0}%` : 'Veri yok',
      getCriteria: (data: any) => data?.criteria || '≤ %0.01'
    },
    {
      key: 'particleCount',
      name: 'Partikül Sayısı',
      getDisplayValue: (data: any) => data ? `${data.particle05 || data.average || 0}` : 'Veri yok',
      getCriteria: (data: any) => data ? `ISO Class ${data.isoClass || '7'}` : 'ISO Class 7'
    },
    {
      key: 'recoveryTime',
      name: 'Recovery Time',
      getDisplayValue: (data: any) => data ? `${data.duration || 0} dk` : 'Veri yok',
      getCriteria: (data: any) => data?.criteria || '≤ 25 dk'
    },
    {
      key: 'temperatureHumidity',
      name: 'Sıcaklık & Nem',
      getDisplayValue: (data: any) => data ? `${data.temperature || 0}°C, ${data.humidity || 0}%` : 'Veri yok',
      getCriteria: (data: any) => data?.criteria || '20-24°C, 40-60%'
    },
    {
      key: 'noiseLevel',
      name: 'Gürültü Seviyesi',
      getDisplayValue: (data: any) => data ? `${data.leq || 0} dB` : 'Veri yok',
      getCriteria: (data: any) => data?.criteria || '≤ 45 dB'
    }
  ]

  return reportData.rooms.map(room => {
    const tests: TestSummary[] = testDefinitions.map(testDef => {
      const isSelected = room.selectedTests?.includes(testDef.key) || false
      const testData = room.tests?.[testDef.key as keyof typeof room.tests]
      const hasData = !!testData
      
      let meetsCriteria: boolean | null = null
      if (hasData) {
        if (testDef.key === 'airFlowDirection') {
          meetsCriteria = testData.result === 'UYGUNDUR'
        } else {
          meetsCriteria = testData.meetsCriteria ?? false
        }
      }

      return {
        testName: testDef.name,
        testKey: testDef.key,
        isSelected,
        hasData,
        meetsCriteria,
        value: testDef.getDisplayValue(testData),
        criteria: testDef.getCriteria(testData)
      }
    })

    const selectedTests = tests.filter(t => t.isSelected)
    const passedTests = selectedTests.filter(t => t.meetsCriteria === true)
    const overallCompliant = selectedTests.length > 0 && selectedTests.every(t => t.meetsCriteria === true)

    return {
      roomId: room.id,
      roomNo: room.roomNo || 'N/A',
      roomName: room.roomName || 'Bilinmeyen Oda',
      tests,
      overallCompliant,
      selectedTestCount: selectedTests.length,
      passedTestCount: passedTests.length
    }
  })
}

export function getOverallReportCompliance(roomSummaries: RoomSummary[]): {
  isCompliant: boolean
  totalRooms: number
  compliantRooms: number
  totalTests: number
  passedTests: number
  complianceRate: number
} {
  const totalRooms = roomSummaries.length
  const compliantRooms = roomSummaries.filter(r => r.overallCompliant).length
  const totalTests = roomSummaries.reduce((sum, r) => sum + r.selectedTestCount, 0)
  const passedTests = roomSummaries.reduce((sum, r) => sum + r.passedTestCount, 0)
  const complianceRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
  
  return {
    isCompliant: totalRooms > 0 && roomSummaries.every(r => r.overallCompliant),
    totalRooms,
    compliantRooms,
    totalTests,
    passedTests,
    complianceRate
  }
}