import React, { useState, useRef } from 'react';
import { handleTokenError } from '../utils/auth.jsx';

export default function EditAccountModal({ account, token, editorRole, onClose }) {
  console.log('Edit account data:', account);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [username, setUsername] = useState(account.username);
  const [firstName, setFirstName] = useState(account.first_name || '');
  const [lastName, setLastName] = useState(account.last_name || '');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetting, setResetting] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState(
    account.profile_picture 
      ? account.profile_picture.startsWith('http') 
        ? account.profile_picture 
        : `/images/${account.profile_picture}` 
      : '/images/default-profile.jpg'
  );
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    let newProfilePicFilename = null;
    // Username validation: no spaces
    if (/\s/.test(username)) {
      setError('Username must not contain spaces.');
      return;
    }
    try {
      // If a new profile picture file is selected, upload it first
      if (profilePicFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('profile_picture', profilePicFile);
        const uploadRes = await fetch('http://localhost:5000/api/auth/upload-profile-picture', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const uploadData = await uploadRes.json();
        setUploading(false);
        if (uploadData && uploadData.success && uploadData.filename) {
          newProfilePicFilename = uploadData.filename;
        } else {
          setError(uploadData.message || 'Failed to upload profile picture.');
          return;
        }
      }
      // Update account info, including new profile_picture filename if uploaded
      const res = await fetch(`http://localhost:5000/api/auth/account/${account.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          first_name: firstName,
          last_name: lastName,
          password: password || undefined,
          currentPassword: (account.role === 'user' && editorRole === 'user') ? currentPassword : undefined,
          profile_picture: newProfilePicFilename || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setPassword('');
        setCurrentPassword('');
        setSuccess(`Account for ${username} was updated successfully.`);
        setTimeout(onClose, 1500);
      } else {
        // Handle specific error messages
        if (data.message && data.message.includes('Username already exists')) {
          setError(`The username "${username}" is already taken.`);
        } else if (handleTokenError(data.message)) {
          // Token error is handled by the utility function
        } else {
          setError(data.message || 'Failed to update account. Please try again.');
        }
      }
    } catch (err) {
      setUploading(false);
      setError('An unexpected error occurred. Please try again or contact support.');
      console.error('Error updating account:', err);
    }
  };

  // Handle file input change for profile picture
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
        <h2 className="text-xl font-bold mb-4">Edit Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-col items-center">
            <label className="block text-gray-700 font-medium mb-1">Profile Picture</label>
            <div className="relative group cursor-pointer" onClick={() => setShowImageModal(true)}>
              <img
                src={profilePicPreview}
                alt="Profile Preview"
                className="w-24 h-24 rounded-full border mb-2 object-cover transition-all duration-300 group-hover:opacity-75 group-hover:shadow-lg"
                onError={(e) => { e.target.src = '/images/default-profile.jpg'; }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black bg-opacity-60 rounded-full p-2 transform group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-xs text-blue-600 text-center mt-1 opacity-80">Click to change</div>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleProfilePicChange}
              className="hidden"
            />
            {uploading && <div className="text-blue-600 text-sm mt-1">Uploading...</div>}
            
            {/* Image Preview Modal */}
            {showImageModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 animate-fadeIn">
                <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-2xl transform transition-all animate-fadeIn">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Profile Picture</h3>
                    <button 
                      type="button" 
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() => setShowImageModal(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="relative mb-6 group">
                      <img
                        src={profilePicPreview}
                        alt="Profile Preview"
                        className="w-64 h-64 rounded-lg object-cover shadow-lg border-2 border-gray-200"
                        onError={(e) => { e.target.src = '/images/default-profile.jpg'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex flex-col justify-end p-3">
                        <p className="text-white text-sm">Click below to change your profile picture</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        fileInputRef.current.click();
                        setShowImageModal(false);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 transform hover:scale-105"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                      </svg>
                      Upload New Image
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">Last Name (optional)</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* New Password section (single input for all roles) */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reset Password link/modal for admin/superadmin editing any account */}
          {(editorRole === 'admin' || editorRole === 'superadmin') && (
            <div className="mb-4">
              <button
                type="button"
                className="text-blue-600 text-sm hover:text-blue-800"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                disabled={resetting}
                onClick={() => setShowResetConfirm(true)}
              >Reset password</button>
              {showResetConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 animate-fadeIn">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                    <div className="mb-4 text-gray-800">
                      Are you sure you want to reset this account password to the default?
                      <div className="mt-2 p-3 bg-gray-100 rounded-md">
                        <span className="font-medium">Default password for {account.role} accounts: </span>
                        <span className="font-semibold text-blue-700">{account.role === 'admin' ? 'admin123' : 'userpassword'}</span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
                        onClick={() => setShowResetConfirm(false)}
                      >Cancel</button>
                      <button
                        className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        disabled={resetting}
                        onClick={async () => {
                          setResetting(true);
                          setError('');
                          setSuccess('');
                          try {
                            const res = await fetch(`http://localhost:5000/api/auth/account/${account.id}/reset-password`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            const data = await res.json();
                            if (data.success) {
                              const defaultPassword = account.role === 'admin' ? 'admin123' : 'userpassword';
                              setSuccess(`Password has been reset to "${defaultPassword}"`);
                            } else if (!handleTokenError(data.message)) {
                              // Only set error if it's not a token error (which is already handled)
                              setError(data.message || 'Failed to reset password.');
                            }
                          } catch (err) {
                            setError('Failed to reset password.');
                          }
                          setResetting(false);
                          setShowResetConfirm(false);
                        }}
                      >Reset Password</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Message container at the bottom */}
          {(error || success) && (
            <div className="mt-4 mb-2">
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
          
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
