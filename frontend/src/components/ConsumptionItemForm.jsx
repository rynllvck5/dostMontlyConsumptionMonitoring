import React, { useState, useCallback } from 'react';
import ImageUpload from './ImageUpload';

const ConsumptionItemForm = ({ item, onSubmit, onClose, periods, successMessage }) => {
  const [itemName, setItemName] = useState(item?.item_name || '');
  const [kilowatts, setKilowatts] = useState(item?.kilowatts || '');
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [itemModel, setItemModel] = useState(item?.item_model || '');
  const [images, setImages] = useState(item?.images || []);
  const [deletedImages, setDeletedImages] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    
    // Validation
    if (!itemName.trim()) {
      setError('Item name is required.');
      return;
    }
    if (!kilowatts || isNaN(Number(kilowatts)) || Number(kilowatts) <= 0) {
      setError('Please enter a valid kilowatts value.');
      return;
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('item_name', itemName.trim());
      formData.append('kilowatts', kilowatts);
      formData.append('quantity', quantity);
      formData.append('item_model', itemModel);
      
      // Append only File objects (new images)
      const newImages = images.filter(image => image instanceof File);
      newImages.forEach(image => {
        formData.append('images', image);
      });

      // If editing, append existing image filenames
      if (item?.id) {
        const existingImages = images.filter(image => typeof image === 'string');
        formData.append('existing_images', JSON.stringify(existingImages));
        // Also append deleted images if any
        if (deletedImages.length > 0) {
          formData.append('deleted_images', JSON.stringify(deletedImages));
        }
      }

      await onSubmit(formData);
      // Don't close the form after submission to allow success message to show
    } catch (err) {
      setError('Failed to save item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = useCallback((newImages) => {
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const handleRemoveImage = useCallback((index) => {
    setImages(prev => {
      const newImages = [...prev];
      const removedImage = newImages[index];
      // If the removed image is a string (existing image), add it to deletedImages
      if (typeof removedImage === 'string') {
        setDeletedImages(prev => [...prev, removedImage]);
      }
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 font-semibold text-gray-700">Item Name</label>
        <input
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={itemName}
          onChange={e => setItemName(e.target.value)}
          placeholder="Enter item name"
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold text-gray-700">Kilowatts Consumed</label>
        <input
          type="number"
          step="0.01"
          min="0"
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={kilowatts}
          onChange={e => setKilowatts(e.target.value)}
          required
          inputMode="decimal"
          placeholder="e.g. 12.34"
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold text-gray-700">Quantity</label>
        <input
          type="number"
          min="1"
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          required
          placeholder="e.g. 1"
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold text-gray-700">Item Model</label>
        <input
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={itemModel}
          onChange={e => setItemModel(e.target.value)}
          placeholder="e.g. Intel(R) Core(TM) i7-14700HX (28 CPUs), ~2.1GHz"
        />
      </div>
      
      <ImageUpload
        images={images}
        onImageChange={handleImageChange}
        onRemoveImage={handleRemoveImage}
      />

      {error && (
        <div className="text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-row items-center justify-between gap-2 pt-2 w-full flex-wrap">
        <div className="flex-grow flex items-center">
          {successMessage && (
            <div className="flex items-center gap-2 bg-green-50 border-l-4 border-green-500 px-4 py-2 rounded-md animate-fadeIn">
              <svg className="h-5 w-5 text-green-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.293-6.293a1 1 0 011.414 0l3-3a1 1 0 00-1.414-1.414L10 9.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 text-sm font-medium">{successMessage}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              item ? 'Update' : 'Create'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ConsumptionItemForm;