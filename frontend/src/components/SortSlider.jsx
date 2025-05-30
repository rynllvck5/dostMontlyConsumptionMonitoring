import React from 'react';

const SortSlider = ({ sortBy, sortOrder, onSortChange }) => {
  const sortOptions = [
    { value: 'kilowatts', label: 'Kilowatts' },
    { value: 'total_kw', label: 'Total kW' },
    { value: 'created_at', label: 'Date' }
  ];

  const handleSortClick = (value) => {
    onSortChange(value);
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
      <span className="text-sm font-medium text-gray-700">Sort by:</span>
      <div className="flex-1 flex items-center gap-2">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSortClick(option.value)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === option.value
                ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              {option.label}
              {sortBy === option.value && (
                <span className="text-xs font-bold">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SortSlider; 