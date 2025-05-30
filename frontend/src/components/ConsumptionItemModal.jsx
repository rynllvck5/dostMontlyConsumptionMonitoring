import React from 'react';
import ConsumptionItemForm from './ConsumptionItemForm';

const ConsumptionItemModal = ({ open, onClose, item, onSubmit, periods, successMessage }) => {
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (successMessage) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successMessage, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6 relative">
        <button 
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl font-bold z-10"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">{item ? 'Edit Item' : 'Register Item'}</h2>
        <ConsumptionItemForm
          item={item}
          onSubmit={onSubmit}
          onClose={onClose}
          periods={periods}
          successMessage={successMessage}
        />
      </div>
    </div>
  );
};

export default ConsumptionItemModal;