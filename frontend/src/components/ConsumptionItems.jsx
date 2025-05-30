import React, { useState, useEffect } from 'react';
import {
  getConsumptionItems,
  createConsumptionItem,
  updateConsumptionItem,
  deleteConsumptionItem
} from '../api';

function ItemModal({ open, onClose, onSubmit, initialData }) {
  const [itemName, setItemName] = useState(initialData?.item_name || '');
  const [kilowatts, setKilowatts] = useState(initialData?.kilowatts || '');
  const [error, setError] = useState('');

  useEffect(() => {
    setItemName(initialData?.item_name || '');
    setKilowatts(initialData?.kilowatts || '');
    setError('');
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError('Item name is required.');
      return;
    }
    if (!kilowatts || isNaN(Number(kilowatts)) || Number(kilowatts) <= 0) {
      setError('Please enter a valid kilowatts value.');
      return;
    }
    onSubmit({ item_name: itemName.trim(), kilowatts: parseFloat(kilowatts) });
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">{initialData ? 'Edit Item' : 'Register Item'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Item Name</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Kilowatts Consumed</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full border rounded px-3 py-2"
              value={kilowatts}
              onChange={e => setKilowatts(e.target.value)}
              required
              inputMode="decimal"
              placeholder="e.g. 12.34"
            />
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold">
            {initialData ? 'Update Item' : 'Register Item'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ConsumptionItems({ token }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getConsumptionItems(token, search);
      setItems(data.items || []);
    } catch (e) {
      setError('Failed to fetch items.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, [search]);

  const handleRegister = async (item) => {
    setLoading(true);
    try {
      await createConsumptionItem({ ...item, token });
      setModalOpen(false);
      fetchItems();
    } catch (e) {
      setError('Failed to register item.');
    }
    setLoading(false);
  };

  const handleEdit = async (item) => {
    setLoading(true);
    try {
      await updateConsumptionItem({ ...item, id: editItem.id, token });
      setEditItem(null);
      fetchItems();
    } catch (e) {
      setError('Failed to update item.');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setLoading(true);
    try {
      await deleteConsumptionItem({ id, token });
      fetchItems();
    } catch (e) {
      setError('Failed to delete item.');
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold">Registered Items</h2>
        <button
          className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center"
          onClick={() => { setEditItem(null); setModalOpen(true); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Register Item
        </button>
      </div>
      <div className="mb-4">
        <input
          className="w-full md:w-1/2 border rounded px-3 py-2"
          placeholder="Search items by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kilowatts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-6">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-6 text-gray-400">No items found.</td></tr>
            ) : items.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap font-semibold">{item.item_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{Number(item.kilowatts).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(item.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap flex gap-2 justify-center">
                  <button className="text-blue-600 hover:text-blue-800" title="View" onClick={() => alert(`Item: ${item.item_name}\nKilowatts: ${item.kilowatts}`)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                  <button className="text-green-600 hover:text-green-800" title="Edit" onClick={() => { setEditItem(item); setModalOpen(true); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-1 0v14m-7-7h14" /></svg>
                  </button>
                  <button className="text-red-600 hover:text-red-800" title="Delete" onClick={() => handleDelete(item.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ItemModal
        open={modalOpen || !!editItem}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSubmit={editItem ? handleEdit : handleRegister}
        initialData={editItem}
      />
    </div>
  );
}

export default ConsumptionItems; 