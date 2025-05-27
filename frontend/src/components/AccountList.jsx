import React, { useEffect, useState } from 'react';
import EditAccountModal from './EditAccountModal';
import CreateUserModal from './CreateUserModal';
import { handleTokenError } from '../utils/auth.jsx';

// ViewAccountModal component for displaying account details
function ViewAccountModal({ account, onClose }) {
  if (!account) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full transform transition-all animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Account Details</h3>
          <button 
            className="text-gray-500 hover:text-gray-700 transition-colors"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <img 
              src={account.profile_picture ? `/images/${account.profile_picture}` : '/images/default-profile.jpg'} 
              alt={account.username}
              className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
              onError={(e) => { e.target.src = '/images/default-profile.jpg'; }}
            />
            <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {account.role}
            </div>
          </div>
          <h4 className="text-lg font-bold text-gray-800">{account.username}</h4>
          <p className="text-gray-600">
            {account.first_name || account.last_name ? 
              `${account.first_name || ''} ${account.last_name || ''}`.trim() : 
              'No name set'}
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">Account Information</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Username</p>
              <p className="text-sm font-medium">{account.username}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="text-sm font-medium capitalize">{account.role}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">First Name</p>
              <p className="text-sm font-medium">{account.first_name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Name</p>
              <p className="text-sm font-medium">{account.last_name || 'Not set'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountList({ role, token, onCreateClick }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editAccount, setEditAccount] = useState(null);
  const [viewAccount, setViewAccount] = useState(null);
  const [deleteAccount, setDeleteAccount] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const userRole = localStorage.getItem('role'); // Get the currently logged-in user's role

  const fetchAccounts = async () => {
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`http://localhost:5000/api/auth/accounts?role=${role}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Fetched accounts:', data);
      const accountsList = Array.isArray(data) ? data : [];
      setAccounts(accountsList);
      setFilteredAccounts(accountsList);
    } catch (err) {
      setError('Failed to fetch accounts.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line
  }, [role]);

  // Filter accounts when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAccounts(accounts);
      return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const filtered = accounts.filter(account => {
      const username = account.username.toLowerCase();
      const firstName = (account.first_name || '').toLowerCase();
      const lastName = (account.last_name || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      
      return username.includes(term) || 
             firstName.includes(term) || 
             lastName.includes(term) || 
             fullName.includes(term);
    });
    
    setFilteredAccounts(filtered);
  }, [searchTerm, accounts]);

  const handleDeleteClick = (account) => {
    setDeleteAccount(account);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAccount) return;
    
    setDeleting(true);
    setError('');
    
    try {
      const res = await fetch(`http://localhost:5000/api/auth/account/${deleteAccount.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(data.message || `Account "${deleteAccount.username}" was deleted successfully.`);
      fetchAccounts();
        setTimeout(() => {
          setSuccess('');
          setShowDeleteModal(false);
          setDeleteAccount(null);
        }, 1500);
      } else if (!handleTokenError(data.message)) {
        setError(data.message || 'Failed to delete account.');
      }
    } catch (err) {
      setError('Failed to delete account. Please try again.');
      console.error('Delete error:', err);
    }
    
    setDeleting(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div>
      {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
      
      {/* Search bar */}
      <div className="mb-4 relative">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <div className="pl-3 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={`Search ${role === 'admin' ? 'admins' : 'users'} by name or username...`}
            className="w-full py-2 px-2 outline-none"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button 
              onClick={clearSearch}
              className="px-3 py-2 text-gray-500 hover:text-gray-700"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          {searchTerm ? (
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600">No {role === 'admin' ? 'admins' : 'users'} found matching "{searchTerm}"</p>
              <button 
                onClick={clearSearch} 
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-gray-600">No {role === 'admin' ? 'admins' : 'users'} found</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          {searchTerm && (
            <div className="mb-3 text-sm text-gray-500">
              Found {filteredAccounts.length} {filteredAccounts.length === 1 ? 'result' : 'results'} for "{searchTerm}"
            </div>
          )}
          <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-16 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                  <th scope="col" className="w-1/4 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th scope="col" className="w-1/3 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="w-1/6 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="w-28 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((acc, index) => (
                  <tr key={acc.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150`}>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                        <img 
                          src={acc.profile_picture ? `/images/${acc.profile_picture}` : '/images/default-profile.jpg'} 
                          alt={acc.username}
                          className="w-10 h-10 rounded-full object-cover inline-block"
                          onError={(e) => { e.target.src = '/images/default-profile.jpg'; }}
                        />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="text-sm font-medium text-gray-900 truncate mx-auto max-w-full">{acc.username}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="text-sm text-gray-900 truncate mx-auto max-w-full">
                        {acc.first_name || acc.last_name ? 
                          `${acc.first_name || ''} ${acc.last_name || ''}`.trim() : 
                          <span className="text-gray-400">Not set</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {acc.role}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-1">
                        <button 
                          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" 
                          onClick={() => setViewAccount(acc)}
                          title="View details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          className="p-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors" 
                          onClick={() => setEditAccount(acc)}
                          title="Edit account"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors" 
                          onClick={() => handleDeleteClick(acc)}
                          title="Delete account"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Account Modal */}
      {viewAccount && (
        <ViewAccountModal
          account={viewAccount}
          onClose={() => setViewAccount(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteAccount && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full transform transition-all animate-fadeIn">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">Are you sure you want to delete this account?</p>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="flex items-center">
                  <img 
                    src={deleteAccount.profile_picture ? `/images/${deleteAccount.profile_picture}` : '/images/default-profile.jpg'} 
                    alt={deleteAccount.username}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                    onError={(e) => { e.target.src = '/images/default-profile.jpg'; }}
                  />
                  <div>
                    <p className="font-medium">{deleteAccount.username}</p>
                    <p className="text-sm text-gray-500">
                      {deleteAccount.first_name || deleteAccount.last_name ? 
                        `${deleteAccount.first_name || ''} ${deleteAccount.last_name || ''}`.trim() : 
                        'No name set'}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-red-600 text-sm mt-3">This action cannot be undone.</p>
            </div>
            
            {/* Message container */}
            {(error || success) && (
              <div className="mb-4">
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-fadeIn">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md animate-fadeIn">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">{success}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium transition-colors"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteAccount(null);
                  setError('');
                }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors flex items-center"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {editAccount && (
        <EditAccountModal
          account={editAccount}
          token={token}
          editorRole={userRole} // Pass the currently logged-in user's role
          onClose={() => { setEditAccount(null); fetchAccounts(); }}
        />
      )}
    </div>
  );
}

