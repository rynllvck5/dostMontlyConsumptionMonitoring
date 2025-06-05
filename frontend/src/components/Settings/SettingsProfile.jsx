import React, { useState, useRef, useEffect } from 'react';
import { handleTokenError } from '../../utils/auth.jsx';

import { UserIcon, CameraIcon, Cog6ToothIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline';

export default function SettingsProfile() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [offices, setOffices] = useState([]);
  const [officeAccountNo, setOfficeAccountNo] = useState('');
  const [buildingDescription, setBuildingDescription] = useState('');
  const [buildingAccountNo, setBuildingAccountNo] = useState('');
  const [grossArea, setGrossArea] = useState('');
  const [airConditionedArea, setAirConditionedArea] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePicPreview, setProfilePicPreview] = useState('/images/uploaded-profile-pics/default-profile.jpg');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const [loading, setLoading] = useState(true);

  // Fetch offices for dropdown
  useEffect(() => {
    async function loadOffices() {
      try {
        const token = localStorage.getItem('token');
        const res = await import('../../api.js').then(api => api.fetchOffices(token));
        setOffices(res);
      } catch (e) {
        setOffices([]);
      }
    }
    loadOffices();
  }, []);

  useEffect(() => {
    // Fetch the current user's profile
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
        const res = await fetch(`${API_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setEmail(userData.email || '');
          setFirstName(userData.first_name || '');
          setLastName(userData.last_name || '');
          setOfficeId(userData.office_id || '');
          setOfficeName(userData.office_name || '');
          if (userData.profile_picture) {
            setProfilePicPreview(userData.profile_picture.startsWith('http')
              ? userData.profile_picture
              : `/images/uploaded-profile-pics/${userData.profile_picture}`);
          }
        } else if (res.status === 403) {
          handleTokenError('Invalid token');
        } else {
          setError('Failed to load profile data.');
        }
      } catch (e) {
        setError('Failed to load profile data.');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    let newProfilePicFilename = null;
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('A valid email is required.');
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
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
        const uploadRes = await fetch(`${API_URL}/upload-profile-picture`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
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
      // Update profile info
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          office_id: officeId,
          ...(password ? { password, currentPassword } : {}),
          profile_picture: newProfilePicFilename || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setPassword('');
        setCurrentPassword('');
        setSuccess('Profile updated successfully.');
      } else {
        if (data.message && data.message.includes('Email already exists')) {
          setError(`The email "${email}" is already taken.`);
        } else if (handleTokenError(data.message)) {
          // Token error handled
        } else {
          setError(data.message || 'Failed to update profile. Please try again.');
        }
      }
    } catch (err) {
      setUploading(false);
      setError('An unexpected error occurred. Please try again or contact support.');
      console.error('Error updating profile:', err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start justify-center w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-0 py-5 px-2 md:px-8 gap-6">
      {/* Sidebar/Profile Card */}
      {/* Profile Picture Sidebar */}
      <aside className="w-full md:w-1/3 max-w-sm mb-4 md:mb-0">
        <div className="relative overflow-visible bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-100 p-0 pt-2 flex flex-col items-center glass-card mx-auto min-h-[220px]">
          {/* Floating Avatar with Glass Ring */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 group cursor-pointer w-20 h-20 flex items-center justify-center" onClick={() => fileInputRef.current.click()}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-300/40 to-blue-100/80 rounded-full blur opacity-70 animate-pulse"></div>
            {profilePicPreview && !profilePicPreview.includes('default-profile.jpg') ? (
              <img
                src={profilePicPreview}
                alt="Profile Preview"
                className="w-16 h-16 rounded-full object-cover border-4 border-white shadow ring-2 ring-blue-200 group-hover:scale-105 transition-transform duration-200"
                onError={e => { e.target.src = '/images/uploaded-profile-pics/default-profile.jpg'; }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-200 flex items-center justify-center border-4 border-white shadow ring-2 ring-blue-200 text-2xl font-extrabold text-white select-none group-hover:scale-105 transition-transform duration-200">
                {firstName?.[0]?.toUpperCase() || ''}{lastName?.[0]?.toUpperCase() || ''}
              </div>
            )}
            <button type="button" className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow hover:bg-blue-700 transition duration-150 ring ring-white" title="Change Photo">
              <CameraIcon className="h-3 w-3" />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleProfilePicChange}
              className="hidden"
            />
            {uploading && <div className="absolute left-1/2 -bottom-5 -translate-x-1/2 text-blue-600 text-xs animate-pulse">Uploading...</div>}
          </div>
          {/* Profile Info Card */}
          <div className="flex flex-col items-center justify-center w-full mt-6 pb-2 px-2">
            <h4 className="font-extrabold text-lg text-blue-900 mb-2 drop-shadow-sm tracking-tight">{firstName} {lastName}</h4>
            <div className="flex items-center gap-1 justify-center text-blue-700 text-sm mb-1">
              <EnvelopeIcon className="h-4 w-4" /> {email}
            </div>
            <div className="inline-flex items-center gap-1 bg-blue-100/80 text-blue-700 text-xs px-2 py-1 rounded font-bold shadow-sm mt-1 mb-2">
              <UserIcon className="h-4 w-4 text-blue-400" /> {officeName}
            </div>
          </div>
        </div>
      </aside>
      {/* Main Form */}
      <main className="w-full md:w-2/3 max-w-2xl flex-1">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-100 p-0 pt-4 pb-4 px-8 mx-auto glass-card relative overflow-visible">
          {/* Animated Section Header */}
          <h2 className="text-xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-600 bg-clip-text text-transparent mb-2 flex items-center gap-1 drop-shadow">
            <Cog6ToothIcon className="h-5 w-5 text-blue-500 animate-spin-slow" /> Account Settings
          </h2>
          {loading ? (
            <div className="text-blue-400 text-lg font-semibold">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info Section */}
              <section className="bg-white/90 backdrop-blur rounded shadow border border-blue-100 px-3 py-2 mb-4">
                <h3 className="text-sm font-extrabold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-2 flex items-center gap-1">
                  <UserIcon className="h-4 w-4 text-blue-400" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2 text-xs">First Name</label>
                    <input
                      type="text"
                      className="block w-full border border-blue-200 rounded shadow-sm py-2 px-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-xs bg-blue-50/50 transition-all duration-100 hover:shadow"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                      aria-label="First Name"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2 text-xs">Last Name</label>
                    <input
                      type="text"
                      className="block w-full border border-blue-200 rounded shadow-sm py-2 px-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-xs bg-blue-50/50 transition-all duration-100 hover:shadow"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                      aria-label="Last Name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-gray-700 font-semibold mb-0.5 text-xs flex items-center gap-1"><EnvelopeIcon className="h-3 w-3" /> Email Address</label>
                    <input
                      type="email"
                      className="mt-0.5 block w-full border border-blue-100 rounded shadow-sm py-1 px-2 bg-gray-100 text-xs cursor-not-allowed transition-all duration-100"
                      value={email}
                      disabled
                      aria-label="Email Address"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-1 mb-0.5">
                      <label className="text-xs font-semibold text-blue-700 flex items-center gap-0.5">
                        <UserIcon className="h-3 w-3 text-blue-500" /> Office
                      </label>
                      <span className="relative group">
                        <svg className="h-3 w-3 text-gray-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01"/></svg>
                        <span className="absolute left-1/2 -translate-x-1/2 mt-1 w-40 bg-gray-900 text-white text-[10px] rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 text-center pointer-events-none">This is your assigned office/unit and cannot be changed here.</span>
                      </span>
                    </div>
                    <div className="rounded border border-blue-100 bg-blue-50 px-2 py-1 flex items-center gap-1 shadow-sm">
                      <UserIcon className="h-3 w-3 text-blue-400" />
                      <span className="text-xs font-bold text-blue-900 select-text tracking-tight">{officeName || '—'}</span>
                    </div>
                    <div className="text-[10px] text-blue-500 mt-0.5 ml-0.5 italic">Contact your administrator to request an office/unit change.</div>
                  </div>
                </div>
              </section>
              <hr className="my-2 border-blue-100" />
              {/* Account Security Section */}
              <section className="bg-white/90 backdrop-blur rounded shadow border border-blue-100 px-3 py-2 mb-4">
                <h3 className="text-sm font-extrabold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-2 flex items-center gap-1">
                  <KeyIcon className="h-4 w-4 text-blue-400" /> Account Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2 text-xs">New Password</label>
                    <input
                      type="password"
                      className="block w-full border border-blue-200 rounded shadow-sm py-2 px-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-xs bg-blue-50/50 transition-all duration-100 hover:shadow"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      aria-label="New Password"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-0.5 text-xs">Current Password <span className="text-[10px] text-gray-400">{password ? '(required to change password)' : '(not required for profile changes)'}</span></label>
                    <input
                      type="password"
                      className="block w-full border border-blue-200 rounded shadow-sm py-2 px-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-xs bg-blue-50/50 transition-all duration-100 hover:shadow"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      required={!!password}
                      disabled={!password}
                      aria-label="Current Password"
                    />
                  </div>
                </div>
              </section>
              {/* Feedback Messages - Toast style */}
              {(error || success) && (
                <div className="fixed top-2 right-2 z-50 animate-slide-in">
                  {error && (
                    <div className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded shadow text-xs font-semibold mb-1 relative">
                      <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-1.414-1.414A9 9 0 103 12h2a7 7 0 1111.95-4.95l1.414-1.414z" /></svg>
                      <span>{error}</span>
                      <button type="button" className="absolute top-1 right-1 text-red-400 hover:text-red-600" aria-label="Dismiss error" onClick={() => setError('')}>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded shadow text-xs font-semibold mb-1 relative">
                      <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      <span>{success}</span>
                      <button type="button" className="absolute top-1 right-1 text-green-400 hover:text-green-600" aria-label="Dismiss success" onClick={() => setSuccess('')}>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 text-white font-bold rounded hover:scale-105 hover:from-blue-800 hover:to-blue-500 transition-all text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 gap-1"
                  disabled={uploading}
                  aria-label="Save Changes"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-1" /> Save
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
