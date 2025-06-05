import React, { useState, useRef, useEffect } from "react";
import { uploadElectricityData } from "../api";

export default function ElectricityUploadModal({ open, onClose, onUploadSuccess }) {
  const [month, setMonth] = useState('');
  const [baseline, setBaseline] = useState('');
  const [consumption, setConsumption] = useState('');
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef();

  // Office details state
  const [officeFields, setOfficeFields] = useState({
    building_description: '',
    gross_area: '',
    air_conditioned_area: '',
    number_of_occupants: '',
    office_account_no: '',
    office_address: ''
  });
  const [officeLoading, setOfficeLoading] = useState(false);
  const [officeError, setOfficeError] = useState('');

  useEffect(() => {
    if (!open) return;
    // Fetch user's office details when modal opens
    async function fetchOfficeFields() {
      setOfficeLoading(true);
      setOfficeError('');
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
        // Get user profile to get office_id
        const resProfile = await fetch(`${API_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resProfile.ok) throw new Error('Failed to fetch user profile.');
        const profile = await resProfile.json();
        if (!profile.office_id) throw new Error('No office assigned to your account.');
        // Get office details
        const resOffice = await fetch(`/api/offices/${profile.office_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resOffice.ok) throw new Error('Failed to fetch office details.');
        const office = await resOffice.json();
        setOfficeFields({
          building_description: office.building_description || '',
          gross_area: office.gross_area || '',
          air_conditioned_area: office.air_conditioned_area || '',
          number_of_occupants: office.number_of_occupants || '',
          office_account_no: office.office_account_no || '',
          office_address: office.office_address || ''
        });
      } catch (err) {
        setOfficeError(err.message || 'Could not load office details.');
        setOfficeFields({
          building_description: '',
          gross_area: '',
          air_conditioned_area: '',
          number_of_occupants: '',
          office_account_no: '',
          office_address: ''
        });
      }
      setOfficeLoading(false);
    }
    fetchOfficeFields();
  }, [open]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleBaselineChange = (e) => {
    const value = e.target.value;
    if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
      setBaseline(value);
    }
  };

  const handleConsumptionChange = (e) => {
    const value = e.target.value;
    if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
      setConsumption(value);
    }
  };

  // Only allow images and PDFs
  const allowedTypes = [
    "image/png", "image/jpeg", "image/jpg", "image/gif", "image/bmp", "image/webp", "application/pdf"
  ];
  const handleFilesChange = (e) => {
    const newFiles = Array.from(e.target.files).filter(
      (file) => allowedTypes.includes(file.type)
    );
    setFiles(prev =>
      [...prev, ...newFiles].filter(
        (file, idx, arr) =>
          arr.findIndex(f => f.name === file.name && f.size === file.size) === idx
      )
    );
    e.target.value = '';
    if (Array.from(e.target.files).some(file => !allowedTypes.includes(file.type))) {
      setMessage("Only images and PDFs are allowed.");
    }
  };

  const handleRemoveFile = (idx) => {
    setFiles(files => files.filter((_, i) => i !== idx));
  };

  const handlePreview = (file) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewFile(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) {
      return (
        <svg className="inline-block w-5 h-5 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect width="20" height="16" x="2" y="4" rx="2" strokeWidth="2" stroke="currentColor" fill="none"/>
          <circle cx="8" cy="10" r="2" strokeWidth="2" stroke="currentColor" fill="none"/>
          <path stroke="currentColor" strokeWidth="2" d="M21 15l-5-5L5 21"/>
        </svg>
      );
    }
    if (file.type === "application/pdf") {
      return (
        <svg className="inline-block w-5 h-5 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect width="16" height="20" x="4" y="2" rx="2" strokeWidth="2" stroke="currentColor" fill="none"/>
          <path stroke="currentColor" strokeWidth="2" d="M8 6h8M8 10h8M8 14h6"/>
        </svg>
      );
    }
    return (
      <svg className="inline-block w-5 h-5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect width="16" height="20" x="4" y="2" rx="2" strokeWidth="2" stroke="currentColor" fill="none"/>
        <path stroke="currentColor" strokeWidth="2" d="M8 6h8M8 10h8M8 14h6"/>
      </svg>
    );
  };

  const validateFields = () => {
    const errs = {};
    if (!month) errs.month = "Month is required.";
    if (!baseline || isNaN(baseline) || Number(baseline) < 0) errs.baseline = "Baseline must be a positive number.";
    if (!consumption || isNaN(consumption) || Number(consumption) < 0) errs.consumption = "Consumption must be a positive number.";
    if (!files.length) errs.files = "Please attach at least one file.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetForm = () => {
    setMonth('');
    setBaseline('');
    setConsumption('');
    setFiles([]);
    setMessage('');
    setErrors({});
    setPreviewFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!validateFields()) return;

    setSaving(true);
    const formData = new FormData();
    formData.append('month', month);
    formData.append('baseline', baseline);
    formData.append('consumption_kwh', consumption);
    files.forEach((file) => {
      formData.append('attachments', file);
    });
    // Append office fields
    Object.entries(officeFields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const token = localStorage.getItem("token");
      let data = await uploadElectricityData(formData, token);

      if (data.exists) {
        if (window.confirm("Data for this month and year already exists. Update instead?")) {
          formData.append('forceUpdate', 'true');
          data = await uploadElectricityData(formData, token);
          if (data.success) {
            setMessage("Updated successfully!");
            setTimeout(() => {
              setMessage('');
              if (typeof onUploadSuccess === 'function') {
                onUploadSuccess();
              } else {
                handleClose();
              }
            }, 1000);
          } else {
            setMessage(data.message || "Error updating data");
          }
        }
      } else if (data.success) {
        setMessage("Saved successfully!");
        setTimeout(() => {
          setMessage('');
          if (typeof onUploadSuccess === 'function') {
            onUploadSuccess();
          } else {
            handleClose();
          }
        }, 1000);
      } else {
        setMessage(data.message || "Error saving data");
      }
    } catch (err) {
      setMessage("Error saving data");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative animate-fadeIn my-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-6 text-blue-900 sticky top-0 bg-white pt-2 z-10">
          Upload Monthly Electricity Consumption
        </h3>
        {officeLoading && (
          <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md animate-fadeIn text-blue-900">
            Loading office details...
          </div>
        )}
        {officeError && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-fadeIn text-red-900">
            {officeError}
          </div>
        )}
        <form onSubmit={handleSave} autoComplete="off">


          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={month}
              onChange={e => setMonth(e.target.value)}
              required
            >
              <option value="">Select Month</option>
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errors.month && <div className="text-red-600 text-xs mt-1">{errors.month}</div>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Consumption Baseline (Peso)</label>
            <input
              type="text"
              inputMode="decimal"
              pattern="^\d*\.?\d*$"
              min="0"
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 no-spinner"
              value={baseline}
              onChange={handleBaselineChange}
              placeholder="Enter Peso"
              required
              autoComplete="off"
            />
            {errors.baseline && <div className="text-red-600 text-xs mt-1">{errors.baseline}</div>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Consumption (kWh)</label>
            <input
              type="text"
              inputMode="decimal"
              pattern="^\d*\.?\d*$"
              min="0"
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 no-spinner"
              value={consumption}
              onChange={handleConsumptionChange}
              placeholder="Enter kWh"
              required
              autoComplete="off"
            />
            {errors.consumption && <div className="text-red-600 text-xs mt-1">{errors.consumption}</div>}
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Attach File(s)</label>
            <input
              ref={fileInputRef}
              type="file"
              className="w-full"
              multiple
              onChange={handleFilesChange}
              accept={allowedTypes.join(",")}
              style={{ color: "transparent" }}
            />
            {errors.files && <div className="text-red-600 text-xs mt-1">{errors.files}</div>}
            <div
              className="mt-2 flex flex-col gap-2 bg-gray-50 rounded border border-gray-200 max-h-40 overflow-y-auto p-2"
              style={{ minHeight: files.length ? "48px" : undefined }}
            >
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center bg-gray-100 rounded px-3 py-1 mb-1">
                  <button
                    type="button"
                    className="flex items-center flex-1 hover:bg-blue-100 rounded text-left focus:outline-none"
                    onClick={() => handlePreview(file)}
                    tabIndex={0}
                  >
                    {getFileIcon(file)}
                    <span className="truncate">{file.name}</span>
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-red-500 hover:text-red-700 font-bold text-lg px-2 focus:outline-none"
                    onClick={() => handleRemoveFile(idx)}
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          {message && (
            <div className={`mb-4 ${message.includes("success") ? "bg-green-50 border-l-4 border-green-500" : "bg-red-50 border-l-4 border-red-500"} p-4 rounded-md animate-fadeIn`}>
              <p className="text-sm">{message}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-5 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold transition-colors"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-colors flex items-center"
              disabled={saving}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
        {previewFile && previewUrl && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
            <div className="bg-white rounded-lg p-4 max-w-lg w-full shadow-2xl relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl font-bold"
                onClick={handleClosePreview}
                aria-label="Close preview"
              >
                ×
              </button>
              {previewFile.type.startsWith("image/") ? (
                <img src={previewUrl} alt={previewFile.name} className="max-w-full max-h-96 mx-auto" />
              ) : previewFile.type === "application/pdf" ? (
                <iframe src={previewUrl} title={previewFile.name} className="w-full h-96" />
              ) : (
                <div className="text-center">Cannot preview this file type.</div>
              )}
              <div className="mt-2 text-sm text-gray-700 text-center">{previewFile.name}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
