'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { generateProfessionalPDF } from '@/lib/professional-pdf-generator'
import { generateSimplePDFReport } from '@/lib/simple-pdf-generator'
import { HvacReportData, TestMode, FlowType, RoomClass } from '@/lib/hvac-types'

// Test data with selected tests
const testReportData: HvacReportData = {
  id: 'test-report-1',
  reportInfo: {
    hospitalName: 'Test Hastanesi',
    reportNumber: 'TEST-2024-001',
    measurementDate: '2024-01-15',
    testerName: 'Ahmet Yılmaz',
    reportPreparerName: 'Mehmet Demir',
    approverName: 'Dr. Ayşe Kaya',
    organizationName: 'Calimed Test Laboratuvarı',
    reportPreparedBy: 'Mehmet Demir',
    approvedBy: 'Dr. Ayşe Kaya'
  },
  rooms: [
    {
      id: 'room-1',
      roomNo: 'A101',
      roomName: 'Ameliyathane 1',
      surfaceArea: 25,
      height: 3,
      volume: 75,
      testMode: TestMode.InOperation,
      flowType: FlowType.Laminar,
      roomClass: RoomClass.ClassIB,
      selectedTests: ['airflowData', 'pressureDifference', 'hepaLeakage', 'particleCount'],
      testInstances: [
        {
          id: 'test-1',
          testType: 'airflowData',
          testIndex: 1,
          data: {
            speed: 0.45,
            filterDimensionX: 1200,
            filterDimensionY: 600,
            flowRate: 972,
            totalFlowRate: 1944,
            airChangeRate: 25.9,
            meetsCriteria: true,
            criteria: '≥ 20 ACH'
          }
        },
        {
          id: 'test-1b',
          testType: 'airflowData',
          testIndex: 2,
          data: {
            speed: 0.50,
            filterDimensionX: 1200,
            filterDimensionY: 600,
            flowRate: 1080,
            totalFlowRate: 2160,
            airChangeRate: 28.8,
            meetsCriteria: true,
            criteria: '≥ 20 ACH'
          }
        },
        {
          id: 'test-2',
          testType: 'pressureDifference',
          testIndex: 1,
          data: {
            pressure: 8.5,
            referenceArea: 'Koridor',
            meetsCriteria: true,
            criteria: '≥ 6 Pa'
          }
        },
        {
          id: 'test-2b',
          testType: 'pressureDifference',
          testIndex: 2,
          data: {
            pressure: 7.2,
            referenceArea: 'Antre',
            meetsCriteria: true,
            criteria: '≥ 6 Pa'
          }
        },
        {
          id: 'test-3',
          testType: 'hepaLeakage',
          testIndex: 1,
          data: {
            maxLeakage: 0.01,
            actualLeakage: 0.005,
            meetsCriteria: true,
            criteria: '≤ %0.01'
          }
        },
        {
          id: 'test-4',
          testType: 'particleCount',
          testIndex: 1,
          data: {
            particle05: 2800,
            particle5: 0,
            average: 2800,
            isoClass: 'ISO 7',
            meetsCriteria: true
          }
        },
        {
          id: 'test-4b',
          testType: 'particleCount',
          testIndex: 2,
          data: {
            particle05: 3200,
            particle5: 1,
            average: 3200,
            isoClass: 'ISO 7',
            meetsCriteria: true
          }
        }
      ],
      tests: {
        airflowData: {
          speed: 0.45,
          filterDimensionX: 1200,
          filterDimensionY: 600,
          flowRate: 972,
          totalFlowRate: 1944,
          airChangeRate: 25.9,
          meetsCriteria: true,
          criteria: '≥ 20 ACH'
        },
        pressureDifference: {
          pressure: 8.5,
          referenceArea: 'Koridor',
          meetsCriteria: true,
          criteria: '≥ 6 Pa'
        },
        airFlowDirection: {
          direction: 'Temiz → Kirli',
          result: 'UYGUNDUR',
          observation: 'Hava akışı doğru yönde'
        },
        hepaLeakage: {
          maxLeakage: 0.01,
          actualLeakage: 0.005,
          meetsCriteria: true,
          criteria: '≤ %0.01'
        },
        particleCount: {
          particle05: 2800,
          particle5: 0,
          average: 2800,
          isoClass: 'ISO 7',
          meetsCriteria: true
        },
        recoveryTime: {
          duration: 18,
          meetsCriteria: true,
          criteria: '≤ 25 dk'
        },
        temperatureHumidity: {
          temperature: 22,
          humidity: 45,
          meetsCriteria: true,
          criteria: '20-24°C, 40-60%'
        }
      }
    },
    {
      id: 'room-2',
      roomNo: 'A102',
      roomName: 'Ameliyathane 2',
      surfaceArea: 30,
      height: 3,
      volume: 90,
      testMode: TestMode.AtRest,
      flowType: FlowType.Turbulence,
      roomClass: RoomClass.ClassII,
      selectedTests: ['airflowData', 'pressureDifference', 'temperatureHumidity'],
      testInstances: [
        {
          id: 'test-5',
          testType: 'airflowData',
          testIndex: 1,
          data: {
            speed: 0.35,
            filterDimensionX: 1200,
            filterDimensionY: 600,
            flowRate: 756,
            totalFlowRate: 1512,
            airChangeRate: 16.8,
            meetsCriteria: false,
            criteria: '≥ 20 ACH'
          }
        },
        {
          id: 'test-6',
          testType: 'pressureDifference',
          testIndex: 1,
          data: {
            pressure: 4.2,
            referenceArea: 'Koridor',
            meetsCriteria: false,
            criteria: '≥ 6 Pa'
          }
        },
        {
          id: 'test-6b',
          testType: 'pressureDifference',
          testIndex: 2,
          data: {
            pressure: 5.8,
            referenceArea: 'Antre',
            meetsCriteria: false,
            criteria: '≥ 6 Pa'
          }
        },
        {
          id: 'test-7',
          testType: 'temperatureHumidity',
          testIndex: 1,
          data: {
            temperature: 26,
            humidity: 65,
            meetsCriteria: false,
            criteria: '20-24°C, 40-60%'
          }
        },
        {
          id: 'test-7b',
          testType: 'temperatureHumidity',
          testIndex: 2,
          data: {
            temperature: 23,
            humidity: 50,
            meetsCriteria: true,
            criteria: '20-24°C, 40-60%'
          }
        }
      ],
      tests: {
        airflowData: {
          speed: 0.35,
          filterDimensionX: 1200,
          filterDimensionY: 600,
          flowRate: 756,
          totalFlowRate: 1512,
          airChangeRate: 16.8,
          meetsCriteria: false,
          criteria: '≥ 20 ACH'
        },
        pressureDifference: {
          pressure: 4.2,
          referenceArea: 'Koridor',
          meetsCriteria: false,
          criteria: '≥ 6 Pa'
        },
        airFlowDirection: {
          direction: 'Temiz → Kirli',
          result: 'UYGUNDUR',
          observation: 'Hava akışı doğru yönde'
        },
        hepaLeakage: {
          maxLeakage: 0.01,
          actualLeakage: 0.008,
          meetsCriteria: true,
          criteria: '≤ %0.01'
        },
        particleCount: {
          particle05: 4200,
          particle5: 2,
          average: 4200,
          isoClass: 'ISO 8',
          meetsCriteria: false
        },
        recoveryTime: {
          duration: 28,
          meetsCriteria: false,
          criteria: '≤ 25 dk'
        },
        temperatureHumidity: {
          temperature: 26,
          humidity: 65,
          meetsCriteria: false,
          criteria: '20-24°C, 40-60%'
        }
      }
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export function PDFTestComponent() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">PDF Test Sayfası Devre Dışı</h3>
      <p className="text-gray-600 mb-4">
        PDF test işlemleri artık HVAC Raporları sayfasından yapılmaktadır.
      </p>
      
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">PDF Oluşturmak için:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. HVAC Raporları sayfasına gidin</li>
          <li>2. Bir rapor oluşturun veya mevcut raporu seçin</li>
          <li>3. "Görüntüle" butonuyla raporu inceleyin</li>
          <li>4. "PDF Oluştur" butonuyla SZUTEST formatında profesyonel PDF oluşturun</li>
        </ul>
      </div>
    </div>
  )
}