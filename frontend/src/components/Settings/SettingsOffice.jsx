import React, { useEffect, useState } from 'react';

export default function SettingsOffice() {
  // Filter/search state for history
  const [historyFilter, setHistoryFilter] = useState('');

  // Compute filtered history for display (move logic out of JSX)
  function getFilteredHistory(history, historyFilter) {
    if (!historyFilter) return history;
    const filter = historyFilter.toLowerCase();
    return history.filter(log => {
      const user = `${log.first_name || ''} ${log.last_name || ''} ${log.email || ''} ${log.modified_by || ''}`.toLowerCase();
      // Check summary
      const summary = (() => {
        try {
          const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes || {};
          const isNewFormat = Object.values(changes).every(
            v => v && typeof v === 'object' && 'before' in v && 'after' in v
          );
          if (isNewFormat) {
            const diffs = Object.entries(changes);
            if (diffs.length === 0) return 'No visible changes.';
            return `${diffs.length} field${diffs.length > 1 ? 's' : ''} changed`;
          }
          const before = changes.before || {};
          const after = changes.after || {};
          const fields = ['building_description','gross_area','air_conditioned_area','number_of_occupants','office_account_no'];
          const diffs = fields.filter(f => before[f] !== after[f]);
          if (diffs.length === 0) return 'No visible changes.';
          return `${diffs.length} field${diffs.length > 1 ? 's' : ''} changed`;
        } catch (e) {
          return 'Unable to parse changes.';
        }
      })().toLowerCase();
      // Check if filter matches changed field names
      let changedFields = [];
      try {
        const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes || {};
        const isNewFormat = Object.values(changes).every(
          v => v && typeof v === 'object' && 'before' in v && 'after' in v
        );
        if (isNewFormat) {
          changedFields = Object.keys(changes).filter(f => changes[f] && changes[f].before !== changes[f].after);
        } else {
          const before = changes.before || {};
          const after = changes.after || {};
          changedFields = ['building_description','gross_area','air_conditioned_area','number_of_occupants','office_account_no'].filter(f => before[f] !== after[f]);
        }
      } catch {}
      // Map field keys to readable names
      const changedFieldNames = changedFields.map(f => {
        switch(f) {
          case 'building_description': return 'building description';
          case 'gross_area': return 'gross area';
          case 'air_conditioned_area': return 'air conditioned area';
          case 'number_of_occupants': return 'number of occupants';
          case 'office_account_no': return 'office account no';
          default: return f.replace(/_/g, ' ');
        }
      });
      const fieldMatch = changedFieldNames.some(name => name.includes(filter));
      return user.includes(filter) || summary.includes(filter) || fieldMatch;
    });
  }


  const [office, setOffice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Office history log state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  // Editable fields
  const [buildingDescription, setBuildingDescription] = useState('');
  const [grossArea, setGrossArea] = useState('');
  const [airConditionedArea, setAirConditionedArea] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [numberOfOccupants, setNumberOfOccupants] = useState('');
  const [officeAccountNo, setOfficeAccountNo] = useState('');

  useEffect(() => {
    async function fetchOffice() {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const token = localStorage.getItem('token');
        // Fetch profile to get office_id
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
        const resProfile = await fetch(`${API_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resProfile.ok) throw new Error('Failed to fetch profile.');
        const profile = await resProfile.json();
        if (!profile.office_id) throw new Error('No office assigned.');
        // Fetch office details
        const officeRes = await fetch(`/api/offices/${profile.office_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!officeRes.ok) throw new Error('Failed to fetch office details.');
        const officeData = await officeRes.json();
        setOffice(officeData);
        setBuildingDescription(officeData.building_description || '');
        setGrossArea(officeData.gross_area || '');
        setAirConditionedArea(officeData.air_conditioned_area || '');
        setNumberOfOccupants(officeData.number_of_occupants || '');
        setOfficeAccountNo(officeData.office_account_no || '');
      } catch (err) {
        setError(err.message || 'Failed to load office details.');
      }
      setLoading(false);
    }
    async function fetchHistory(officeId, token) {
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/offices/${officeId}/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const logs = await res.json();
          setHistory(logs);
        } else {
          setHistory([]);
        }
      } catch (err) {
        setHistory([]);
      }
      setHistoryLoading(false);
    }
    async function init() {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const token = localStorage.getItem('token');
        // Fetch profile to get office_id
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
        const resProfile = await fetch(`${API_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resProfile.ok) throw new Error('Failed to fetch profile.');
        const profile = await resProfile.json();
        if (!profile.office_id) throw new Error('No office assigned.');
        // Fetch office details
        const officeRes = await fetch(`/api/offices/${profile.office_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!officeRes.ok) throw new Error('Failed to fetch office details.');
        const officeData = await officeRes.json();
        setOffice(officeData);
        setBuildingDescription(officeData.building_description || '');
        setGrossArea(officeData.gross_area || '');
        setAirConditionedArea(officeData.air_conditioned_area || '');
        setNumberOfOccupants(officeData.number_of_occupants || '');
        setOfficeAccountNo(officeData.office_account_no || '');
        setOfficeAddress(officeData.office_address || '');
        // Fetch history log
        fetchHistory(profile.office_id, token);
      } catch (err) {
        setError(err.message || 'Failed to load office details.');
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/offices/${office.office_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          building_description: buildingDescription,
          gross_area: grossArea,
          air_conditioned_area: airConditionedArea,
          number_of_occupants: numberOfOccupants,
          office_account_no: officeAccountNo,
          office_address: officeAddress
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update office.');
      }
      setSuccess('Office details updated successfully.');
      // Immediately refresh modification history
      await (async () => {
        setHistoryLoading(true);
        try {
          const res = await fetch(`/api/offices/${office.office_id}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const logs = await res.json();
            setHistory(logs);
          }
        } catch {}
        setHistoryLoading(false);
      })();
    } catch (err) {
      setError(err.message || 'Failed to update office.');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8">Loading office details...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  // Compute filtered history just before rendering
  const filteredHistory = getFilteredHistory(history, historyFilter);

  return (
    <>
      <div className="flex flex-col md:flex-row p-2 md:p-4 gap-4 w-full transition-all duration-300 min-h-0">
        {/* Main form - Stylish Card */}
        <div className="flex-1 max-w-lg bg-white rounded-md shadow p-4 transition-all duration-300 animate-fadeIn">
          <h2 className="text-sm font-bold mb-4 text-blue-900 tracking-tight">Office Settings</h2>
          <form className="space-y-3" onSubmit={handleSubmit}>
            {/* Office Unit (View Only) */}
            {office && office.office_unit && (
              <div className="group transition-all">
                <label className="block font-semibold mb-1 text-sm text-gray-700">Office Unit</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={office.office_unit}
                  readOnly
                  tabIndex={-1}
                />
              </div>
            )}
            {/* Building Description */}
            <div className="group transition-all">
              <label className="block font-semibold mb-1 text-sm text-gray-700">Building Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[48px] max-h-[96px]"
                value={buildingDescription}
                onChange={e => setBuildingDescription(e.target.value)}
                rows={2}
                placeholder="Describe the building..."
              />
            </div>
            {/* Gross Area */}
            <div className="group transition-all">
              <label className="block font-semibold mb-1 text-sm text-gray-700">Gross Area (sqm)</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={grossArea}
                onChange={e => setGrossArea(e.target.value)}
                placeholder="e.g. 1200"
              />
            </div>
            {/* Air Conditioned Area */}
            <div className="group transition-all">
              <label className="block font-semibold mb-1 text-sm text-gray-700">Air Conditioned Area (sqm)</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={airConditionedArea}
                onChange={e => setAirConditionedArea(e.target.value)}
                placeholder="e.g. 800"
              />
            </div>
            {/* Number of Occupants */}
            <div className="group transition-all">
              <label className="block font-semibold mb-1 text-sm text-gray-700">Number of Occupants</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={numberOfOccupants}
                onChange={e => setNumberOfOccupants(e.target.value)}
                placeholder="e.g. 25"
              />
            </div>
            {/* Office Account No. */}
            <div className="group transition-all">
              <label className="block font-semibold mb-1 text-sm text-gray-700">Office Account No.</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={officeAccountNo}
                onChange={e => setOfficeAccountNo(e.target.value)}
                placeholder="Enter account number"
              />
            </div>
            {/* Office Address */}
            <div className="group transition-all">
              <label className="block font-semibold mb-1 text-sm text-gray-700">Office Address</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={officeAddress}
                onChange={e => setOfficeAddress(e.target.value)}
                placeholder="Enter office address"
              />
            </div>
            {/* Error/Success Messages */}
            {error && <div className="mt-2 text-red-700 bg-red-100 border border-red-300 p-2 rounded-md text-sm">{error}</div>}
            {success && <div className="mt-2 text-green-700 bg-green-100 border border-green-300 p-2 rounded-md text-sm">{success}</div>}
            {/* Save Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-2 rounded-sm shadow hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-semibold text-sm tracking-wide transition-all duration-200 mt-1"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Saving...</span>
              ) : 'Save Changes'}
            </button>
          </form>
        </div>
        {/* Separator */}
        <div className="hidden md:flex flex-col items-center justify-center px-4">
          <div className="w-[2px] h-40 bg-gradient-to-b from-blue-100 via-blue-300 to-blue-100 rounded animate-growIn" style={{ minHeight: 60 }} />
        </div>
        {/* History log - Stylish Card */}
        <div className="w-full md:max-w-lg mt-2 md:mt-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-md shadow p-3 md:p-3 transition-all duration-300 animate-fadeIn flex flex-col"
          style={{ maxHeight: '70vh', minHeight: '300px' }}
        >
          <h3 className="text-sm font-bold mb-2 text-blue-800 tracking-tight">Modification History</h3>
          {/* Filter/Search Bar */}
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              className="flex-1 border border-blue-200 rounded-sm px-2 py-1 text-xs focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="Filter by user, summary, or field..."
              value={historyFilter || ''}
              onChange={e => setHistoryFilter(e.target.value)}
              aria-label="Filter modification history"
            />
            {/* Info icon with tooltip */}
            <div className="relative group flex items-center">
              <svg className="w-4 h-4 text-blue-400 hover:text-blue-600 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
              </svg>
              <div className="absolute left-1/2 -translate-x-1/2 mt-4 w-48 bg-white text-xs text-gray-700 border border-blue-200 rounded shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none z-20 transition-opacity duration-200">
                Filter by user, summary, or changed field name (e.g., "Gross Area").
              </div>
            </div>
            {historyFilter && (
              <button
                className="text-xs text-blue-600 px-2 py-1 rounded-sm hover:bg-blue-100"
                onClick={() => setHistoryFilter('')}
                type="button"
                aria-label="Clear filter"
              >Clear</button>
            )}
          </div>
          {/* Scrollable history log */}
          <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: '55vh', minHeight: '200px' }}>
            {filteredHistory.map((log, idx) => {
              const summary = (() => {
                try {
                  const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes || {};
                  // New diff format: { field: { before, after }, ... }
                  const isNewFormat = Object.values(changes).every(
                    v => v && typeof v === 'object' && 'before' in v && 'after' in v
                  );
                  if (isNewFormat) {
                    const diffs = Object.entries(changes);
                    if (diffs.length === 0) return 'No visible changes.';
                    return `${diffs.length} field${diffs.length > 1 ? 's' : ''} changed`;
                  }
                  // Old format fallback
                  const before = changes.before || {};
                  const after = changes.after || {};
                  const fields = ['building_description','gross_area','air_conditioned_area','number_of_occupants','office_account_no'];
                  const diffs = fields.filter(f => before[f] !== after[f]);
                  if (diffs.length === 0) return 'No visible changes.';
                  return `${diffs.length} field${diffs.length > 1 ? 's' : ''} changed`;
                } catch (e) {
                  return 'Unable to parse changes.';
                }
              })();
              return (
                <div
                  key={log.log_id}
                  className={`border border-blue-200 rounded shadow bg-white hover:bg-blue-50 transition-all duration-200 cursor-pointer p-2 group relative animate-fadeInUp ${selectedLog === log.log_id ? 'ring-2 ring-blue-300' : ''}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  onClick={() => setSelectedLog(selectedLog === log.log_id ? null : log.log_id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-blue-900 transition-colors duration-200 group-hover:text-blue-700">{summary}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      {log.first_name || log.last_name || log.email || log.modified_by ? (
                        <>
                          <span className="font-semibold text-xs text-blue-700 mr-1">
                            Modified by: {log.first_name || ''} {log.last_name || ''}
                            {log.email ? ` (${log.email})` : (!log.first_name && !log.last_name && log.modified_by ? ` (${log.modified_by})` : '')}
                          </span>
                          <span className="text-gray-400">·</span>{' '}
                        </>
                      ) : null}
                      {new Date(log.modified_at).toLocaleString()}
                    </span>
                  </div>
                  {/* Animated details expansion */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${selectedLog === log.log_id ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}
                  >
                    {selectedLog === log.log_id && (
                      <div className="p-2 bg-blue-50 rounded border border-blue-100 animate-fadeIn">
                        <div className="mb-2 text-blue-800 font-semibold text-sm">Change Details:</div>
                        <table className="w-full text-xs mb-1">
                          <thead>
                            <tr>
                              <th className="text-left font-semibold">Field</th>
                              <th className="text-left">Before</th>
                              <th className="text-left">After</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              try {
                                const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes || {};
                                // List of all tracked fields
                                const trackedFields = ['building_description','gross_area','air_conditioned_area','number_of_occupants','office_account_no'];
                                // New diff format
                                const isNewFormat = Object.values(changes).every(
                                  v => v && typeof v === 'object' && 'before' in v && 'after' in v
                                );
                                if (isNewFormat) {
                                  return trackedFields.map(f => {
                                    const fieldDiff = changes[f];
                                    const beforeVal = fieldDiff ? fieldDiff.before : '';
                                    const afterVal = fieldDiff ? fieldDiff.after : beforeVal;
                                    const changed = fieldDiff && beforeVal !== afterVal;
                                    return (
                                      <tr key={f}>
                                        <td className="font-medium pr-2 text-blue-900">{f.replace(/_/g,' ')}</td>
                                        <td className={changed ? "pr-1 text-red-600 font-semibold text-xs" : "pr-1 text-gray-400 text-xs"}>{beforeVal !== undefined && beforeVal !== null && beforeVal !== '' ? beforeVal : '--'}</td>
                                        <td className={changed ? "pr-1 text-blue-700 font-semibold text-xs" : "pr-1 text-gray-400 text-xs"}>{afterVal !== undefined && afterVal !== null && afterVal !== '' ? afterVal : '--'}</td>
                                      </tr>
                                    );
                                  });
                                } else {
                                  // Old format fallback
                                  const before = changes.before || {};
                                  const after = changes.after || {};
                                  return trackedFields.map(f => {
                                    const changed = before[f] !== after[f];
                                    return (
                                      <tr key={f}>
                                        <td className="font-medium pr-2 text-blue-900">{f.replace(/_/g,' ')}</td>
                                        <td className={changed ? "pr-1 text-red-600 font-semibold text-xs" : "pr-1 text-gray-400 text-xs"}>{before[f] !== undefined && before[f] !== null && before[f] !== '' ? before[f] : '--'}</td>
                                        <td className={changed ? "pr-1 text-blue-700 font-semibold text-xs" : "pr-1 text-gray-400 text-xs"}>{after[f] !== undefined && after[f] !== null && after[f] !== '' ? after[f] : '--'}</td>
                                      </tr>
                                    );
                                  });
                                }
                              } catch {
                                return null;
                              }
                            })()}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}