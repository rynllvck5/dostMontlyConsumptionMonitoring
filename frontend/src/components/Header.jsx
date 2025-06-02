import React, { useState, useEffect } from "react";

// Header is sticky and styled for modern UX
export default function Header({ fullName, email, role, onProfile, onLogout, onSidebarToggle }) {
  const [profilePicture, setProfilePicture] = useState('/images/default-profile.jpg');
  
  // Fetch user profile data including profile picture
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
        const response = await fetch(`${API_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.profile_picture) {
            setProfilePicture(`/images/${userData.profile_picture}`);
          }
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };
    
    fetchUserProfile();
  }, [email]);

  return (
    <header className="w-full h-16 bg-white border-b flex justify-between items-center px-8 shadow-md sticky top-0 z-40">
      <div />
      <div className="flex-1 flex items-center gap-3">
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 hover:bg-blue-50 rounded-full transition-colors mr-3"
          title="Toggle sidebar"
          type="button"
          onClick={onSidebarToggle}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-6">
        {/* Notification Bell - separate clickable area */}
        <button
          className="flex items-center justify-center w-9 h-9 hover:bg-blue-50 rounded-full transition-colors mr-3"
          title="Notifications"
          type="button"
          // onClick={() => { /* Notification click handler soon */ }}
        >
          <img src="/images/notification-bell.svg" alt="Notifications" className="w-5 h-5" />
        </button>
        {/* Separator between bell and profile button */}
        <span className="mx-3 h-5 border-l border-blue-300" />
        {/* Edit Profile Button - only wraps name and profile picture */}
        <button
          className="flex items-center gap-2 focus:outline-none hover:bg-blue-50 px-3 py-1 rounded transition-colors group"
          onClick={onProfile}
          title="Edit your profile"
        >
          <span className="font-semibold text-blue-900 group-hover:text-blue-700">
            {fullName}
          </span>
          <div className="relative">
            <img
              src={profilePicture}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-blue-500 transition-all duration-200 shadow-sm"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(email || fullName)}&background=1976d2&color=fff&size=32`;
              }}
            />
            <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}
