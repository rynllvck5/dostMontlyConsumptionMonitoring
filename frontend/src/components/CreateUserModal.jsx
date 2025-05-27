import React, { useState, useRef } from "react";

export default function CreateUserModal({ open, onClose, onCreate, role }) {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState('/images/default-profile.jpg');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    let profilePicFilename = null;
    if (!username || !password || !confirmPassword) {
      setError("Username, password, and confirm password are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // Call parent handler to create user first
    const result = await onCreate({
      username,
      password,
      role, // Use the current role state
      first_name: firstName,
      last_name: lastName
      // Don't send profile_picture yet
    });
    if (result && result.success && result.id && profilePicFile) {
      // Upload profile picture with admin token and userId
      setUploading(true);
      const formData = new FormData();
      formData.append('profile_picture', profilePicFile);
      formData.append('userId', result.id); // Use new user's id
      try {
        const uploadRes = await fetch('http://localhost:5000/api/auth/upload-profile-picture', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Use admin token
          },
          body: formData
        });
        const uploadData = await uploadRes.json();
        setUploading(false);
        if (uploadData && uploadData.success && uploadData.filename) {
          profilePicFilename = uploadData.filename;
        } else {
          setError(uploadData.message || 'Failed to upload profile picture.');
          return;
        }
      } catch (err) {
        setUploading(false);
        setError('Failed to upload profile picture.');
        return;
      }
    }
    if (result && result.success) {
      const accountType = role === 'admin' ? 'Admin' : 'User';
      setSuccess(`${accountType} account "${username}" was created successfully!`);
      // Clear form fields
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setFirstName("");
      setLastName("");
      setProfilePicFile(null);
      setProfilePicPreview('/images/default-profile.jpg');
      // Close modal after a delay
      setTimeout(() => onClose(), 1500);
    } else {
      // Handle specific error messages
      if (result && result.message) {
        if (result.message.includes('Username already exists')) {
          setError(`The username "${username}" already exists. Please choose a different username.`);
        } else {
          setError(result.message);
        }
      } else {
        setError("Failed to create user account. Please try again.");
      }
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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative animate-fadeIn">
        <h2 className="text-2xl font-bold mb-6 text-center">{role === 'admin' ? 'Create Admin' : 'Create User'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Role selection removed; role is determined by parent context */}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name (optional)</label>
            <input
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700 text-lg px-1"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12.001C3.226 16.338 7.322 19.5 12 19.5c1.7 0 3.304-.356 4.736-.995M21.002 15.584A10.45 10.45 0 0022.066 12c-1.292-4.337-5.388-7.5-10.066-7.5-1.132 0-2.224.186-3.24.528" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0 2.485 2.485 7.5 9.75 7.5s9.75-5.015 9.75-7.5S19.515 4.5 12 4.5 2.25 9.515 2.25 12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
              <button
                type="button"
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-blue-200 rounded transition-colors whitespace-nowrap"
                onClick={() => setPassword(role === 'admin' ? 'admin123' : 'userpassword')}
              >
                Use Default
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700 text-lg px-1"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(v => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12.001C3.226 16.338 7.322 19.5 12 19.5c1.7 0 3.304-.356 4.736-.995M21.002 15.584A10.45 10.45 0 0022.066 12c-1.292-4.337-5.388-7.5-10.066-7.5-1.132 0-2.224.186-3.24.528" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0 2.485 2.485 7.5 9.75 7.5s9.75-5.015 9.75-7.5S19.515 4.5 12 4.5 2.25 9.515 2.25 12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
              <button
                type="button"
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-blue-200 rounded transition-colors whitespace-nowrap"
                onClick={() => setConfirmPassword(role === 'admin' ? 'admin123' : 'userpassword')}
              >
                Use Default
              </button>
            </div>
          </div>
          {/* Message container */}
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
            <button
              type="button"
              className="px-5 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-colors"
            >
              Create
            </button>
          </div>
        </form>
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
