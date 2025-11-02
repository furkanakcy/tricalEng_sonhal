import { HvacReportData, HvacReportInfo, Room, TestMode, FlowType, RoomClass, AirflowData, PressureDifference, AirFlowDirection, HepaLeakage, ParticleCount, RecoveryTime, TemperatureHumidity, NoiseLevel, TestsData } from './hvac-types';
import { ReportData, DeviceInfo, EnvConditions, CalibrationInfo, MeasurementPoint, MeasurementResult } from './hvac-types';

export function mapHvacReportToPdfReport(hvacReport: HvacReportData): ReportData {
  // Extract all test instances from rooms
  const testInstances = hvacReport.rooms.flatMap(room => 
    room.testInstances.map(instance => ({
      id: instance.id,
      testType: instance.testType,
      testIndex: instance.testIndex,
      data: instance.data,
      roomId: room.id,
      roomName: room.roomName || `Oda ${room.roomNo}`,
    }))
  );

  const devices: DeviceInfo[] = [];
  const calibrations: CalibrationInfo[] = [];
  const measurementPoints: MeasurementPoint[] = [];
  const measurementResults: MeasurementResult[] = [];

  let totalPages = 6; // Default, will adjust based on content

  // Extract environmental conditions from the first room's tests, if available
  let envConditions: EnvConditions = {
    temperature: "N/A",
    humidity: "N/A",
    pressure: "N/A",
  };

  if (hvacReport.rooms.length > 0) {
    const firstRoomTests = hvacReport.rooms[0].tests;
    if (firstRoomTests.temperatureHumidity) {
      envConditions.temperature = `${firstRoomTests.temperatureHumidity.temperature} °C`;
      envConditions.humidity = `${firstRoomTests.temperatureHumidity.humidity} %RH`;
    }
    // Pressure is not directly available in HvacReportData, using placeholder
    envConditions.pressure = "1013.25 hPa"; // Standard atmospheric pressure as a placeholder
  }

  hvacReport.rooms.forEach((room, index) => {
    measurementPoints.push({
      id: room.id,
      location: `${room.roomName} (${room.roomNo}) - ${room.testMode}`,
      personnel: hvacReport.reportInfo.testerName, // Assuming tester is the personnel
    });

    // For measurement results, prioritize noise level data, then fall back to other tests
    if (room.tests.noiseLevel) {
      measurementResults.push({
        id: index + 1,
        location: room.tests.noiseLevel.location || `${room.roomName} (${room.roomNo})`,
        duration: `${room.tests.noiseLevel.duration || 1}`,
        leq: `${room.tests.noiseLevel.leq || 'N/A'}`,
        background: `${room.tests.noiseLevel.backgroundNoise || 'N/A'}`,
      });
    } else if (room.tests.airflowData) {
      measurementResults.push({
        id: index + 1,
        location: `${room.roomName} (${room.roomNo}) - ${room.testMode}`,
        duration: "N/A", // Duration not directly available in HvacReportData
        leq: `${room.tests.airflowData.flowRate}`, // Using flowRate as a placeholder for Leq
        background: `${room.tests.airflowData.airChangeRate}`, // Using airChangeRate as a placeholder for background noise
      });
    }
    // You would add similar logic for other test types (pressureDifference, particleCount, etc.)
    // and map them to appropriate fields in MeasurementResult or other sections of ReportData.
  });

  // Populate devices and calibrations - these are not directly available in HvacReportData
  // You would typically fetch these from a separate source or have them as part of the HvacReportData
  // For now, using dummy data similar to the example project
  devices.push(
    { id: "1", name: "Hava Hızı Ölçer", brand: "Test Brand", model: "Model A", serial: "SN12345" },
    { id: "2", name: "Basınç Farkı Ölçer", brand: "Test Brand", model: "Model B", serial: "SN67890" },
  );

  calibrations.push(
    { id: "1", deviceName: "Hava Hızı Ölçer", serial: "SN12345", refValue: "10", beforeValue: "9.9", afterValue: "10.1" }
  );


  return {
    customerName: hvacReport.reportInfo.organizationName,
    customerAddress: "Şirket Adresi Bilgisi", // Placeholder, needs to be provided or fetched
    orderNo: "HVAC-ORD-001", // Placeholder
    ministryAuthNo: "HVAC-MA-001", // Placeholder
    testItemName: "HVAC Sistem Performans Raporu",
    receiptDate: hvacReport.createdAt.split('T')[0], // Using creation date
    remarks: "Bu rapor, HVAC sistemlerinin performans değerlendirmesi sonuçlarını içermektedir. Raporun tamamı veya bir kısmı, laboratuvarın yazılı izni olmadan kopyalanamaz veya çoğaltılamaz.",
    testDate: hvacReport.reportInfo.measurementDate,
    reportNo: hvacReport.reportInfo.reportNumber,
    totalPages: totalPages,
    publishDate: hvacReport.createdAt.split('T')[0],
    personInCharge: hvacReport.reportInfo.testerName,
    labManager: hvacReport.reportInfo.approvedBy,
    measurementCount: `${hvacReport.rooms.length} Oda`,
    measurementAddress: "Ölçüm Adresi Bilgisi", // Placeholder, needs to be provided or fetched
    measurementMethod: hvacReport.rooms.some(room => room.tests.noiseLevel) ? "TS ISO 1996-2" : "ISO 14644-3:2019", // Noise standard or HVAC standard
    measurementType: hvacReport.rooms.some(room => room.tests.noiseLevel) ? "İç Ortam Gürültü Ölçümü" : "HVAC Performans Testi",
    measurementExecutor: hvacReport.reportInfo.testerName,
    reportReviewer: hvacReport.reportInfo.approvedBy,
    devices: hvacReport.rooms.some(room => room.tests.noiseLevel) ? [
      { id: "1", name: "Gürültü Ölçer", brand: "Sound Level Meter", model: "SLM-01", serial: "SLM12345" },
      { id: "2", name: "Akustik Kalibratör", brand: "Acoustic Calibrator", model: "AC-01", serial: "AC67890" },
    ] : devices,
    envConditions: envConditions,
    calibrations: hvacReport.rooms.some(room => room.tests.noiseLevel) ? [
      { id: "1", deviceName: "Gürültü Ölçer", serial: "SLM12345", refValue: "94", beforeValue: "93.8", afterValue: "94.2" }
    ] : calibrations,
    measurementPoints: measurementPoints,
    measurementResults: measurementResults,
    preparedBy: hvacReport.reportInfo.reportPreparedBy,
  };
}
