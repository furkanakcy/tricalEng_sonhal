import { Room, TestsData } from './hvac-types'

/**
 * Test instance verilerini room.tests objesine senkronize eder
 */
export function syncTestInstancestoRoomTests(room: Room): Room {
  const updatedTests: TestsData = { ...room.tests }
  
  // Test instance'larından verileri al ve room.tests'e aktar
  room.testInstances?.forEach(instance => {
    if (instance.testType && instance.data) {
      const testType = instance.testType as keyof TestsData
      
      // Mevcut test verisini güncelle veya yeni oluştur
      updatedTests[testType] = {
        ...updatedTests[testType],
        ...instance.data
      }
    }
  })
  
  return {
    ...room,
    tests: updatedTests
  }
}

/**
 * Tüm odaların test verilerini senkronize eder
 */
export function syncAllRoomTestData(rooms: Room[]): Room[] {
  return rooms.map(room => syncTestInstancestoRoomTests(room))
}

/**
 * Test verisini doğrudan room.tests objesine yazar
 */
export function updateRoomTestData(
  room: Room, 
  testType: string, 
  field: string, 
  value: any
): Room {
  const updatedTests = { ...room.tests }
  
  // Test tipine göre veriyi güncelle
  if (!updatedTests[testType as keyof TestsData]) {
    updatedTests[testType as keyof TestsData] = {} as any
  }
  
  const testData = { ...updatedTests[testType as keyof TestsData] }
  testData[field] = value
  
  // Auto-validation
  if (testType === 'pressureDifference' && field === 'pressure') {
    testData.meetsCriteria = value >= 6
  } else if (testType === 'hepaLeakage' && field === 'actualLeakage') {
    testData.meetsCriteria = value <= 0.01
  } else if (testType === 'recoveryTime' && field === 'duration') {
    testData.meetsCriteria = value <= 25
  } else if (testType === 'temperatureHumidity') {
    if (field === 'temperature' || field === 'humidity') {
      const temp = field === 'temperature' ? value : (testData.temperature || 0)
      const humidity = field === 'humidity' ? value : (testData.humidity || 0)
      testData.meetsCriteria = (temp >= 20 && temp <= 24) && (humidity >= 40 && humidity <= 60)
    }
  } else if (testType === 'particleCount' && field === 'particle05') {
    testData.meetsCriteria = value <= 352000 // ISO Class 7 limit
    testData.isoClass = value <= 3520 ? '5' : value <= 35200 ? '6' : '7'
  } else if (testType === 'airflowData' && (field === 'flowRate' || field === 'totalFlowRate')) {
    testData.meetsCriteria = value > 0
  } else if (testType === 'airFlowDirection' && field === 'result') {
    // No auto-validation needed, user sets result directly
  } else if (testType === 'noiseLevel' && field === 'leq') {
    testData.meetsCriteria = value <= 45
  }
  
  updatedTests[testType as keyof TestsData] = testData
  
  return {
    ...room,
    tests: updatedTests
  }
}