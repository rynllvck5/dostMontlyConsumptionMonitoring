import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ElectricityUploadModal from './components/ElectricityUploadModal';

export default function ElectricityConsumption() {
  const navigate = useNavigate();
  
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex flex-col w-full min-h-[60vh]">
      <div className="flex items-center w-full mt-8 mb-4 px-8">
        <button 
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded shadow transition-colors flex items-center"
          onClick={() => navigate('/')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Home
        </button>
        <button
          className="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow transition-colors flex items-center"
          onClick={() => setUploadOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
          </svg>
          Upload Monthly Consumption
        </button>
      </div>
      <ElectricityUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
