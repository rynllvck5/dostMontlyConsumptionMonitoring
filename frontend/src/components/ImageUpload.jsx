import React, { useCallback } from 'react';

const MAX_IMAGES = 10;

const ImageUpload = ({ images, onImageChange, onRemoveImage }) => {
  const [error, setError] = React.useState("");
  const [showError, setShowError] = React.useState(false);
  const errorTimer = React.useRef(null);

  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    // Filter out any non-image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    // Limit to MAX_IMAGES images total
    const totalImages = images.length + imageFiles.length;
    if (totalImages > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      setShowError(true);
      if (errorTimer.current) clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => {
        setShowError(false);
        setError("");
      }, 2000);
      return;
    }
    setShowError(false);
    setError("");
    onImageChange(imageFiles);
    // Reset the input
    e.target.value = '';
  }, [images, onImageChange]);

  const getImageUrl = (image) => {
    if (typeof image === 'string') {
      return 'http://localhost:5000/item-uploads/' + image;
    }
    return URL.createObjectURL(image);
  };

  const handleRemoveClick = (e, index) => {
    e.preventDefault(); // Prevent any parent click events
    e.stopPropagation(); // Stop event bubbling
    onRemoveImage(index);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">Images</label>
          <p className="text-xs text-gray-500 mt-1">
            {images.length}/{MAX_IMAGES} images uploaded
          </p>
        </div>
        {images.length < MAX_IMAGES && (
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
        )}
        {images.length < MAX_IMAGES && (
          <label
            htmlFor="image-upload"
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Images
          </label>
        )}
      </div>
      {/* Styled error message for image upload */}
      {showError && error && (
        <div className="flex items-center gap-2 bg-red-50 border-l-4 border-red-500 px-4 py-2 rounded-md animate-fadeIn mt-1">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-700 text-sm font-medium">{error}</span>
        </div>
      )}

      
      {images && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200">
                <img
                  src={getImageUrl(image)}
                  alt={`Upload ${index + 1}`}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/no-image.png';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
                <button
                  type="button"
                  onClick={(e) => handleRemoveClick(e, index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 truncate">
                {typeof image === 'string' ? image : image.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 