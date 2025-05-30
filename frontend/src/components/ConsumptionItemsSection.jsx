import React, { useState, useEffect } from 'react';
import SortSlider from './SortSlider';
import ViewItemModal from './ViewItemModal';
import ConsumptionItemModal from './ConsumptionItemModal';
import ImageViewerModal from './ImageViewerModal';

const periods = ['per hour', 'per day'];

function ConsumptionItemsSection({ token }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  // API functions
  const getConsumptionItems = async (token, search = '', sortBy = 'created_at', sortOrder = 'desc', period = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (period) params.append('period', period);

    const url = `http://localhost:5000/api/items?${params.toString()}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return res.json();
  };

  const createConsumptionItem = async (formData, token) => {
    const res = await fetch('http://localhost:5000/api/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
      credentials: 'include',
    });
    return res.json();
  };

  const updateConsumptionItem = async (id, formData, token) => {
    const res = await fetch(`http://localhost:5000/api/items/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
      credentials: 'include',
    });
    return res.json();
  };

  const deleteConsumptionItem = async ({ id, token }) => {
    const res = await fetch(`http://localhost:5000/api/items/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return res.json();
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getConsumptionItems(token, search, sortBy, sortOrder, selectedPeriod);
      setItems(data.items || []);
    } catch (e) {
      setError('Failed to fetch items.');
      setSuccess('');
      setShowMessage(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [search, sortBy, sortOrder, selectedPeriod]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      if (selectedItem) {
        await updateConsumptionItem(selectedItem.id, formData, token);
        setSuccess('Item updated successfully!');
      } else {
        await createConsumptionItem(formData, token);
        setSuccess('Item created successfully!');
      }
      setError('');
      setShowMessage(true);
      fetchItems();
      
      // Set timeout to close the modal after showing the success message
      setTimeout(() => {
        closeModal();
        setShowMessage(false);
        setSuccess('');
      }, 1500);
    } catch (e) {
      setError('Failed to save item.');
      setSuccess('');
      setShowMessage(true);
    }
    setLoading(false);
  };

  const openModal = (item = null) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
const [showDeleteModal, setShowDeleteModal] = useState(false);

const handleDelete = (id) => {
  setDeleteTarget(id);
  setShowDeleteModal(true);
};

const confirmDelete = async () => {
  setShowDeleteModal(false);
  setLoading(true);
  try {
    await deleteConsumptionItem({ id: deleteTarget, token });
    setSuccess('Item deleted successfully!');
    setError('');
    setShowMessage(true);
    fetchItems();
  } catch (e) {
    setError('Failed to delete item.');
    setSuccess('');
    setShowMessage(true);
  }
  setLoading(false);
  setDeleteTarget(null);
};

const cancelDelete = () => {
  setShowDeleteModal(false);
  setDeleteTarget(null);
};

  // Auto-dismiss message modal after 2 seconds
  useEffect(() => {
    if (showMessage && (error || success)) {
      const timer = setTimeout(() => {
        setShowMessage(false);
        // Only clear messages not related to modal success
        if (!modalOpen) {
          setError('');
          setSuccess('');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showMessage, error, success, modalOpen]);

  const handleCloseMessage = () => {
    setShowMessage(false);
    // Only clear messages not related to modal success
    if (!modalOpen) {
      setError('');
      setSuccess('');
    }
  };

  return (
    <div className="p-6">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-40 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <svg className="h-7 w-7 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Delete Item</h3>
            </div>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold transition-colors"
                onClick={cancelDelete}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold transition-colors"
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={cancelDelete}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Success/Error Modal - Only show for errors or when not in create/edit modal */}
      {showMessage && (error || (success && !modalOpen)) && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn">
          <div className={`min-w-[320px] max-w-[90vw] flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border-l-4 ${error ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
            <div className="flex-shrink-0">
              {error ? (
                <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className={`flex-1 text-${error ? 'red' : 'green'}-700 text-base font-medium`}>
              {error || success}
            </div>
            <button
              className="ml-2 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={handleCloseMessage}
              aria-label="Close"
              tabIndex={0}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold">Registered Items</h2>
        <button
          className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center"
          onClick={() => openModal()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Register Item
        </button>
      </div>

      <div className="mb-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Search items by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
            >
              <option value="">All Periods</option>
              {periods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
        </div>
        
        <SortSlider
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSort}
        />
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kilowatts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total kW</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-6">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-6 text-gray-400">No items found.</td></tr>
            ) : items.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap font-semibold">{item.item_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{Number(item.kilowatts).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.period}</td>
                <td className="px-6 py-4 whitespace-nowrap">{(Number(item.kilowatts) * Number(item.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(item.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap flex gap-2 justify-center">
                  <button 
                    className="p-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors flex items-center gap-1.5" 
                    title="View Item"
                    onClick={() => {
                      setSelectedItem(item);
                      setViewModalOpen(true);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    
                  </button>
                  <button className="p-1 bg-green-600 text-white hover:bg-green-700 rounded transition-colors" title="Edit" onClick={() => openModal(item)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button className="p-1 bg-red-600 text-white hover:bg-red-700 rounded transition-colors" title="Delete" onClick={() => handleDelete(item.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Details Modal */}
      <ViewItemModal
        item={selectedItem}
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedItem(null);
        }}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        images={selectedItem?.images || []}
        open={imageViewerOpen}
        onClose={() => {
          setImageViewerOpen(false);
          setSelectedItem(null);
        }}
      />

      {/* Create/Edit Modal */}
      <ConsumptionItemModal
        open={modalOpen}
        onClose={closeModal}
        item={selectedItem}
        onSubmit={handleSubmit}
        periods={periods}
        successMessage={showMessage ? success : ''}
      />
    </div>
  );
}

export default ConsumptionItemsSection; 