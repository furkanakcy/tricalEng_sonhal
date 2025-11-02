import { Room } from './hvac-types'

/**
 * Form'da test verilerini doğrudan room.tests objesine yazar
 */
export function updateRoomTestDirectly(
  room: Room,
  testType: string,
  field: string,
  value: any
): Room {
  const updatedRoom = { ...room }
  
  // Ensure tests object exists
  if (!updatedRoom.tests) {
    updatedRoom.tests = {}
  }
  
  // Ensure test type object exists
  if (!updatedRoom.tests[testType as keyof typeof updatedRoom.tests]) {
    updatedRoom.tests[testType as keyof typeof updatedRoom.tests] = {} as any
  }
  
  // Update the specific field
  const testData = { ...updatedRoom.tests[testType as keyof typeof updatedRoom.tests] }
  testData[field] = value
  
  // Auto-validation logic
  if (testType === 'pressureDifference' && field === 'pressure') {
    testData.meetsCriteria = value >= 6
    testData.criteria = '≥ 6 Pa'
  } else if (testType === 'hepaLeakage' && field === 'actualLeakage') {
    testData.meetsCriteria = value <= 0.01
    testData.criteria = '≤ %0.01'
  } else if (testType === 'recoveryTime' && field === 'duration') {
    testData.meetsCriteria = value <= 25
    testData.criteria = '≤ 25 dk'
  } else if (testType === 'temperatureHumidity') {
    if (field === 'temperature' || field === 'humidity') {
      const temp = field === 'temperature' ? value : (testData.temperature || 0)
      const humidity = field === 'humidity' ? value : (testData.humidity || 0)
      testData.meetsCriteria = (temp >= 20 && temp <= 24) && (humidity >= 40 && humidity <= 60)
      testData.criteria = '20-24°C, 40-60%'
    }
  } else if (testType === 'particleCount') {
    if (field === 'particle05') {
      testData.meetsCriteria = value <= 352000 // ISO Class 7 limit
      testData.isoClass = value <= 3520 ? '5' : value <= 35200 ? '6' : '7'
      testData.average = value
    }
  } else if (testType === 'airflowData') {
    if (field === 'flowRate' || field === 'totalFlowRate') {
      testData.meetsCriteria = value > 0
      testData.criteria = 'Pozitif değer'
    }
  } else if (testType === 'airFlowDirection') {
    if (field === 'result') {
      // User sets result directly
    } else if (field === 'observation' || field === 'direction') {
      testData.result = 'UYGUNDUR' // Default to compliant for direction tests
    }
  } else if (testType === 'noiseLevel' && field === 'leq') {
    testData.meetsCriteria = value <= 45
    testData.criteria = '≤ 45 dB'
  }
  
  // Update the test data
  updatedRoom.tests[testType as keyof typeof updatedRoom.tests] = testData
  
  return updatedRoom
}

/**
 * Test seçimi değiştiğinde room.tests objesini temizler/günceller
 */
export function updateRoomSelectedTests(room: Room, selectedTests: string[]): Room {
  const updatedRoom = { ...room, selectedTests }
  
  // Ensure tests object exists
  if (!updatedRoom.tests) {
    updatedRoom.tests = {}
  }
  
  // Remove tests that are no longer selected
  Object.keys(updatedRoom.tests).forEach(testType => {
    if (!selectedTests.includes(testType)) {
      delete updatedRoom.tests[testType as keyof typeof updatedRoom.tests]
    }
  })
  
  // Initialize selected tests with default values if they don't exist
  selectedTests.forEach(testType => {
    if (!updatedRoom.tests[testType as keyof typeof updatedRoom.tests]) {
      updatedRoom.tests[testType as keyof typeof updatedRoom.tests] = getDefaultTestData(testType) as any
    }
  })
  
  return updatedRoom
}

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
        criteria: 'Pozitif değer'
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