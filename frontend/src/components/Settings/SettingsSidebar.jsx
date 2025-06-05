import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

export default function SettingsSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-blue-900 text-white flex flex-col pt-24 shadow-2xl z-50">
      <div className="flex-1 flex flex-col">
        <NavLink
          to="/pmo/settings/profile"
          className={({ isActive }) => `mx-3 px-4 py-3 text-sm font-medium text-left flex items-center gap-3 rounded-lg transition-all duration-200 ease-in-out ${isActive ? 'bg-blue-700' : 'hover:bg-blue-800/80 active:bg-blue-800/90'}`}
        >
          <img src="/images/profile.svg" alt="Profile" className="w-6 h-6" />
          Profile
        </NavLink>
        <NavLink
          to="/pmo/settings/office"
          className={({ isActive }) => `mx-3 px-4 py-3 text-sm font-medium text-left flex items-center gap-3 rounded-lg transition-all duration-200 ease-in-out ${isActive ? 'bg-blue-700' : 'hover:bg-blue-800/80 active:bg-blue-800/90'}`}
        >
          <img src="/images/office.svg" alt="Office" className="w-6 h-6" />
          Office
        </NavLink>
        <div className="flex-1" />
        <button
          onClick={() => {
            const lastNonSettings = sessionStorage.getItem('last_non_settings_path');
            if (lastNonSettings) {
              navigate(lastNonSettings, { replace: true });
            } else {
              navigate('/');
            }
          }}
          className="mx-3 mb-3 px-4 py-3 flex items-center justify-center gap-3 text-white font-medium text-sm rounded-lg focus:outline-none transition-all duration-200 ease-in-out hover:bg-blue-800/80 active:bg-blue-800/90"
          style={{ position: 'absolute', bottom: 0, left: 0, width: 'calc(100% - 1.5rem)' }}
        >
          <img src="/images/back.svg" alt="Back" className="w-6 h-6" />
          Back
        </button>
      </div>
    </aside>
  );
}
