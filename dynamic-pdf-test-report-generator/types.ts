
export interface ReportData {
  customerName: string;
  customerAddress: string;
  orderNo: string;
  ministryAuthNo: string;
  testItemName: string;
  receiptDate: string;
  remarks: string;
  testDate: string;
  reportNo: string;
  totalPages: number;
  publishDate: string;
  personInCharge: string;
  labManager: string;
  measurementCount: string;
  measurementAddress: string;
  measurementMethod: string;
  measurementType: string;
  measurementExecutor: string;
  reportReviewer: string;
  devices: DeviceInfo[];
  envConditions: EnvConditions;
  calibrations: CalibrationInfo[];
  measurementPoints: MeasurementPoint[];
  measurementResults: MeasurementResult[];
  preparedBy: string;
}

export interface DeviceInfo {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial: string;
}

export interface EnvConditions {
  temperature: string;
  humidity: string;
  pressure: string;
}

export interface CalibrationInfo {
  id: string;
  deviceName: string;
  serial: string;
  refValue: string;
  beforeValue: string;
  afterValue: string;
}

export interface MeasurementPoint {
  id: string;
  location: string;
  personnel: string;
}

export interface MeasurementResult {
  id: number;
  location: string;
  duration: string;
  leq: string;
  background: string;
}
