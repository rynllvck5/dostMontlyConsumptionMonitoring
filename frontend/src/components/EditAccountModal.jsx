import React, { useState, useRef } from 'react';
import { handleTokenError } from '../utils/auth.jsx';

export default function EditAccountModal({ account, token, editorRole, onClose }) {
  console.log('Edit account data:', account);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [email, setEmail] = useState(account.email);
  const [firstName, setFirstName] = useState(account.first_name || '');
  const [lastName, setLastName] = useState(account.last_name || '');
  const [officeId, setOfficeId] = useState(account.office_id || '');
  const [offices, setOffices] = useState([]);
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetting, setResetting] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState(
    account.profile_picture 
      ? account.profile_picture.startsWith('http') 
        ? account.profile_picture 
        : `/images/uploaded-profile-pics/${account.profile_picture}` 
      : '/images/uploaded-profile-pics/default-profile.jpg'
  );
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  // Fetch offices for dropdown
  React.useEffect(() => {
    async function loadOffices() {
      try {
        const token = localStorage.getItem('token');
        const res = await import('../api.js').then(api => api.fetchOffices(token));
        setOffices(res);
      } catch (e) {
        setOffices([]);
      }
    }
    loadOffices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    let newProfilePicFilename = null;
    // Email validation: must be valid email format
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('A valid email is required.');
      return;
    }
    if (!firstName || firstName.trim().length === 0) {
      setError('First Name is required.');
      return;
    }
    if (!officeId) {
      setError('Please select an Office.');
      return;
    }
    try {
      // If a new profile picture file is selected, upload it first
      if (profilePicFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('profile_picture', profilePicFile);
        // Always include userId for admin/superadmin edits
        if (account && account.id) {
          formData.append('userId', account.id);
        }
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
        const currentToken = localStorage.getItem('token');
        const uploadRes = await fetch(`${API_URL}/upload-profile-picture`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
      const currentToken = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/account/${account.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          office_id: officeId,
          password: password || undefined,
          currentPassword: (account.role === 'user' && editorRole === 'user') ? currentPassword : undefined,
          profile_picture: newProfilePicFilename || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setPassword('');
        setCurrentPassword('');
        setSuccess(`Account for ${email} was updated successfully.`);
        setTimeout(onClose, 1500);
      } else {
        // Handle specific error messages
        if (data.message && data.message.includes('Email already exists')) {
          setError(`The email "${email}" is already taken.`);
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

          {/* ...all form contents as previously structured... */}
          <div className="mb-4 flex flex-col items-center">
            <label className="block text-gray-700 font-medium mb-1">Profile Picture</label>
            <div className="relative group cursor-pointer" onClick={() => setShowImageModal(true)}>
              <img
                src={profilePicPreview}
                alt="Profile Preview"
                className="w-24 h-24 rounded-full border mb-2 object-cover transition-all duration-300 group-hover:opacity-75 group-hover:shadow-lg"
                onError={(e) => { e.target.src = '/images/uploaded-profile-pics/default-profile.jpg'; }}
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
          </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Email</label>
          <input
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">First Name <span className="text-red-600">*</span></label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Office</label>
          <select
            value={officeId}
            onChange={e => setOfficeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an office</option>
            {offices.map(office => (
              <option key={office.office_id} value={office.office_id}>
                {office.name}
              </option>
            ))}
          </select>
        </div>
        {/* New Password Field */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter new password."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Reset Password Button - now below New Password */}
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
      {/* Success/Error Message for Reset Password */}

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center justify-between animate-fadeIn">
          <span className="text-red-700 font-medium">{error}</span>
          <button onClick={() => setError("")} className="ml-4 text-red-700 hover:text-red-900 font-bold">&times;</button>
        </div>
      )}
      <div className="mb-4 text-lg font-semibold text-gray-800 text-center">
        <div>You are about to reset the password for:</div>
        <div className="mt-2 text-base font-medium text-blue-700">
          {account.email}
          {account.first_name || account.last_name ? (
            <span> &mdash; {account.first_name} {account.last_name}</span>
          ) : null}
        </div>
        <div className="mt-4 text-base text-gray-700">The password will be set to:</div>
        <div className="mt-1 mb-2 px-4 py-2 bg-gray-100 rounded font-mono text-lg text-blue-900 border border-blue-200 inline-block select-all">
          {account.role === 'admin' ? 'admin123' : 'pmopassword'}
        </div>
      </div>
      {resetting && (
        <div className="text-blue-600 text-center mb-2">Resetting password...</div>
      )}
      <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium transition-colors"
                      onClick={() => {
                        setShowResetConfirm(false);
                        setError("");
                        setSuccess("");
                      }}
                      disabled={resetting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors"
                      onClick={async () => {
                        setResetting(true);
                        setError("");
                        setSuccess("");
                        try {
                          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
                          const currentToken = localStorage.getItem('token');
                          const res = await fetch(`${API_URL}/reset-password`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${currentToken}`
                            },
                            body: JSON.stringify({ id: account.id })
                          });
                          const data = await res.json();
                          setResetting(false);
                          if (data.success) {
                            setSuccess('Password was reset to the default successfully.');
                            setShowResetConfirm(false);
                            setTimeout(() => {
                              setSuccess("");
                              
                            }, 2000);
                          } else {
                            setError(data.message || 'Failed to reset password.');
                          }
                        } catch (err) {
                          setResetting(false);
                          setError('An unexpected error occurred.');
                        }
                      }}
                      disabled={resetting}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Save/Cancel Buttons or Success/Error Message at Bottom */}
        <div className="flex justify-end gap-3 mt-6 items-center min-h-[48px]">
          {success ? (
            <div className="w-full flex justify-center">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md text-green-700 font-medium animate-fadeIn w-full text-center">
                {success}
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors"
              >
                Save Changes
              </button>
              {error && (
                <div className="ml-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-md text-red-700 font-medium animate-fadeIn flex items-center">
                  {error}
                  <button onClick={() => setError("")} className="ml-2 text-red-700 hover:text-red-900 font-bold">&times;</button>
                </div>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  </div>
  );
}
