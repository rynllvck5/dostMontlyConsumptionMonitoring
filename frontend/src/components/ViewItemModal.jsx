import React, { useState, useEffect } from 'react';
import ImageViewerModal from './ImageViewerModal';

const ViewItemModal = ({ item, open, onClose }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  // Reset or adjust selectedImageIndex when images array changes
  useEffect(() => {
    if (item?.images) {
      // If current index is invalid (>= length), reset to last image or 0
      if (selectedImageIndex >= item.images.length) {
        setSelectedImageIndex(Math.max(0, item.images.length - 1));
      }
    }
  }, [item?.images, selectedImageIndex]);

  if (!open || !item) return null;

  const hasImages = item.images && item.images.length > 0;

  const handlePrevImage = () => {
    setSelectedImageIndex(prev => 
      prev === 0 ? item.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex(prev => 
      prev === item.images.length - 1 ? 0 : prev + 1
    );
  };

  const getImageUrl = (filename) => {
    return 'http://localhost:5000/item-uploads/' + filename;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-2xl font-bold">{item.item_name}</h2>
            <button 
              className="text-gray-500 hover:text-red-500 text-2xl font-bold"
              onClick={onClose}
            >
              &times;
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side: Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Item Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-gray-600">Kilowatts:</p>
                  <p className="text-lg">{Number(item.kilowatts).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Quantity:</p>
                  <p className="text-lg">{item.quantity}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Period:</p>
                  <p className="text-lg">{item.period}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Total Consumption:</p>
                  <p className="text-lg">{(Number(item.kilowatts) * Number(item.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW</p>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-600">Date Added:</p>
                <p className="text-lg">{new Date(item.created_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Right side: Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Images {hasImages ? `(${item.images.length})` : ''}
              </h3>
              {hasImages ? (
                <div className="space-y-4">
                  {/* Main image */}
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(item.images[selectedImageIndex])}
                      alt={`Image ${selectedImageIndex + 1}`}
                      className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setImageViewerOpen(true)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/no-image.png';
                      }}
                    />
                    {item.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                      {selectedImageIndex + 1} / {item.images.length}
                    </div>
                  </div>
                  {/* Thumbnails */}
                  {item.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {item.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                            index === selectedImageIndex ? 'border-blue-500' : 'border-transparent'
                          }`}
                        >
                          <img
                            src={getImageUrl(image)}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/no-image.png';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 italic">No images available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        images={item.images || []}
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        initialIndex={selectedImageIndex}
      />
    </>
  );
};

export default ViewItemModal;