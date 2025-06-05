import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Label } from 'recharts';
import ElectricityConsumptionBarChart from './ElectricityConsumptionBarChart';

import ReactModal from 'react-modal';
import ElectricityBarChartHeader from './ElectricityBarChartHeader';

export default function ElectricityConsumptionChart({ onAddConsumptionRecord = () => {} }) {
  const [data, setData] = useState([]);
  const [reportYear, setReportYear] = useState('');
  const [allMonths, setAllMonths] = useState([
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]);
  const [office, setOffice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/electricity/office-consumption', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const result = await res.json();
        // Support new API response shape: { year, data }
        if (result && result.data && result.year) {
          setData(result.data);
          setReportYear(result.year);
        } else {
          setData(result);
          setReportYear('');
        }
        setAllMonths([
          'January','February','March','April','May','June',
          'July','August','September','October','November','December'
        ]);


        // Try to get office info from user profile endpoint
        const profileRes = await fetch('/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          // Prefer office_name for display, fallback to blank
          setOffice(profile.office_name || '');
        }
      } catch (e) {
        setError('Could not load chart data.');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const [preview, setPreview] = useState({ open: false, type: null });
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  console.log('ElectricityConsumptionChart data:', data);
  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 w-full">
      {/* Line Graph Card */}
      <div className="flex-[1.4] mb-6 rounded-xl border border-gray-300 bg-gray-50 shadow hover:shadow-lg transition-all p-4 flex flex-col items-center relative min-w-0">
        {/* Date at the top */}
        <div className="w-full flex flex-col items-start mb-10">
  <span className="text-2xl text-blue-900">{dateString}</span>
</div>
        {/* Line Graph */}
        <div className="w-full h-56 flex items-center" style={{ cursor: 'pointer' }} onClick={() => setPreview({ open: true, type: 'line' })}>
          {loading ? (
            <div className="text-gray-500 w-full text-center">Loading...</div>
          ) : error ? (
            <div className="text-red-600 w-full text-center">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 9 }} interval="preserveStartEnd" angle={-20} textAnchor="end" height={40} type="category" domain={allMonths} allowDuplicatedCategory={false}>
                
                </XAxis>
                <YAxis tick={{ fontSize: 9 }} width={70}>
                
                </YAxis>
                <Tooltip wrapperStyle={{ fontSize: 11 }} formatter={value => `₱${value}`} labelFormatter={label => `Month: ${label}`} />
                <Line type="monotone" dataKey="peso" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, stroke: '#ef4444', fill: '#fff' }} activeDot={{ r: 7 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      {/* Bar Graph Card */}
      <div className="flex-[0.7] min-w-0">
        <ElectricityConsumptionBarChart
          data={data}
          office={office}
          allMonths={allMonths}
          loading={loading}
          error={error}
          onClickPreview={() => setPreview({ open: true, type: 'bar' })}
          onAddConsumptionRecord={onAddConsumptionRecord}
          reportYear={reportYear}
        />
      </div>
    </div>
    {/* Modal for Graph Preview */}
    <ReactModal
      isOpen={preview.open}
      onRequestClose={() => setPreview({ open: false, type: null })}
      contentLabel="Graph Preview"
      ariaHideApp={false}
      style={{
        overlay: { zIndex: 1000, background: 'rgba(0,0,0,0.6)' },
        content: { maxWidth: 900, margin: 'auto', borderRadius: 16, padding: 0, border: 'none', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }
      }}
    >
      <button
        onClick={() => setPreview({ open: false, type: null })}
        className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-full p-2 z-10"
        style={{ fontSize: 18 }}
        aria-label="Close preview"
      >
        &times;
      </button>
      <div className="w-full flex flex-col items-center p-6">
         {preview.type === 'line' && (
           <>
             <div className="w-full flex flex-col items-center mb-4">
               <span className="text-xs font-semibold text-gray-700">{dateString}</span>
             </div>
             <ResponsiveContainer width={"100%"} height={400} minWidth={600}>
               <LineChart data={data} margin={{ top: 30, right: 50, left: 30, bottom: 20 }}>
                 <XAxis
                   dataKey="month"
                   tick={{ fontSize: 18 }}
                   interval={0}
                   angle={-30}
                   textAnchor="end"
                   height={80}
                   type="category"
                   domain={allMonths}
                   allowDuplicatedCategory={false}
                 >
                   <Label value="Month" position="insideBottom" offset={1} style={{ fontSize: 18, fontWeight: 700, fill: '#334155' }} textAnchor="middle" />
                   </XAxis>
                 <YAxis tick={{ fontSize: 18 }} width={80}>
                 <Label value="Consumption (Peso)" angle={-90} position="insideLeft" offset={1} style={{ fontSize: 18, fontWeight: 700, fill: '#334155' }} textAnchor="middle" />                 </YAxis>
                 <Tooltip wrapperStyle={{ fontSize: 18 }} formatter={(value) => `₱${value}`} labelFormatter={label => `Month: ${label}`} />
                 <Line type="monotone" dataKey="peso" stroke="#ef4444" strokeWidth={4} dot={{ r: 8, stroke: '#ef4444', fill: '#fff' }} activeDot={{ r: 12 }} connectNulls={false} />
               </LineChart>
             </ResponsiveContainer>
           </>
         )}
        {preview.type === 'bar' && (
          <>
            <div className="w-full max-w-3xl mx-auto mb-4">
              <ElectricityBarChartHeader
                office={office}
                onAddConsumptionRecord={onAddConsumptionRecord}
                onPrintReport={() => { /* TODO: implement print report action */ }}
              />
            </div>
            <ResponsiveContainer width={"100%"} height={400} minWidth={600}>
              <BarChart data={data} margin={{ top: 30, right: 50, left: 30, bottom: 20 }} barCategoryGap={40} barGap={12}>
                 <XAxis
                   dataKey="month"
                   tick={{ fontSize: 18 }}
                   interval={0}
                   angle={-30}
                   textAnchor="end"
                   height={80}
                   type="category"
                   domain={allMonths}
                   allowDuplicatedCategory={false}
                 >
                   <Label value="Month" position="insideBottom" offset={1} style={{ fontSize: 18, fontWeight: 700, fill: '#334155' }} textAnchor="middle" />
                 </XAxis>
                 <YAxis tick={{ fontSize: 18 }} width={80}>
                 <Label value="Consumption (Peso)" angle={-90} position="insideLeft" offset={1} style={{ fontSize: 18, fontWeight: 700, fill: '#334155' }} textAnchor="bottom" />                 </YAxis>
                <Tooltip wrapperStyle={{ fontSize: 18 }} formatter={value => `₱${value}`} labelFormatter={label => `Month: ${label}`} />
                <Bar dataKey="peso" fill="#3b82f6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </ReactModal>
    </>
  );
}
