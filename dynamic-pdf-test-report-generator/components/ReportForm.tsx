
import React from 'react';
import type { ReportData, DeviceInfo, CalibrationInfo, MeasurementPoint, MeasurementResult } from '../types';
import { PlusCircleIcon, TrashIcon } from './icons';

interface ReportFormProps {
  data: ReportData;
  onDataChange: (data: ReportData) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ data, onDataChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onDataChange({ ...data, [name]: value });
  };

  const handleNestedChange = <T,>(section: keyof ReportData, index: number, field: keyof T, value: string) => {
    const newSection = [...(data[section] as any[])];
    newSection[index] = { ...newSection[index], [field]: value };
    onDataChange({ ...data, [section]: newSection });
  };
  
  const handleEnvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const {name, value} = e.target;
      onDataChange({ ...data, envConditions: {...data.envConditions, [name]:value} });
  };
  
  const addRow = <T,>(section: keyof ReportData, newRow: T) => {
    onDataChange({ ...data, [section]: [...(data[section] as any[]), newRow] });
  };

  const removeRow = (section: keyof ReportData, index: number) => {
    const newSection = (data[section] as any[]).filter((_, i) => i !== index);
    onDataChange({ ...data, [section]: newSection });
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <form className="space-y-6">
      <fieldset className="space-y-4 p-4 border rounded-md">
        <legend className="text-lg font-medium text-gray-900 px-2">Page 1: General Info</legend>
        <div><label className={labelClass}>Customer Name</label><input type="text" name="customerName" value={data.customerName} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Customer Address</label><input type="text" name="customerAddress" value={data.customerAddress} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Order No</label><input type="text" name="orderNo" value={data.orderNo} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Ministry Auth No</label><input type="text" name="ministryAuthNo" value={data.ministryAuthNo} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Test Item Name</label><input type="text" name="testItemName" value={data.testItemName} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Date of Receipt</label><input type="text" name="receiptDate" value={data.receiptDate} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Remarks</label><textarea name="remarks" value={data.remarks} onChange={handleChange} rows={2} className={inputClass} /></div>
        <div><label className={labelClass}>Test Date</label><input type="text" name="testDate" value={data.testDate} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Report No</label><input type="text" name="reportNo" value={data.reportNo} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Total Pages</label><input type="number" name="totalPages" value={data.totalPages} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Publish Date</label><input type="text" name="publishDate" value={data.publishDate} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Person in Charge</label><input type="text" name="personInCharge" value={data.personInCharge} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Lab Manager</label><input type="text" name="labManager" value={data.labManager} onChange={handleChange} className={inputClass} /></div>
      </fieldset>

      <fieldset className="space-y-4 p-4 border rounded-md">
        <legend className="text-lg font-medium text-gray-900 px-2">Page 3: Measurement Info</legend>
        <div><label className={labelClass}>Device Info</label>
            {data.devices.map((device, index) => (
                <div key={device.id} className="grid grid-cols-4 gap-2 mb-2 p-2 border rounded">
                    <input type="text" placeholder="Name" value={device.name} onChange={e => handleNestedChange<DeviceInfo>('devices', index, 'name', e.target.value)} className={inputClass} />
                    <input type="text" placeholder="Brand" value={device.brand} onChange={e => handleNestedChange<DeviceInfo>('devices', index, 'brand', e.target.value)} className={inputClass} />
                    <input type="text" placeholder="Model" value={device.model} onChange={e => handleNestedChange<DeviceInfo>('devices', index, 'model', e.target.value)} className={inputClass} />
                    <div className="flex items-center gap-1">
                      <input type="text" placeholder="Serial" value={device.serial} onChange={e => handleNestedChange<DeviceInfo>('devices', index, 'serial', e.target.value)} className={inputClass} />
                      <button type="button" onClick={() => removeRow('devices', index)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                    </div>
                </div>
            ))}
            <button type="button" onClick={() => addRow<DeviceInfo>('devices', { id: Date.now().toString(), name: '', brand: '', model: '', serial: ''})} className="mt-2 text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><PlusCircleIcon /> Add Device</button>
        </div>
      </fieldset>
      
      <fieldset className="space-y-4 p-4 border rounded-md">
        <legend className="text-lg font-medium text-gray-900 px-2">Page 4: Conditions & Calibrations</legend>
        <div><label className={labelClass}>Temperature</label><input type="text" name="temperature" value={data.envConditions.temperature} onChange={handleEnvChange} className={inputClass} /></div>
        <div><label className={labelClass}>Humidity</label><input type="text" name="humidity" value={data.envConditions.humidity} onChange={handleEnvChange} className={inputClass} /></div>
        <div><label className={labelClass}>Pressure</label><input type="text" name="pressure" value={data.envConditions.pressure} onChange={handleEnvChange} className={inputClass} /></div>

        <div><label className={labelClass}>Calibration Info</label>
            {data.calibrations.map((cal, index) => (
                <div key={cal.id} className="grid grid-cols-3 gap-2 mb-2 p-2 border rounded">
                    <input type="text" placeholder="Device Name" value={cal.deviceName} onChange={e => handleNestedChange<CalibrationInfo>('calibrations', index, 'deviceName', e.target.value)} className={inputClass + " col-span-3"} />
                    <input type="text" placeholder="Ref (dB)" value={cal.refValue} onChange={e => handleNestedChange<CalibrationInfo>('calibrations', index, 'refValue', e.target.value)} className={inputClass} />
                    <input type="text" placeholder="Before (dB)" value={cal.beforeValue} onChange={e => handleNestedChange<CalibrationInfo>('calibrations', index, 'beforeValue', e.target.value)} className={inputClass} />
                    <div className="flex items-center gap-1">
                      <input type="text" placeholder="After (dB)" value={cal.afterValue} onChange={e => handleNestedChange<CalibrationInfo>('calibrations', index, 'afterValue', e.target.value)} className={inputClass} />
                      <button type="button" onClick={() => removeRow('calibrations', index)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                    </div>
                </div>
            ))}
            <button type="button" onClick={() => addRow<CalibrationInfo>('calibrations', { id: Date.now().toString(), deviceName: '', serial: '', refValue: '', beforeValue: '', afterValue: ''})} className="mt-2 text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><PlusCircleIcon /> Add Calibration</button>
        </div>
        
        <div><label className={labelClass}>Measurement Points</label>
            {data.measurementPoints.map((point, index) => (
                <div key={point.id} className="grid grid-cols-5 gap-2 mb-2 p-2 border rounded">
                    <input type="text" placeholder="Location" value={point.location} onChange={e => handleNestedChange<MeasurementPoint>('measurementPoints', index, 'location', e.target.value)} className={inputClass + " col-span-4"} />
                    <div className="flex items-center gap-1">
                      <input type="text" placeholder="Personnel" value={point.personnel} onChange={e => handleNestedChange<MeasurementPoint>('measurementPoints', index, 'personnel', e.target.value)} className={inputClass} />
                      <button type="button" onClick={() => removeRow('measurementPoints', index)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                    </div>
                </div>
            ))}
            <button type="button" onClick={() => addRow<MeasurementPoint>('measurementPoints', { id: Date.now().toString(), location: '', personnel: ''})} className="mt-2 text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><PlusCircleIcon /> Add Point</button>
        </div>
      </fieldset>
      
      <fieldset className="space-y-4 p-4 border rounded-md">
        <legend className="text-lg font-medium text-gray-900 px-2">Page 5: Results</legend>
        <div><label className={labelClass}>Measurement Results</label>
            {data.measurementResults.map((res, index) => (
                <div key={res.id} className="grid grid-cols-4 gap-2 mb-2 p-2 border rounded">
                    <input type="text" placeholder="Location" value={res.location} onChange={e => handleNestedChange<MeasurementResult>('measurementResults', index, 'location', e.target.value)} className={inputClass + " col-span-4"} />
                    <input type="text" placeholder="Duration (dk)" value={res.duration} onChange={e => handleNestedChange<MeasurementResult>('measurementResults', index, 'duration', e.target.value)} className={inputClass} />
                    <input type="text" placeholder="Leq (dBA)" value={res.leq} onChange={e => handleNestedChange<MeasurementResult>('measurementResults', index, 'leq', e.target.value)} className={inputClass} />
                    <input type="text" placeholder="Background (dBA)" value={res.background} onChange={e => handleNestedChange<MeasurementResult>('measurementResults', index, 'background', e.target.value)} className={inputClass} />
                    <button type="button" onClick={() => removeRow('measurementResults', index)} className="text-red-500 hover:text-red-700 flex justify-center items-center"><TrashIcon /></button>
                </div>
            ))}
            <button type="button" onClick={() => addRow<MeasurementResult>('measurementResults', { id: data.measurementResults.length + 1, location: '', duration: '', leq: '', background: ''})} className="mt-2 text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><PlusCircleIcon /> Add Result</button>
        </div>
      </fieldset>
      
      <fieldset className="space-y-4 p-4 border rounded-md">
        <legend className="text-lg font-medium text-gray-900 px-2">Page 6: Final</legend>
        <div><label className={labelClass}>Prepared By</label><input type="text" name="preparedBy" value={data.preparedBy} onChange={handleChange} className={inputClass} /></div>
      </fieldset>
    </form>
  );
};

export default ReportForm;
