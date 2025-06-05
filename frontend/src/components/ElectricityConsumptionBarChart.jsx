import React, { useRef } from 'react';
import jsPDF from 'jspdf/dist/jspdf.umd.min.js';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Label } from 'recharts';
import ElectricityBarChartHeader from './ElectricityBarChartHeader';

function getOfficeDisplay(office) {
  if (!office) return '';
  if (office.trim().toUpperCase() === 'RSTL') return 'RSTL';
  if (/dost/i.test(office)) return office;
  return `DOST - ${office}`;
}

export default function ElectricityConsumptionBarChart({ data, office, allMonths, loading, error, onClickPreview, onAddConsumptionRecord, reportYear }) {
  // Helper to extract office-wide fields from the first data row (if available)
  const getOfficeFields = () => {
    if (data && data.length > 0) {
      const row = data[0];
      return {
        building_description: row.building_description || '',
        gross_area: row.gross_area || '',
        air_conditioned_area: row.air_conditioned_area || '',
        number_of_occupants: row.number_of_occupants || '',
        office_account_no: row.office_account_no || '',
        office_address: row.office_address || ''
      };
    }
    return {
      building_description: '',
      gross_area: '',
      air_conditioned_area: '',
      number_of_occupants: '',
      office_account_no: '',
      office_address: ''
    };
  };

  const officeFields = getOfficeFields();
  // Handler for generating and opening the PDF report
  // Utility to fetch image as base64
  const getBase64FromUrl = async (url) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        resolve(reader.result);
      };
    });
  };

  const handlePrintReport = async () => {
    const doc = new jsPDF();

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('"Annex A"', 200, 12, { align: 'right' });
    doc.setFontSize(10);

    // Load and add the PNG logo as base64
    const logoBase64 = await getBase64FromUrl('/images/doe_logo.png');
    doc.addImage(logoBase64, 'PNG', 90, 10, 30, 30);

    doc.setFont('helvetica', 'bold');
    doc.text('DEPARTMENT OF ENERGY', 105, 44, { align: 'center' });
    doc.text('Energy Center, Rizal Drive, Bonifacio Global City, Taguig City', 105, 50, { align: 'center' });
    doc.text('Telefax: (632) 8840-2243,  Email: doe.gemp@gmail.com', 105, 56, { align: 'center' });
    // Blank line
    doc.text(' ', 105, 62, { align: 'center' });
    // Program title, centered and bold
    doc.text('GOVERNMENT ENERGY MANAGEMENT PROGRAM', 105, 68, { align: 'center' });
    doc.text(`Monthly Electricity Consumption Report, ${reportYear || '____'}`, 105, 74, { align: 'center' });

    //Add a blank line
    doc.text(' ', 105, 80, { align: 'center' });

    //Account no. aligned to the right
    doc.text(`Acct No.: ${officeFields.office_account_no || ''}`, 200, 86, { align: 'right' });

    //Add a new line
    doc.text(' ', 105, 92, { align: 'center' });


    // Move these lines lower if needed
    const agencyY = 98;
   
    doc.text('Agency:', 14, agencyY);
    doc.setFont('helvetica', 'normal');
    doc.text('DOST', 31, agencyY);
    doc.setFont('helvetica', 'bold');
    doc.text('Tel. Nos.:', 130, agencyY);

    // Underline after "Agency:"
    doc.line(29, agencyY + 1, 90, agencyY + 1); 
    // Underline after "Tel. Nos.:"
    doc.line(147, agencyY + 1, 205, agencyY + 1);

    //Add a new line
    doc.text(' ', 105, 104, { align: 'center' });

    // Move these lines lower if needed
    const addressY = 110;
   
    doc.text('Address: ', 14, addressY);
    doc.text('Fax Nos.:', 130, addressY);

    //Address value
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${officeFields.office_address || ''}`, 31, addressY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);

    // Underline after "Agency:"
    doc.line(29, addressY + 1, 90, addressY + 1); 
    // Underline after "Tel. Nos.:"
    doc.line(147, addressY + 1, 205, addressY + 1);

    //Add a new line
    doc.text(' ', 105, 116, { align: 'center' });

    const regionY = 122;

    doc.text('Region:', 14, regionY);
    doc.setFont('helvetica', 'normal');
    doc.text('1', 31, regionY);
    doc.setFont('helvetica', 'bold');
    doc.line(29, regionY + 1, 90, regionY + 1); 

    // Define table columns
    const tableColumn = [
      'Month',
      `Monthly Consumption Baseline, ${reportYear || '____'}`,
      'Building Description',
      'Gross Area (sq.m)',
      'Air-Conditioned Area (sq.m)',
      'Number of Occupants',
      'Monthly Consumption, kWh'
    ];

    // Calculate averages for baseline and consumption_kwh columns
    const baselineValues = data.map(row => Number(row.peso) || 0);
    const kwhValues = data.map(row => Number(row.consumption_kwh) || 0);
    const baselineAverage = baselineValues.length ? (baselineValues.reduce((acc, v) => acc + v, 0) / baselineValues.length) : 0;
    const kwhAverage = kwhValues.length ? (kwhValues.reduce((acc, v) => acc + v, 0) / kwhValues.length) : 0;

    // Debug log to verify data structure
    console.log('PDF Report Data:', data);
    // Define table rows, now including new fields
    const tableRows = data.map(row => [
      row.month || '',
      row.peso !== undefined ? row.peso : '',
      row.building_description || '',
      row.gross_area || '',
      row.air_conditioned_area || '',
      row.number_of_occupants || '',
      row.consumption_kwh !== undefined ? row.consumption_kwh : ''
    ]);

    // Add average row, aligning values in the correct columns
    tableRows.push([
      'Average',
      baselineAverage ? baselineAverage.toFixed(2) : '',
      '', '', '', '',
      kwhAverage ? kwhAverage.toFixed(2) : ''
    ]);

    // Debug: Log tableRows before generating PDF
    console.log('PDF Table Rows:', tableRows);

    // Add table to PDF
    doc.autoTable({
      startY: 134,
      head: [tableColumn],
      body: tableRows,
      styles: {
        fontSize: 9,
        halign: 'center', // Center all cell text
        valign: 'middle',
        textColor: 20, // Black text
        lineColor: [0, 0, 0], // Black border
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [255, 255, 255], // No background color
        textColor: 20, // Black text
        fontStyle: 'bold', // Bold header
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0], // Black border
        lineWidth: 0.5
      },
      bodyStyles: {
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0], // Black border
        lineWidth: 0.5
      },
      theme: 'grid',
      didDrawCell: (data) => {
        // No custom drawing needed
      }
    });

    const preparedY = 250;
    doc.text('Prepared By: ', 14, preparedY);
    doc.text('Noted by:', 130, preparedY);

    const nameY = preparedY + 12;

    doc.line(14, nameY + 1, 90, nameY + 1);
    doc.line(130, nameY + 1, 205, nameY + 1);

    doc.setFont('helvetica', 'normal');
    const positionY = nameY + 6;
    doc.text('Reporter Position', 14, positionY);
    doc.text('Validator Position', 130, positionY);

    // Save the PDF
    doc.save('report.pdf');
  };

  return (
    <>
      <div
        id="reportContent"
        className="flex-[1.4] mb-6 rounded-xl border border-gray-300 bg-gray-50 shadow hover:shadow-lg transition-all p-4 flex flex-col items-center relative min-w-0"
      >
        {/* Office/Unit Display and Action Icons */}
        <ElectricityBarChartHeader
          office={office}
          onAddConsumptionRecord={onAddConsumptionRecord}
          onPrintReport={handlePrintReport}
          variant="card"
        />
        {/* Bar Graph */}
        <div 
          className="w-full h-72 flex items-center" 
          style={{ cursor: 'pointer' }} 
          onClick={typeof onClickPreview === 'function' ? onClickPreview : undefined}
        >
          {loading ? (
            <div className="text-gray-500 w-full text-center">Loading...</div>
          ) : error ? (
            <div className="text-red-600 w-full text-center">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart 
                data={data} 
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }} 
                barCategoryGap={30} 
                barGap={8}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 350 }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={48}
                  type="category"
                  domain={allMonths}
                  allowDuplicatedCategory={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 350 }} 
                  width={70} 
                />
                <Tooltip 
                  wrapperStyle={{ fontSize: 11 }} 
                  formatter={value => `₱${value}`} 
                  labelFormatter={label => `Month: ${label}`} 
                />
                <Bar 
                  dataKey="peso" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}