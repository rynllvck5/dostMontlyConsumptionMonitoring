import React, { useState, useRef, useEffect } from "react";
import { handleTokenError } from "../utils/auth.jsx";

// ProfileModal styled for modern modal UX
export default function ProfileModal({ user, open, onClose }) {
  const [username, setUsername] = useState(user.username || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState("/images/default-profile.jpg");
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");
  const fileInputRef = useRef();

  // Fetch user profile data
  useEffect(() => {
    if (!open) return;
    
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const response = await fetch("http://localhost:5000/api/auth/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUsername(userData.username || "");
          setFirstName(userData.first_name || "");
          setLastName(userData.last_name || "");
          
          if (userData.profile_picture) {
            setProfilePicture(`/images/${userData.profile_picture}`);
          } else {
            setProfilePicture("/images/default-profile.jpg");
          }
        } else if (response.status === 403) {
          handleTokenError("Invalid token");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [open]);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    // Validate passwords if changing
    if (newPassword) {
      if (!currentPassword) {
        setError("Current password is required to set a new password");
        setSaving(false);
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        setSaving(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in");
        setSaving(false);
        return;
      }

      // First upload profile picture if changed
      let newProfilePicFilename = null;
      if (profilePicFile) {
        const formData = new FormData();
        formData.append("profile_picture", profilePicFile);
        
        const uploadRes = await fetch("http://localhost:5000/api/auth/upload-profile-picture", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
        
        const uploadData = await uploadRes.json();
        
        if (uploadData.success && uploadData.filename) {
          newProfilePicFilename = uploadData.filename;
        } else if (!handleTokenError(uploadData.message)) {
          setError(uploadData.message || "Failed to upload profile picture");
          setSaving(false);
          return;
        }
      }

      // Then update profile details
      const updateData = {
        username: username,
        first_name: firstName,
        last_name: lastName
      };

      if (newPassword) {
        updateData.password = newPassword;
        updateData.currentPassword = currentPassword;
      }

      if (newProfilePicFilename) {
        updateData.profile_picture = newProfilePicFilename;
      }

      const updateRes = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const updateData2 = await updateRes.json();
      
      if (updateData2.success) {
        setSuccess("Profile updated successfully");
        setNewPassword("");
        setConfirmPassword("");
        setCurrentPassword("");
        
        // Refresh the page after a delay to show updated profile
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else if (!handleTokenError(updateData2.message)) {
        setError(updateData2.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("An error occurred while updating your profile");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative animate-fadeIn my-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-6 text-blue-900 sticky top-0 bg-white pt-2 z-10">Edit Profile</h3>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6 flex flex-col items-center">
              <div className="relative group cursor-pointer mb-4" onClick={() => setShowImageModal(true)}>
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-md transition-all duration-300 group-hover:opacity-80"
                  onError={(e) => { e.target.src = "/images/default-profile.jpg"; }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-black bg-opacity-60 rounded-full p-2 transform group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleProfilePicChange}
                className="hidden"
              />
              <p className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer" onClick={() => setShowImageModal(true)}>
                Change Profile Picture
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
            
            <div className="border-t border-gray-200 my-6 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-800">Change Password</h4>
                {user.role === 'superadmin' && (
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowResetModal(true);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset to Default
                  </button>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
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
            
            {/* Buttons at the bottom of the content */}
            <div className="mt-8 pt-4 border-t border-gray-100">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-5 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold transition-colors"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-colors flex items-center"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
        
        {/* Image Preview Modal */}
        {showImageModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 animate-fadeIn p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-2xl transform transition-all animate-fadeIn my-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 z-10">
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
                    src={profilePicture}
                    alt="Profile"
                    className="w-64 h-64 rounded-lg object-cover shadow-lg border-2 border-gray-200"
                    onError={(e) => { e.target.src = "/images/default-profile.jpg"; }}
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
        
        <button
          className="fixed top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md z-20"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {/* Reset Password Modal for Superadmin */}
        {showResetModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 animate-fadeIn p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Reset Password</h3>
                <button 
                  type="button" 
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetError("");
                    setResetSuccess("");
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Are you sure you want to reset your password to the default? 
                        <br />
                        <span className="font-medium">Default password: dostsuperadmin123</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                {resetError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 animate-fadeIn">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{resetError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {resetSuccess && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 animate-fadeIn">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">{resetSuccess}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-medium transition-colors"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetError("");
                    setResetSuccess("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors flex items-center"
                  onClick={async () => {
                    setResetting(true);
                    setResetError("");
                    setResetSuccess("");
                    
                    try {
                      const token = localStorage.getItem("token");
                      if (!token) {
                        setResetError("You are not logged in");
                        setResetting(false);
                        return;
                      }
                      
                      // Reset password to default for superadmin
                      const resetData = {
                        password: "dostsuperadmin123"
                      };
                      
                      const resetRes = await fetch("http://localhost:5000/api/auth/profile/reset-password", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify(resetData)
                      });
                      
                      const resetDataResponse = await resetRes.json();
                      
                      if (resetDataResponse.success) {
                        setResetSuccess("Password has been reset to default successfully");
                        setTimeout(() => {
                          setShowResetModal(false);
                          setResetError("");
                          setResetSuccess("");
                        }, 2000);
                      } else if (!handleTokenError(resetDataResponse.message)) {
                        setResetError(resetDataResponse.message || "Failed to reset password");
                      }
                    } catch (error) {
                      console.error("Error resetting password:", error);
                      setResetError("An error occurred while resetting password");
                    } finally {
                      setResetting(false);
                    }
                  }}
                  disabled={resetting}
                >
                  {resetting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
