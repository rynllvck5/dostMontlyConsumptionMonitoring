import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SortSlider from './SortSlider';
import ViewItemModal from './ViewItemModal';
import ConsumptionItemModal from './ConsumptionItemModal';
import ImageViewerModal from './ImageViewerModal';

function ConsumptionItemsSection({ token, forceArchivedView = false }) {
  const navigate = useNavigate();
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [items, setItems] = useState([]);
  // 'showArchived' determines if we display archived view (items with archived_quantity > 0)
  const [showArchived, setShowArchived] = useState(forceArchivedView ? true : false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [itemModel, setItemModel] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  // Ref for the filter popover and button
  const filterRef = useRef(null);

  // If forceArchivedView, always keep showArchived true
  useEffect(() => {
    if (forceArchivedView && !showArchived) setShowArchived(true);
  }, [forceArchivedView, showArchived]);

  // Click-away handler for filter popover
  useEffect(() => {
    if (!showFilterOptions) return;
    function handleClickOutside(event) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target)
      ) {
        setShowFilterOptions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterOptions]);

  // API functions
  const restoreConsumptionItem = async ({ id, token, quantity }) => {
    const res = await fetch(`http://localhost:5000/api/items/${id}/restore`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ quantity }),
    });
    return res.json();
  };

  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreQuantity, setRestoreQuantity] = useState(1);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const handleRestore = (item) => {
    setRestoreTarget(item);
    setRestoreQuantity(1);
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (!restoreTarget || restoreQuantity < 1 || restoreQuantity > restoreTarget.archived_quantity) return;
    setShowRestoreModal(false);
    setLoading(true);
    try {
      await restoreConsumptionItem({ id: restoreTarget.id, token, quantity: restoreQuantity });
      setSuccess('Item restored successfully!');
      setError('');
      setShowMessage(true);
      fetchItems();
    } catch (e) {
      setError('Failed to restore item.');
      setSuccess('');
      setShowMessage(true);
    }
    setLoading(false);
  };

  // Fetch items, using showArchived to determine if we want archived items (archived_quantity > 0) or inventory (quantity > 0)
  const getConsumptionItems = async (token, search = '', sortBy = 'created_at', sortOrder = 'desc', item_model = '', showArchived = false) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (item_model) params.append('item_model', item_model);
    params.append('showArchived', showArchived ? 'true' : 'false');

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

  const archiveConsumptionItem = async ({ id, token, quantity }) => {
    const res = await fetch(`http://localhost:5000/api/items/${id}/archive`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ quantity }),
    });
    return res.json();
  };

  // Always pass the search value as both name and model filter to backend.
  // Additionally, perform frontend filtering as a fallback to ensure user experience.
  const fetchItems = async () => {
    setLoading(true);
    try {
      // Pass search as both search and item_model
      const data = await getConsumptionItems(token, search, sortBy, sortOrder, search, showArchived);
      console.log('API response:', data);
      let fetchedItems = data.items || [];
      // Frontend fallback: filter by item name or model if search is not empty
      if (search.trim() !== '') {
        const searchLower = search.trim().toLowerCase();
        fetchedItems = fetchedItems.filter(item =>
          (item.item_name && item.item_name.toLowerCase().includes(searchLower)) ||
          (item.item_model && item.item_model.toLowerCase().includes(searchLower))
        );
      }
      console.log('Filtered items:', fetchedItems);
      setItems(fetchedItems);
    } catch (e) {
      setError('Failed to fetch items.');
      setSuccess('');
      setShowMessage(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, [search, sortBy, sortOrder, showArchived]);

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

  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveQuantity, setArchiveQuantity] = useState(1);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const handleArchive = (item) => {
    setArchiveTarget(item);
    setArchiveQuantity(1);
    setShowArchiveModal(true);
  };

  const confirmArchive = async () => {
    if (!archiveTarget || archiveQuantity < 1 || archiveQuantity > archiveTarget.quantity) return;
    setShowArchiveModal(false);
    setLoading(true);
    try {
      await archiveConsumptionItem({ id: archiveTarget.id, token, quantity: archiveQuantity });
      setSuccess('Item archived successfully!');
      setError('');
      setShowMessage(true);
      fetchItems();
    } catch (e) {
      setError('Failed to archive item.');
      setSuccess('');
      setShowMessage(true);
    }
    setLoading(false);
    setArchiveTarget(null);
    setArchiveQuantity(1);
  };

  const cancelArchive = () => {
    setShowArchiveModal(false);
    setArchiveTarget(null);
  };

  useEffect(() => {
    if (showMessage && (error || success)) {
      const timer = setTimeout(() => {
        setShowMessage(false);
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
    if (!modalOpen) {
      setError('');
      setSuccess('');
    }
  };

  return (
    <div className="p-6">
      {/* Loading Spinner Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        </div>
      )}
      {/* Archive Confirmation Modal */}
      {showArchiveModal && archiveTarget && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-40 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              {/* Archive icon: box/archive/folder */}
              <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-yellow-600">
                <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white">
                  <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth="2" stroke="white" fill="none" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h-8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
                </svg>
              </span>
              <h3 className="text-lg font-semibold text-gray-900">Archive Item</h3>
            </div>
            <p className="text-gray-700 mb-2">How many units of <span className="font-bold">{archiveTarget.item_name}</span> do you want to archive?</p>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={archiveTarget.quantity}
                  value={archiveQuantity}
                  onChange={e => setArchiveQuantity(e.target.value)}
                  className={`border rounded px-3 py-2 w-24 text-center mr-2 transition-all duration-150 ${(!archiveQuantity || isNaN(Number(archiveQuantity)) || Number(archiveQuantity) < 1 || Number(archiveQuantity) > archiveTarget.quantity) ? 'border-red-500 bg-red-50 animate-shake' : ''}`}
                  aria-invalid={!archiveQuantity || isNaN(Number(archiveQuantity)) || Number(archiveQuantity) < 1 || Number(archiveQuantity) > archiveTarget.quantity}
                  aria-describedby="archive-quantity-error"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-semibold text-gray-700 border border-gray-300"
                  onClick={() => setArchiveQuantity(archiveTarget.quantity)}
                  disabled={loading}
                  title={`Set to max (${archiveTarget.quantity})`}
                >
                  Max
                </button>
                <span className="text-gray-600">/ {archiveTarget.quantity} available</span>
              </div>
              {(!archiveQuantity || isNaN(Number(archiveQuantity)) || Number(archiveQuantity) < 1 || Number(archiveQuantity) > archiveTarget.quantity) && (
                <div id="archive-quantity-error" className="flex items-center gap-2 text-red-700 text-sm font-semibold mt-1">
                  <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                  Enter a valid quantity between 1 and {archiveTarget.quantity}.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold transition-colors"
                onClick={cancelArchive}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={confirmArchive}
                disabled={loading || !archiveQuantity || isNaN(Number(archiveQuantity)) || Number(archiveQuantity) < 1 || Number(archiveQuantity) > archiveTarget.quantity}
                title={!archiveQuantity || isNaN(Number(archiveQuantity)) || Number(archiveQuantity) < 1 || Number(archiveQuantity) > archiveTarget.quantity ? `Enter a valid quantity between 1 and ${archiveTarget.quantity}` : ''}
              >
                {loading ? 'Archiving...' : 'Archive'}
              </button>
            </div>
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={cancelArchive}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && restoreTarget && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-40 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              {/* Restore icon: box/archive/folder */}
              <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-green-600">
                <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white">
                  <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth="2" stroke="white" fill="none" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h-8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
                </svg>
              </span>
              <h3 className="text-lg font-semibold text-gray-900">Restore Item</h3>
            </div>
            <p className="text-gray-700 mb-2">How many units of <span className="font-bold">{restoreTarget.item_name}</span> do you want to restore?</p>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={restoreTarget.archived_quantity}
                  value={restoreQuantity}
                  onChange={e => setRestoreQuantity(e.target.value)}
                  className={`border rounded px-3 py-2 w-24 text-center mr-2 transition-all duration-150 ${(!restoreQuantity || isNaN(Number(restoreQuantity)) || Number(restoreQuantity) < 1 || Number(restoreQuantity) > restoreTarget.archived_quantity) ? 'border-red-500 bg-red-50 animate-shake' : ''}`}
                  aria-invalid={!restoreQuantity || isNaN(Number(restoreQuantity)) || Number(restoreQuantity) < 1 || Number(restoreQuantity) > restoreTarget.archived_quantity}
                  aria-describedby="restore-quantity-error"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-semibold text-gray-700 border border-gray-300"
                  onClick={() => setRestoreQuantity(restoreTarget.archived_quantity)}
                  disabled={loading}
                  title={`Set to max (${restoreTarget.archived_quantity})`}
                >
                  Max
                </button>
                <span className="text-gray-600">/ {restoreTarget.archived_quantity} archived</span>
              </div>
              {(!restoreQuantity || isNaN(Number(restoreQuantity)) || Number(restoreQuantity) < 1 || Number(restoreQuantity) > restoreTarget.archived_quantity) && (
                <div id="restore-quantity-error" className="flex items-center gap-2 text-red-700 text-sm font-semibold mt-1">
                  <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                  Enter a valid quantity between 1 and {restoreTarget.archived_quantity}.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold transition-colors"
                onClick={() => setShowRestoreModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={confirmRestore}
                disabled={loading || !restoreQuantity || isNaN(Number(restoreQuantity)) || Number(restoreQuantity) < 1 || Number(restoreQuantity) > restoreTarget.archived_quantity}
                title={!restoreQuantity || isNaN(Number(restoreQuantity)) || Number(restoreQuantity) < 1 || Number(restoreQuantity) > restoreTarget.archived_quantity ? `Enter a valid quantity between 1 and ${restoreTarget.archived_quantity}` : ''}
              >
                {loading ? 'Restoring...' : 'Restore'}
              </button>
            </div>
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={() => setShowRestoreModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
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
        {/* Title on its own line */}
        <h2 className="text-2xl font-bold mb-4 md:mb-0">
          {showArchived ? 'Archived Items' : 'Item Inventory'}
        </h2>
      </div>

      {/* Search and Buttons Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        {/* Combined Search Input */}
        <div className="flex-1">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Search items by name or model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {/* Buttons on the right */}
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          {/* Filter Icon Button */}
          <div className="relative mr-2" ref={filterRef}>
            <button
              className="p-2 rounded bg-blue-600 hover:bg-blue-700 text-white focus:outline-none border border-blue-700"
              onClick={() => setShowFilterOptions(v => !v)}
              title="Sort/Filter"
              type="button"
            >
              <img src="/images/filter.svg" alt="Filter" className="h-5 w-5" />
            </button>
            {/* Sort/Filter Popover */}
            {showFilterOptions && (
              <div className="absolute left-0 mt-2 z-30 bg-white border border-gray-300 rounded shadow-lg p-4 min-w-[200px] animate-fadeIn">
                <div className="font-semibold mb-2">Sort by</div>
                <button
                  className={`block w-full text-center px-3 py-2 rounded hover:bg-gray-100 ${sortBy === 'kilowatts' ? 'bg-blue-50 font-bold' : ''}`}
                  onClick={() => { setSortBy('kilowatts'); setSortOrder(sortBy === 'kilowatts' && sortOrder === 'asc' ? 'desc' : 'asc'); }}
                >
                  Kilowatts {sortBy === 'kilowatts' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  className={`block w-full text-center px-3 py-2 rounded hover:bg-gray-100 ${sortBy === 'total_kw' ? 'bg-blue-50 font-bold' : ''}`}
                  onClick={() => { setSortBy('total_kw'); setSortOrder(sortBy === 'total_kw' && sortOrder === 'asc' ? 'desc' : 'asc'); }}
                >
                  Total Kilowatts {sortBy === 'total_kw' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  className={`block w-full text-center px-3 py-2 rounded hover:bg-gray-100 ${sortBy === 'created_at' ? 'bg-blue-50 font-bold' : ''}`}
                  onClick={() => { setSortBy('created_at'); setSortOrder(sortBy === 'created_at' && sortOrder === 'asc' ? 'desc' : 'asc'); }}
                >
                  Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            )}
          </div>
          {/* Add Item Button (hidden when viewing archived) */}
          {!showArchived && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center"
              onClick={() => openModal()}
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          )}
          {/* Toggle Archived/Inventory Button */}
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center
              ${showArchived
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            onClick={() => navigate(showArchived ? '/pmo/item-inventory' : '/pmo/archived-items')}
          >
            {showArchived ? 'View Item Inventory' : 'View Archived Items'}
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 mb-2 font-semibold bg-red-50 border-l-4 border-red-400 px-4 py-2 rounded">{error}</div>}
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('kilowatts')}
              >
                Kilowatts {sortBy === 'kilowatts' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              {!showArchived && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              )}
              {showArchived && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Archived Quantity</th>
              )}
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[180px] w-48">Item Model</th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('total_kw')}
              >
                Total kW {sortBy === 'total_kw' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('created_at')}
              >
                Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-6">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-6 text-gray-400">No items found.</td></tr>
            ) : items.filter(item => showArchived ? (item.archived_quantity > 0) : (item.quantity > 0)).map(item => (
              <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-semibold text-center">{item.item_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{Number(item.kilowatts).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW</td>
                {!showArchived && (
                  <td className="px-6 py-4 whitespace-nowrap text-center">{item.quantity}</td>
                )}
                {showArchived && (
                  <td className="px-6 py-4 whitespace-nowrap text-center">{item.archived_quantity}</td>
                )}
                <td className="px-6 py-4 whitespace-nowrap max-w-[180px] w-48 overflow-hidden text-ellipsis text-center" style={{textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}} title={item.item_model || ''}>
                  {item.item_model ? (
                    item.item_model.length > 35 ? item.item_model.slice(0, 35) + '…' : item.item_model
                  ) : <span className="italic text-gray-400">N/A</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{(Number(item.kilowatts) * Number(item.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-center">{item.updated_at ? new Date(item.updated_at).toLocaleString() : ''}</td>
                <td className="px-6 py-4 whitespace-nowrap flex gap-2 justify-center">
                  <button 
                    className="p-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors flex items-center gap-1.5" 
                    title="View Item"
                    onClick={() => {
                      setSelectedItem(item);
                      setViewModalOpen(true);
                    }}
                    aria-label="View Item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  {!showArchived && (
                    <button className="p-1 bg-green-600 text-white hover:bg-green-700 rounded transition-colors" title="Edit" onClick={() => openModal(item)} aria-label="Edit Item">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {!showArchived ? (
                    <button className="p-1 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors" title="Archive" onClick={() => handleArchive(item)}>
                      {/* Archive icon: box/folder */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="white">
                        <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth="2" stroke="white" fill="none" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h-8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
                      </svg>
                    </button>
                  ) : (
                    <button className="p-1 bg-green-600 hover:bg-green-700 rounded transition-colors" title="Restore" onClick={() => handleRestore(item)}>
                      {/* Restore icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="white">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12v7a2 2 0 002 2h14a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v14" />
                      </svg>
                    </button>
                  )}
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
        successMessage={showMessage ? success : ''}
      />
    </div>
  );
}

export default ConsumptionItemsSection;