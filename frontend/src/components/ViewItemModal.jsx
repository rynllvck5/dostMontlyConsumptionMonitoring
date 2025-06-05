import React, { useState, useEffect, useCallback } from 'react';
import ImageViewerModal from './ImageViewerModal';

// Helper to resolve image URL
function getImageUrl(image) {
  if (!image) return '/images/no-image.png';
  if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/'))) {
    return image;
  }
  // Otherwise, assume it's a filename stored in item-uploads folder
  return `/images/item-uploads/${image}`;
}

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

  // ESC key handler for closing modals
  const handleEsc = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        if (imageViewerOpen) {
          setImageViewerOpen(false);
        } else if (open) {
          onClose();
        }
      }
    },
    [imageViewerOpen, open, onClose]
  );

  useEffect(() => {
    if (open || imageViewerOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [open, imageViewerOpen, handleEsc]);

  // Image navigation handlers (move above useEffect to fix ReferenceError)
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

  // Arrow key handler for image navigation
  useEffect(() => {
    if (!open || !item || !item.images || item.images.length === 0) return;

    const handleArrow = (e) => {
      if (imageViewerOpen) return; // Don't interfere with image viewer modal
      if (e.key === 'ArrowRight') {
        handleNextImage();
      }
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      }
    };

    window.addEventListener('keydown', handleArrow);
    return () => window.removeEventListener('keydown', handleArrow);
  }, [open, imageViewerOpen, handleNextImage, handlePrevImage, item?.images]);

  if (!open || !item) return null;

  const hasImages = item && item.images && item.images.length > 0;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900 bg-opacity-40"
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
      >
        <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <h2 className="text-xl font-bold text-neutral-800">{item.item_name}</h2>
            <button
              className="text-neutral-400 hover:text-neutral-700 text-2xl font-bold rounded transition-colors focus:outline-none"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          <div className="p-6 flex flex-col gap-8">
            {/* Details */}
            <section>
              <h3 className="text-lg font-semibold text-neutral-700 mb-4">Item Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <div className="text-neutral-500 text-sm">Kilowatts</div>
                  <div className="text-base font-medium text-neutral-900">
                    {Number(item.kilowatts).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-sm">Quantity</div>
                  <div className="text-base font-medium text-neutral-900">{item.quantity}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-neutral-500 text-sm">Item Model</div>
                  <div className="text-base font-medium text-neutral-900 break-words">
                    {item.item_model ? item.item_model : <span className="italic text-neutral-400">N/A</span>}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-neutral-500 text-sm">Total Consumption</div>
                  <div className="text-base font-medium text-neutral-900">
                    {(Number(item.kilowatts) * Number(item.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-sm">Date Added</div>
                  <div className="text-base text-neutral-700">{new Date(item.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-sm">Last Updated</div>
                  <div className="text-base text-neutral-700">{item.updated_at ? new Date(item.updated_at).toLocaleString() : '—'}</div>
                </div>
              </div>
            </section>

            {/* Images */}
            <section>
              <h3 className="text-lg font-semibold text-neutral-700 mb-4">Images</h3>
              {hasImages ? (
                <div>
                  <div className="relative w-full bg-neutral-100 rounded-md border border-neutral-200 mb-3 flex items-center justify-center" style={{ height: '120px' }}>
                    <img
                      src={getImageUrl(item.images[selectedImageIndex])}
                      alt={`Image ${selectedImageIndex + 1}`}
                      className="max-h-24 object-contain mx-auto cursor-pointer"
                      onClick={() => setImageViewerOpen(true)}
                      onError={e => {
                        e.target.onerror = null;
                        e.target.src = '/images/no-image.png';
                      }}
                      tabIndex={0}
                      aria-label="View larger image"
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') setImageViewerOpen(true);
                      }}
                    />
                    {item.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-200 transition"
                          aria-label="Previous image"
                        >
                          Prev
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-200 transition"
                          aria-label="Next image"
                        >
                          Next
                        </button>
                      </>
                    )}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white bg-opacity-80 text-neutral-700 px-2 py-0.5 rounded text-xs font-medium border border-neutral-200">
                      {selectedImageIndex + 1} / {item.images.length}
                    </div>
                  </div>
                  {item.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {item.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`w-10 h-10 rounded border transition-colors ${
                            index === selectedImageIndex
                              ? 'border-neutral-700'
                              : 'border-neutral-200'
                          }`}
                          aria-label={`Select image ${index + 1}`}
                        >
                          <img
                            src={getImageUrl(image)}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover rounded"
                            onError={e => {
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
                <div className="text-neutral-400 italic text-center py-8">No images available</div>
              )}
            </section>
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