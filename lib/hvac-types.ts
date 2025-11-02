export interface HvacReportInfo {
  hospitalName: string
  reportNumber: string
  measurementDate: string
  testerName: string
  reportPreparedBy: string // Added
  approvedBy: string // Added
  organizationName: string
  logo?: string
  seal?: string
}

export enum TestMode {
  AtRest = 'At Rest',
  InOperation = 'In Operation'
}

export enum FlowType {
  Turbulence = 'Turbulence',
  Laminar = 'Laminar',
  Unidirectional = 'Unidirectional'
}

export enum RoomClass {
  ClassIB = 'Class IB',
  ClassII = 'Class II',
  IntensiveCare = 'Intensive Care',
  Other = 'Other'
}

export interface TestInstance {
  id: string
  testType: string
  testIndex: number
  data: any
  roomName?: string // Added for display in PDF template
  deviceId?: string // Device used for this test
  deviceName?: string // Device name for display
}

export interface Room {
  id: string
  roomNo: string
  roomName: string
  surfaceArea: number
  height: number
  volume: number
  testMode: TestMode
  flowType: FlowType
  roomClass: RoomClass
  selectedTests: string[]
  testCounts: { [testType: string]: number }
  testInstances: TestInstance[]
  tests: TestsData
}

export interface AirflowData {
  speed: number
  filterDimensionX: number
  filterDimensionY: number
  flowRate: number
  totalFlowRate: number
  airChangeRate: number
  meetsCriteria: boolean
  criteria: string
}

export interface PressureDifference {
  pressure: number
  referenceArea: string
  meetsCriteria: boolean
  criteria: string
}

export interface AirFlowDirection {
  direction: string
  result: string
  observation: string
}

export interface HepaLeakage {
  maxLeakage: number
  actualLeakage: number
  meetsCriteria: boolean
  criteria: string
}

export interface ParticleCount {
  particle05: number
  particle5: number
  particles05um?: number[]
  average: number
  isoClass: string
  meetsCriteria: boolean
}

export interface RecoveryTime {
  duration: number
  meetsCriteria: boolean
  criteria: string
}

export interface TemperatureHumidity {
  temperature: number
  humidity: number
  meetsCriteria: boolean
  criteria: string
}

export interface NoiseLevel {
  leq: number
  backgroundNoise: number
  duration: number
  location: string
  frequency: string
  meetsCriteria: boolean
  criteria: string
}

export interface TestsData {
  airflowData?: AirflowData
  pressureDifference?: PressureDifference
  airFlowDirection?: AirFlowDirection
  hepaLeakage?: HepaLeakage
  particleCount?: ParticleCount
  recoveryTime?: RecoveryTime
  temperatureHumidity?: TemperatureHumidity
  noiseLevel?: NoiseLevel
}

export interface HvacReportData {
  id: string
  reportInfo: HvacReportInfo
  rooms: Room[]
  createdAt: string
  updatedAt: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ReportData {
  testInstances?: TestInstance[]; // Added for dynamic test instances in PDF
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
