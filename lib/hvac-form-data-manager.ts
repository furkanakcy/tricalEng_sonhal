import { Room, HvacReportData } from './hvac-types'

/**
 * Form'da kullanıcının girdiği test verilerini doğrudan room.tests objesine kaydeder
 * Bu fonksiyon her test verisi değiştiğinde çağrılmalı
 */
export function updateRoomTestValue(
  rooms: Room[],
  roomId: string,
  testType: string,
  field: string,
  value: any
): Room[] {
  return rooms.map(room => {
    if (room.id !== roomId) return room

    // Ensure tests object exists
    const updatedRoom = { ...room }
    if (!updatedRoom.tests) {
      updatedRoom.tests = {}
    }

    // Ensure test type object exists
    if (!updatedRoom.tests[testType as keyof typeof updatedRoom.tests]) {
      updatedRoom.tests[testType as keyof typeof updatedRoom.tests] = {} as any
    }

    // Update the specific field
    const currentTestData = updatedRoom.tests[testType as keyof typeof updatedRoom.tests] || {}
    const updatedTestData = { ...currentTestData, [field]: value }

    // Auto-validation based on test type and field
    switch (testType) {
      case 'pressureDifference':
        if (field === 'pressure') {
          updatedTestData.meetsCriteria = value >= 6
          updatedTestData.criteria = '≥ 6 Pa'
        }
        break

      case 'hepaLeakage':
        if (field === 'actualLeakage') {
          updatedTestData.meetsCriteria = value <= 0.01
          updatedTestData.criteria = '≤ %0.01'
        }
        break

      case 'recoveryTime':
        if (field === 'duration') {
          updatedTestData.meetsCriteria = value <= 25
          updatedTestData.criteria = '≤ 25 dk'
        }
        break

      case 'temperatureHumidity':
        if (field === 'temperature' || field === 'humidity') {
          const temp = field === 'temperature' ? value : (updatedTestData.temperature || 0)
          const humidity = field === 'humidity' ? value : (updatedTestData.humidity || 0)
          updatedTestData.meetsCriteria = (temp >= 20 && temp <= 24) && (humidity >= 40 && humidity <= 60)
          updatedTestData.criteria = '20-24°C, 40-60%'
        }
        break

      case 'particleCount':
        if (field === 'particle05') {
          updatedTestData.average = value
          updatedTestData.meetsCriteria = value <= 352000 // ISO Class 7 limit
          updatedTestData.isoClass = value <= 3520 ? '5' : value <= 35200 ? '6' : '7'
        }
        break

      case 'airflowData':
        if (field === 'flowRate' || field === 'totalFlowRate') {
          updatedTestData.meetsCriteria = value > 0
          updatedTestData.criteria = 'Pozitif değer gerekli'
        }
        break

      case 'airFlowDirection':
        if (field === 'observation' || field === 'direction') {
          updatedTestData.result = 'UYGUNDUR' // Default to compliant
        }
        break

      case 'noiseLevel':
        if (field === 'leq') {
          updatedTestData.meetsCriteria = value <= 45
          updatedTestData.criteria = '≤ 45 dB'
        }
        break
    }

    // Update the test data
    updatedRoom.tests[testType as keyof typeof updatedRoom.tests] = updatedTestData

    return updatedRoom
  })
}

/**
 * Test seçimi değiştiğinde çağrılır
 */
export function updateRoomSelectedTests(
  rooms: Room[],
  roomId: string,
  selectedTests: string[]
): Room[] {
  return rooms.map(room => {
    if (room.id !== roomId) return room

    const updatedRoom = { ...room, selectedTests }

    // Ensure tests object exists
    if (!updatedRoom.tests) {
      updatedRoom.tests = {}
    }

    // Remove unselected tests
    Object.keys(updatedRoom.tests).forEach(testType => {
      if (!selectedTests.includes(testType)) {
        delete updatedRoom.tests[testType as keyof typeof updatedRoom.tests]
      }
    })

    // Initialize selected tests with default values
    selectedTests.forEach(testType => {
      if (!updatedRoom.tests[testType as keyof typeof updatedRoom.tests]) {
        updatedRoom.tests[testType as keyof typeof updatedRoom.tests] = getDefaultTestData(testType) as any
      }
    })

    return updatedRoom
  })
}

/**
 * Test için varsayılan veri yapısını döndürür
 */
function getDefaultTestData(testType: string) {
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
        criteria: 'Pozitif değer gerekli'
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
        isoClass: "7",
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
        meetsCriteria: false,
        criteria: '≤ 45 dB'
      }

    default:
      return {}
  }
}

/**
 * Rapor kaydedilmeden önce tüm test verilerinin doğru olduğunu kontrol eder
 */
export function validateReportData(reportData: HvacReportData): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check basic report info
  if (!reportData.reportInfo.hospitalName) {
    errors.push('Hastane adı gerekli')
  }
  if (!reportData.reportInfo.reportNumber) {
    errors.push('Rapor numarası gerekli')
  }

  // Check rooms
  if (reportData.rooms.length === 0) {
    errors.push('En az bir oda gerekli')
  }

  reportData.rooms.forEach((room, index) => {
    if (!room.roomName && !room.roomNo) {
      errors.push(`Oda ${index + 1}: Oda adı veya numarası gerekli`)
    }

    if (room.selectedTests.length === 0) {
      errors.push(`Oda ${index + 1}: En az bir test seçilmeli`)
    }

    // Check if selected tests have data
    room.selectedTests.forEach(testType => {
      const testData = room.tests?.[testType as keyof typeof room.tests]
      if (!testData) {
        errors.push(`Oda ${index + 1}: ${testType} test verisi eksik`)
      }
    })
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}