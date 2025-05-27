import React, { useState, useEffect } from "react";

// Header is sticky and styled for modern UX
export default function Header({ username, role, onProfileClick, onLogout }) {
  const [profilePicture, setProfilePicture] = useState('/images/default-profile.jpg');
  
  // Fetch user profile data including profile picture
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('http://localhost:5000/api/auth/profile', {
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
  }, [username]);

  return (
    <header className="w-full h-16 bg-white border-b flex justify-between items-center px-8 shadow-md sticky top-0 z-40">
      <div />
      <div className="flex-1 flex items-center gap-3">
        <span className="ml-4 px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 font-semibold uppercase">{role}</span>
      </div>
      <div className="flex items-center gap-6">
        <button
          className="flex items-center gap-2 focus:outline-none hover:bg-blue-50 px-3 py-1 rounded transition-colors group"
          onClick={onProfileClick}
          title="Edit your profile"
        >
          <span className="font-semibold text-blue-900 group-hover:text-blue-700">{username}</span>
          <div className="relative">
            <img
              src={profilePicture}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-blue-500 transition-all duration-200 shadow-sm"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${username}&background=1976d2&color=fff&size=32`;
              }}
            />
            <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
        </button>
        <button className="text-sm text-red-600 hover:underline font-medium" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
