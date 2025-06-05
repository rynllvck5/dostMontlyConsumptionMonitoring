import React from 'react';

function getOfficeDisplay(office) {
  if (!office) return '';
  if (office.trim().toUpperCase() === 'RSTL') return 'RSTL';
  if (/dost/i.test(office)) return office;
  return `DOST - ${office}`;
}

export default function ElectricityBarChartHeader({ office, onAddConsumptionRecord, onPrintReport, variant }) {
  return (
    <div className="w-full flex flex-row items-center justify-between mb-2">
      {/* Left: Office text */}
      <span className={
        variant === 'card'
          ? "text-base font-extrabold text-blue-900 tracking-wide drop-shadow-sm"
          : "text-xs font-normal text-gray-700"
      }>
        {getOfficeDisplay(office) || 'Regional Office'}
      </span>
      {/* Right: Icons */}
      <div className={variant === 'card' ? "flex flex-row items-center gap-4" : "flex flex-row items-center gap-3"}>
        <div
          className={
            variant === 'card'
              ? "bg-blue-900 rounded-lg p-1 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg"
              : "bg-blue-900 rounded-lg p-1 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          }
          title="Add Consumption Record"
          onClick={typeof onAddConsumptionRecord === 'function' ? onAddConsumptionRecord : undefined}
        >
          <img
            src="/images/add-consumption-record.svg"
            alt="Add Consumption Record"
            className={variant === 'card' ? "h-5 w-5" : "h-5 w-5"}
          />
        </div>
        <div
          className={
            variant === 'card'
              ? "bg-blue-900 rounded-lg p-1 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg"
              : "bg-blue-900 rounded-lg p-1 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          }
          title="Print Report"
          onClick={typeof onPrintReport === 'function' ? onPrintReport : undefined}
        >
          <img
            src="/images/print-report.svg"
            alt="Print Report"
            className={variant === 'card' ? "h-5 w-5" : "h-5 w-5"}
          />
        </div>
      </div>
    </div>
  );
}
